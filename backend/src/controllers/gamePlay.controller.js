import { GameRoom } from "../models/game-room.model.js";
import { User } from "../models/user.model.js";
import { Round } from "../models/rounds.model.js";

const roomState = new Map(); // roomId (string) -> { timer, activeRoundNumber, policeId, instruction, resolved }

const shuffleArray = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Compute leaderboard and winners (handles ties), then emit via io
 */
const computeAndBroadcastWinner = async (roomId, io) => {
  const rid = String(roomId);
  const players = await User.find({ roomId: rid }).select("_id name score").sort({ score: -1, name: 1 });
  if (!players || players.length === 0) return null;

  const leaderboard = players.map((p) => ({ id: p._id.toString(), name: p.name, score: p.score || 0 }));
  const topScore = leaderboard[0].score || 0;
  const winners = leaderboard.filter((p) => p.score === topScore);

  io.to(rid).emit("gameWinner", { winners, leaderboard });
  return { winners, leaderboard };
};

const startRound = async (roomId, io) => {
  const rid = String(roomId);
  const room = await GameRoom.findById(rid);
  if (!room || room.gameStatus !== "in_progress") return;

  if (room.totalRounds && room.currentRound > room.totalRounds) {
    room.gameStatus = "finished";
    await room.save();
    // ensure timer cleared if any
    const st0 = roomState.get(rid);
    if (st0?.timer) clearTimeout(st0.timer);
    roomState.delete(rid);

    io.to(rid).emit("gameFinished");
    await computeAndBroadcastWinner(rid, io);
    return;
  }

  const players = await User.find({ roomId: rid }).select("_id name socketId");
  if (players.length !== 4) {
    io.to(rid).emit("error", { message: "Need 4 players to continue" });
    return;
  }

  const roles = shuffleArray(["King", "Police", "Chor", "Dakat"]);
  const roleAssignments = {};
  await Promise.all(
    players.map((p, i) => {
      roleAssignments[roles[i]] = p._id;
      return User.updateOne({ _id: p._id }, { $set: { role: roles[i] } });
    })
  );

  const freshPlayers = await User.find({ roomId: rid }).select("_id name role socketId");
  freshPlayers.forEach((p) => {
    if (p.socketId) {
      io.to(p.socketId).emit("yourRole", { role: p.role });
    }
  });

  const instruction = Math.random() > 0.5 ? "Find Chor" : "Find Dakat";
  room.currentInstruction = instruction;
  await room.save();

  io.to(rid).emit("roundStarted", { roundNumber: room.currentRound, instruction, time: 15 });

  const policePlayer = freshPlayers.find((p) => p.role === "Police");
  const state = {
    activeRoundNumber: room.currentRound,
    policeId: policePlayer ? policePlayer._id.toString() : null,
    instruction,
    timer: null,
    resolved: false,
  };
  roomState.set(rid, state);

  if (policePlayer && policePlayer.socketId) {
    io.to(policePlayer.socketId).emit("policeInstruction", { instruction });
  }

  state.timer = setTimeout(async () => {
    if (state.resolved) return;
    await finalizeRoundAsNoGuess(rid, io);
  }, 15000);
};

const finalizeRoundAsNoGuess = async (roomId, io) => {
  const rid = String(roomId);
  const state = roomState.get(rid);
  if (!state) return;
  state.resolved = true;

  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }

  const room = await GameRoom.findById(rid);
  const players = await User.find({ roomId: rid });

  const king = players.find((p) => p.role === "King");
  players.forEach((p) => {
    if (p.role === "King") p.score += 1000;
    else if (p.role === "Chor") p.score += 400;
    else if (p.role === "Dakat") p.score += 600;
  });
  await Promise.all(players.map((p) => p.save()));

  await Round.create({
    roomId: rid,
    roundNumber: state.activeRoundNumber,
    instruction: state.instruction,
    policeId: state.policeId,
    guessedUserId: null,
    targetRole: state.instruction === "Find Chor" ? "Chor" : "Dakat",
    isCorrect: false,
    roleAssignments: {
      king: players.find((p) => p.role === "King")._id,
      police: players.find((p) => p.role === "Police")._id,
      chor: players.find((p) => p.role === "Chor")._id,
      dakat: players.find((p) => p.role === "Dakat")._id,
    },
    scoreChanges: players.map((p) => ({ userId: p._id, points: p.score })),
    guessedAt: new Date(),
  });

  io.to(rid).emit("roundResult", { success: false, message: "No guess made in time" });

  const leaderboard = await User.find({ roomId: rid }).sort({ score: -1 }).select("name score role");
  io.to(rid).emit("leaderboard", leaderboard);

  io.to(rid).emit("revealRoles", players.map((p) => ({ name: p.name, role: p.role })));

  setTimeout(async () => {
    room.currentRound += 1;
    await room.save();
    // cleanup
    // ensure any timer cleared
    const st = roomState.get(rid);
    if (st?.timer) clearTimeout(st.timer);
    roomState.delete(rid);

    if (room.totalRounds && room.currentRound > room.totalRounds) {
      room.gameStatus = "finished";
      await room.save();
      io.to(rid).emit("gameFinished");
      await computeAndBroadcastWinner(rid, io);
    } else {
      await startRound(rid, io);
    }
  }, 5000);
};

const handlePoliceGuess = async (roomId, policeId, guessedUserId, io, socket) => {
  const rid = String(roomId);
  const state = roomState.get(rid);
  if (!state || state.resolved) {
    socket.emit("error", { message: "No active round or already resolved" });
    return;
  }
  if (state.policeId !== policeId) {
    socket.emit("error", { message: "You are not the police for this round" });
    return;
  }

  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
  state.resolved = true;

  const room = await GameRoom.findById(rid);
  const players = await User.find({ roomId: rid });
  const police = players.find((p) => p._id.toString() === policeId);
  const guessed = players.find((p) => p._id.toString() === guessedUserId);
  const king = players.find((p) => p.role === "King");

  const targetRole = state.instruction === "Find Chor" ? "Chor" : "Dakat";
  let isCorrect = false;

  if (guessed && guessed.role === targetRole) {
    isCorrect = true;
    police.score += 800;
    king.score += 1000;

    const remaining = players.find(
      (p) =>
        ![police._id.toString(), guessed._id.toString(), king._id.toString()].includes(p._id.toString())
    );
    if (remaining) remaining.score += remaining.role === "Chor" ? 400 : 600;
  } else {
    king.score += 1000;
    players.forEach((p) => {
      if (p._id.toString() !== police._id.toString() && p._id.toString() !== king._id.toString()) {
        if (p.role === "Chor") p.score += 400;
        else if (p.role === "Dakat") p.score += 600;
      }
    });
  }

  await Promise.all(players.map((p) => p.save()));

  await Round.create({
    roomId: rid,
    roundNumber: state.activeRoundNumber,
    instruction: state.instruction,
    policeId,
    guessedUserId,
    targetRole,
    isCorrect,
    roleAssignments: {
      king: king._id,
      police: police._id,
      chor: players.find((p) => p.role === "Chor")._id,
      dakat: players.find((p) => p.role === "Dakat")._id,
    },
    scoreChanges: players.map((p) => ({ userId: p._id, points: p.score })),
    guessedAt: new Date(),
  });

  io.to(rid).emit("roundResult", {
    isCorrect,
    message: isCorrect ? "Police caught correctly" : "Police guessed wrong",
  });

  io.to(rid).emit("revealRoles", players.map((p) => ({ name: p.name, role: p.role })));
  const leaderboard = await User.find({ roomId: rid }).sort({ score: -1 }).select("name score role");
  io.to(rid).emit("leaderboard", leaderboard);

  setTimeout(async () => {
    const roomDoc = await GameRoom.findById(rid);
    roomDoc.currentRound += 1;

    // ensure any timer cleared
    const st = roomState.get(rid);
    if (st?.timer) clearTimeout(st.timer);
    roomState.delete(rid);

    if (roomDoc.totalRounds && roomDoc.currentRound > roomDoc.totalRounds) {
      roomDoc.gameStatus = "finished";
      await roomDoc.save();
      io.to(rid).emit("gameFinished");
      await computeAndBroadcastWinner(rid, io);
    } else {
      await roomDoc.save();
      await startRound(rid, io);
    }
  }, 5000);
};

const startRoomLoop = async (roomId, io) => {
  const rid = String(roomId);
  if (roomState.has(rid)) return;
  const room = await GameRoom.findById(rid);
  if (!room) return;

  await startRound(rid, io);
};

// named exports
export { startRoomLoop, startRound, finalizeRoundAsNoGuess, handlePoliceGuess };
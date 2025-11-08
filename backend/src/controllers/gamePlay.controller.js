// ...existing code...
import { GameRoom } from "../models/game-room.model.js";
import { User } from "../models/user.model.js";
import { Round } from "../models/rounds.model.js";
import mongoose from "mongoose";
import { getIO } from "../utils/socket.js"; // <-- use shared IO

const roomState = new Map(); // roomId (string DB _id) -> { timer, activeRoundNumber, policeId, instruction, resolved }

const shuffleArray = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// helper: resolve identifier which can be either ObjectId string or roomCode
const resolveRoom = async (identifier) => {
  if (!identifier) return null;
  let room = null;
  // treat valid ObjectId as DB id
  if (mongoose.Types.ObjectId.isValid(String(identifier))) {
    room = await GameRoom.findById(String(identifier));
    if (room) return room;
  }
  // otherwise try roomCode
  room = await GameRoom.findOne({ roomCode: String(identifier) });
  return room;
};

/**
 * Compute leaderboard and winners (handles ties), then emit via io
 */
const computeAndBroadcastWinner = async (roomIdentifier, io) => {
  let ioLocal = io;
  if (!ioLocal) {
    try {
      ioLocal = getIO();
    } catch (err) {
      console.error("Socket.IO not initialized in computeAndBroadcastWinner:", err);
      return null;
    }
  }

  const room = await resolveRoom(roomIdentifier);
  if (!room) return null;
  const rid = String(room._id);
  const socketRoomKey = String(room.roomCode);

  const players = await User.find({ roomId: rid }).select("_id name score").sort({ score: -1, name: 1 });
  if (!players || players.length === 0) return null;

  const leaderboard = players.map((p) => ({ id: p._id.toString(), name: p.name, score: p.score || 0 }));
  const topScore = leaderboard[0].score || 0;
  const winners = leaderboard.filter((p) => p.score === topScore);

  console.log("Emitting gameWinner to:", socketRoomKey);
  ioLocal.to(socketRoomKey).emit("gameWinner", { winners, leaderboard });
  return { winners, leaderboard };
};

const startRound = async (roomIdentifier, io) => {
  let ioLocal = io;
  if (!ioLocal) {
    try {
      console.log("params io is null, getting IO from getIO");
      ioLocal = getIO();
    } catch (err) {
      console.error("Socket.IO not initialized in startRound:", err);
      return;
    }
  }

  const room = await resolveRoom(roomIdentifier);
  if (!room || room.gameStatus !== "in_progress") return;

  const rid = String(room._id);
  const socketRoomKey = String(room.roomCode);

  if (room.totalRounds && room.currentRound > room.totalRounds) {
    room.gameStatus = "finished";
    await room.save();
    // ensure timer cleared if any
    const st0 = roomState.get(rid);
    if (st0?.timer) clearTimeout(st0.timer);
    roomState.delete(rid);

    console.log("Emitting gameFinished to:", socketRoomKey);
    ioLocal.to(socketRoomKey).emit("gameFinished");
    await computeAndBroadcastWinner(rid, ioLocal);
    return;
  }

  const players = await User.find({ roomId: rid }).select("_id name socketId role");
  if (players.length !== 4) {
    ioLocal.to(socketRoomKey).emit("error", { message: "Need 4 players to continue" });
    return;
  }

  const roles = shuffleArray(["King", "Police", "Chor", "Dakat"]);
  await Promise.all(
    players.map((p, i) => {
      return User.updateOne({ _id: p._id }, { $set: { role: roles[i] } });
    })
  );

  const freshPlayers = await User.find({ roomId: rid }).select("_id name role socketId");
  freshPlayers.forEach((p) => {
    if (p.socketId) {
      ioLocal.to(p.socketId).emit("yourRole", { role: p.role });
    }
  });

  // find who is King this round and prepare payload info
  const kingPlayer = freshPlayers.find((p) => p.role === "King");
  const kingPayload = kingPlayer ? { id: kingPlayer._id.toString(), name: kingPlayer.name } : null;

  // find who is Police this round and prepare payload info
  const policePlayer = freshPlayers.find((p) => p.role === "Police");
  const policePayload = policePlayer ? { id: policePlayer._id.toString(), name: policePlayer.name } : null;


  const instruction = Math.random() > 0.5 ? "Find Chor" : "Find Dakat";
  room.currentInstruction = instruction;
  await room.save();


  // emit to socket room identified by roomCode
  console.log("Emitting roundStarted for roomCode:", socketRoomKey);
  // include king and police info so clients can highlight them in the UI
  ioLocal.to(socketRoomKey).emit("roundStarted", {
    roundNumber: room.currentRound,
    instruction,
    time: 15,
    king: kingPayload,
    police: policePayload,
  });

  // const policePlayer = freshPlayers.find((p) => p.role === "Police");
  const state = {
    activeRoundNumber: room.currentRound,
    policeId: policePlayer ? policePlayer._id.toString() : null,
    instruction,
    timer: null,
    resolved: false,
  };
  roomState.set(rid, state);

  if (policePlayer && policePlayer.socketId) {
    ioLocal.to(policePlayer.socketId).emit("policeInstruction", { instruction });
  }

  state.timer = setTimeout(async () => {
    if (state.resolved) return;
    await finalizeRoundAsNoGuess(rid, ioLocal);
  }, 15000);
};

const finalizeRoundAsNoGuess = async (roomIdentifier, io) => {
  let ioLocal = io;
  if (!ioLocal) {
    try {
      ioLocal = getIO();
    } catch (err) {
      console.error("Socket.IO not initialized in finalizeRoundAsNoGuess:", err);
      return;
    }
  }

  const room = await resolveRoom(roomIdentifier);
  if (!room) return;
  const rid = String(room._id);
  const socketRoomKey = String(room.roomCode);

  const state = roomState.get(rid);
  if (!state) return;
  state.resolved = true;

  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }

  const players = await User.find({ roomId: rid });

  // compute per-player points for "no guess" case
  const pointsMap = new Map();
  players.forEach((p) => {
    let pts = 0;
    if (p.role === "King") pts = 1000;
    else if (p.role === "Chor") pts = 400;
    else if (p.role === "Dakat") pts = 600;
    else if (p.role === "Police") pts = 0;
    pointsMap.set(p._id.toString(), pts);
    p.score = (p.score || 0) + pts;
  });

  await Promise.all(players.map((p) => p.save()));

  const playerScores = players.map((p) => ({
    userId: p._id,
    points: pointsMap.get(p._id.toString()) || 0,
  }));

  const targetRole = state.instruction === "Find Chor" ? "Chor" : "Dakat";

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
    playerScores,
    guessedAt: new Date(),
  });

  console.log("Emitting roundResult (no guess) to:", socketRoomKey);
  // include the per-round playerScores so clients can show points awarded this round
  ioLocal.to(socketRoomKey).emit("roundResult", {
    success: false,
    message: "No guess made in time",
    playerScores,
    targetRole,
  });

  const leaderboard = await User.find({ roomId: rid }).sort({ score: -1 }).select("name score role");
  console.log("Emitting leaderboard to:", socketRoomKey);
  ioLocal.to(socketRoomKey).emit("leaderboard", leaderboard);

  console.log("Emitting revealRoles to:", socketRoomKey);
  ioLocal.to(socketRoomKey).emit("revealRoles", players.map((p) => ({ name: p.name, role: p.role })));

  setTimeout(async () => {
    room.currentRound += 1;
    await room.save();
    // cleanup
    const st = roomState.get(rid);
    if (st?.timer) clearTimeout(st.timer);
    roomState.delete(rid);

    if (room.totalRounds && room.currentRound > room.totalRounds) {
      room.gameStatus = "finished";
      await room.save();
      console.log("Emitting gameFinished to:", socketRoomKey);
      ioLocal.to(socketRoomKey).emit("gameFinished");
      await computeAndBroadcastWinner(rid, ioLocal);
    } else {
      await startRound(rid, ioLocal);
    }
  }, 5000);
};

const handlePoliceGuess = async (roomIdentifier, policeId, guessedUserId, io, socket) => {
  let ioLocal = io;
  if (!ioLocal) {
    try {
      ioLocal = getIO();
    } catch (err) {
      console.error("Socket.IO not initialized in handlePoliceGuess:", err);
      // fallback: still use socket to reply with error
      if (socket) socket.emit("error", { message: "Server socket not initialized" });
      return;
    }
  }

  const room = await resolveRoom(roomIdentifier);
  if (!room) {
    if (socket) socket.emit("error", { message: "Room not found" });
    return;
  }
  const rid = String(room._id);
  const socketRoomKey = String(room.roomCode);

  const state = roomState.get(rid);

  if (!state || state.resolved) {
    if (socket) socket.emit("error", { message: "Round already Finished" });
    return;
  }
  if (state.policeId !== policeId) {
    if (socket) socket.emit("error", { message: "You are not the police for this round" });
    return;
  }

  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
  state.resolved = true;

  const players = await User.find({ roomId: rid });
  const police = players.find((p) => p._id.toString() === policeId);
  const guessed = players.find((p) => p._id.toString() === guessedUserId);
  const king = players.find((p) => p.role === "King");

  const targetRole = state.instruction === "Find Chor" ? "Chor" : "Dakat";

  const pointsMap = new Map();

  if (guessed && guessed.role === targetRole) {
    players.forEach((p) => pointsMap.set(p._id.toString(), 0));
    if (king) pointsMap.set(king._id.toString(), 1000);
    if (police) pointsMap.set(police._id.toString(), 800);
    pointsMap.set(guessed._id.toString(), 0);

    const remaining = players.find(
      (p) =>
        ![
          king?._id.toString(),
          police?._id.toString(),
          guessed?._id.toString(),
        ].includes(p._id.toString())
    );
    if (remaining) {
      const remPts = remaining.role === "Chor" ? 400 : 600;
      pointsMap.set(remaining._id.toString(), remPts);
    }
  } else {
    players.forEach((p) => {
      let pts = 0;
      if (p.role === "King") pts = 1000;
      else if (p.role === "Police") pts = 0;
      else if (p.role === "Chor") pts = 400;
      else if (p.role === "Dakat") pts = 600;
      pointsMap.set(p._id.toString(), pts);
    });
  }

  players.forEach((p) => {
    const inc = pointsMap.get(p._id.toString()) || 0;
    p.score = (p.score || 0) + inc;
  });
  await Promise.all(players.map((p) => p.save()));

  const playerScores = players.map((p) => ({ userId: p._id, points: pointsMap.get(p._id.toString()) || 0 }));

  await Round.create({
    roomId: rid,
    roundNumber: state.activeRoundNumber,
    instruction: state.instruction,
    policeId,
    guessedUserId,
    targetRole,
    isCorrect: guessed && guessed.role === targetRole,
    roleAssignments: {
      king: king._id,
      police: police._id,
      chor: players.find((p) => p.role === "Chor")._id,
      dakat: players.find((p) => p.role === "Dakat")._id,
    },
    playerScores,
    guessedAt: new Date(),
  });

  console.log("Emitting roundResult (guess) to:", socketRoomKey);
  // include the per-round playerScores so clients can show points awarded this round
  ioLocal.to(socketRoomKey).emit("roundResult", {
    isCorrect: guessed && guessed.role === targetRole,
    message: guessed && guessed.role === targetRole ? "Police caught correctly" : "Police guessed wrong",
    playerScores,
    targetRole,
  });

  console.log("Emitting revealRoles to:", socketRoomKey);
  ioLocal.to(socketRoomKey).emit("revealRoles", players.map((p) => ({ name: p.name, role: p.role })));
  const leaderboard = await User.find({ roomId: rid }).sort({ score: -1 }).select("name score role");
  console.log("Emitting leaderboard to:", socketRoomKey);
  ioLocal.to(socketRoomKey).emit("leaderboard", leaderboard);

  setTimeout(async () => {
    const roomDoc = await GameRoom.findById(rid);
    roomDoc.currentRound += 1;

    const st = roomState.get(rid);
    if (st?.timer) clearTimeout(st.timer);
    roomState.delete(rid);

    if (roomDoc.totalRounds && roomDoc.currentRound > roomDoc.totalRounds) {
      roomDoc.gameStatus = "finished";
      await roomDoc.save();
      console.log("Emitting gameFinished to:", socketRoomKey);
      ioLocal.to(socketRoomKey).emit("gameFinished");
      await computeAndBroadcastWinner(rid, ioLocal);
    } else {
      await roomDoc.save();
      await startRound(rid, ioLocal);
    }
  }, 5000);
};

const startRoomLoop = async (roomIdentifier, io) => {
  let ioLocal = io;
  if (!ioLocal) {
    try {
      ioLocal = getIO();
    } catch (err) {
      console.error("Socket.IO not initialized in startRoomLoop:", err);
      return;
    }
  }

  // resolve to DB room and then start rounds using DB _id
  const room = await resolveRoom(roomIdentifier);
  if (!room) return;
  const rid = String(room._id);
  if (roomState.has(rid)) return;
  await startRound(rid, ioLocal);
};

// named exports
export { startRoomLoop, startRound, finalizeRoundAsNoGuess, handlePoliceGuess };
// ...existing code...
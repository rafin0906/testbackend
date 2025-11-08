import { handlePoliceGuess } from "../controllers/gamePlay.controller.js";
import { User } from "../models/user.model.js";
import { GameRoom } from "../models/game-room.model.js";

export default function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    // register socket to a userId (preferred) and join appropriate socket rooms
    socket.on("register", async ({ userId, roomCode }) => {
      if (!userId) return;
      try {
        console.log("registering socket for user:", userId);

        // update user's socketId and return the user document (includes roomId)
        const user = await User.findByIdAndUpdate(
          userId,
          { socketId: socket.id },
          { new: true }
        ).select("_id name isHost roomId");

        // join room by DB roomId if available
        if (user && user.roomId) {
          socket.join(String(user.roomId));
          console.log(`socket ${socket.id} joined DB roomId:`, String(user.roomId));
        }

        // if client also provided roomCode, resolve room and join both roomCode + DB id
        if (roomCode) {
          // ensure the GameRoom exists and get its _id
          const roomDoc = await GameRoom.findOne({ roomCode: String(roomCode) }).select("_id roomCode");
          if (roomDoc) {
            socket.join(String(roomDoc.roomCode));
            socket.join(String(roomDoc._id));
            console.log(`socket ${socket.id} joined roomCode and roomId:`, roomDoc.roomCode, roomDoc._id);
          } else {
            // still join the roomCode socket room (fallback)
            socket.join(String(roomCode));
            console.log(`socket ${socket.id} joined roomCode (no DB match found):`, roomCode);
          }
        }

        // Build players list from DB using roomId (source of truth)
        const players =
          user && user.roomId
            ? await User.find({ roomId: user.roomId }).select("_id name isHost")
            : [];

        // emit updated player list to both possible rooms (roomCode and DB id) for robustness
        if (user && user.roomId && io) {
          io.to(String(user.roomId)).emit("playerList", players);
        }
        if (roomCode && io) {
          io.to(String(roomCode)).emit("playerList", players);
        }
      } catch (err) {
        console.error("failed to set socketId:", err);
      }
    });

    // reregister: when client reconnects / navigates and obtains a new socket.id
    socket.on("reregister", async ({ userId, roomCode }) => {
      if (!userId) return;
      try {
        console.log("reregistering socket for user:", userId, "new socket:", socket.id);
        const user = await User.findByIdAndUpdate(
          userId,
          { socketId: socket.id },
          { new: true }
        ).select("_id name isHost roomId");

        // re-join DB room if present
        if (user && user.roomId) {
          socket.join(String(user.roomId));
          console.log(`reregister: socket ${socket.id} joined DB roomId:`, String(user.roomId));
        }

        // also join by roomCode if provided (try resolve DB room)
        if (roomCode) {
          const roomDoc = await GameRoom.findOne({ roomCode: String(roomCode) }).select("_id roomCode");
          if (roomDoc) {
            socket.join(String(roomDoc.roomCode));
            socket.join(String(roomDoc._id));
            console.log(`reregister: socket ${socket.id} joined roomCode and roomId:`, roomDoc.roomCode, roomDoc._id);
          } else {
            socket.join(String(roomCode));
            console.log(`reregister: socket ${socket.id} joined roomCode (no DB match):`, roomCode);
          }
        }

        // send current player list to room(s) so the just-reconnected client gets up-to-date state
        const players =
          user && user.roomId
            ? await User.find({ roomId: user.roomId }).select("_id name isHost")
            : [];

        if (user && user.roomId && io) {
          io.to(String(user.roomId)).emit("playerList", players);
        }
        if (roomCode && io) {
          io.to(String(roomCode)).emit("playerList", players);
        }
      } catch (err) {
        console.error("reregister handler error:", err);
      }
    });

    // allow clients that don't know their userId (e.g. on page refresh) to join by roomCode
    socket.on("joinRoomSocket", async ({ roomCode }) => {
      try {
        if (!roomCode) return;
        // join the literal roomCode
        socket.join(String(roomCode));
        // try to resolve DB room and also join its DB _id room
        const roomDoc = await GameRoom.findOne({ roomCode: String(roomCode) }).select("_id roomCode");
        if (roomDoc && roomDoc._id) {
          socket.join(String(roomDoc._id));
          console.log(`socket ${socket.id} joined both roomCode and roomId on joinRoomSocket:`, roomCode, roomDoc._id);
        } else {
          console.log(`socket ${socket.id} joined roomCode (no DB match):`, roomCode);
        }

        // If we can, emit current player list to this roomCode so the just-joined client gets current state
        if (roomDoc && roomDoc._id) {
          const players = await User.find({ roomId: roomDoc._id }).select("_id name isHost");
          io.to(String(roomCode)).emit("playerList", players);
        }
      } catch (err) {
        console.error("joinRoomSocket handler error:", err);
      }
    });

    // Host-triggered start via socket: validate host and broadcast gameStarted
    socket.on("startGame", async ({ totalRounds }) => {
      try {
        // find user by socket id
        const user = await User.findOne({ socketId: socket.id }).select("_id isHost roomId name");
        if (!user) return socket.emit("error", { message: "User not found / not authenticated" });

        // find the room using user's roomId
        const room = user.roomId ? await GameRoom.findById(user.roomId) : null;
        if (!room) return socket.emit("error", { message: "Room not found" });

        // only host may start
        const isHostUser = !!user.isHost || String(room.hostId) === String(user._id);
        if (!isHostUser) return socket.emit("error", { message: "Only the host can start the game" });

        // validate rounds
        const rounds = parseInt(totalRounds, 10);
        if (Number.isNaN(rounds) || rounds <= 0) return socket.emit("error", { message: "Invalid totalRounds" });

        // persist room changes
        room.gameStatus = "in_progress";
        room.currentRound = 1;
        room.totalRounds = rounds;
        await room.save();

        // emit gameStarted to the socket room identified by roomCode
        io.to(String(room.roomCode)).emit("gameStarted", {
          roomCode: room.roomCode,
          currentRound: room.currentRound,
          totalRounds: room.totalRounds,
        });

        console.log(`Host ${user._id} started game for roomCode=${room.roomCode}, rounds=${rounds}`);
      } catch (err) {
        console.error("startGame socket handler error:", err);
        socket.emit("error", { message: "Failed to start game" });
      }
    });

    // police guess event -> forward to controller handler (uses client-sent policeId)
    // payload: { roomId, policeId, guessedUserId }
    socket.on("policeGuess", async ({ roomId, policeId, guessedUserId }) => {
      try {
        // server-side validation and scoring handled in controller
        await handlePoliceGuess(roomId, policeId, guessedUserId, io, socket);
      } catch (err) {
        console.error("policeGuess handler error:", err);
        try {
          socket.emit("error", { message: "Failed to process guess" });
        } catch (emitErr) {
          console.error("Failed to emit error to socket:", emitErr);
        }
      }
    });

    socket.on("disconnect", async (reason) => {
      console.log("socket disconnected:", socket.id, reason);
      try {
        await User.updateOne({ socketId: socket.id }, { $set: { socketId: null } });
      } catch (err) {
        /* ignore */
      }
    });
  });
}
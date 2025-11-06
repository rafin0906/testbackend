import { handlePoliceGuess } from "../controllers/gamePlay.controller.js";
import { User } from "../models/user.model.js";

export default function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    // client should immediately call:
    // socket.emit('register', { userId, roomCode })
    socket.on("register", async ({ userId, roomCode }) => {
      if (!userId) return;
      try {
        console.log("registering socket for user:", userId);

        // update user's socketId and return the user document
        const user = await User.findByIdAndUpdate(
          userId,
          { socketId: socket.id },
          { new: true }
        ).select("_id name isHost roomId");

        // get players for this user's room (use user's roomId as source of truth)
        const players =
          user && user.roomId
            ? await User.find({ roomId: user.roomId }).select("_id name isHost")
            : [];

        // join socket to the socket room keyed by roomCode (if provided)
        if (roomCode) socket.join(String(roomCode));
        console.log(`socket ${socket.id} joined roomCode socket room:`, roomCode);

        // emit updated player list to the socket room identified by roomCode
        if (roomCode && io) {
          io.to(String(roomCode)).emit("playerList", players);
        }
      } catch (err) {
        console.error("failed to set socketId:", err);
      }
    });

  

    // police guess event -> forward to controller handler (uses client-sent policeId)
    // payload: { roomId, policeId, guessedUserId }
    socket.on("policeGuess", async ({ roomId, policeId, guessedUserId }) => {
      try {
        await handlePoliceGuess(roomId, policeId, guessedUserId, io, socket);
      } catch (err) {
        console.error("policeGuess handling error:", err);
        socket.emit("error", { message: "Guess processing failed" });
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

import { handlePoliceGuess } from "../controllers/gamePlay.controller.js";
import { User } from "../models/user.model.js";

export default function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    // client should immediately call:
    // socket.emit('register', { userId, roomId })
    socket.on("register", async ({ userId, roomId }) => {
      if (!userId) return;
      try {
        await User.findByIdAndUpdate(userId, { socketId: socket.id });
      } catch (err) {
        console.error("failed to set socketId:", err);
      }
      if (roomId) socket.join(String(roomId));
    });

    // optional: join room by event
    socket.on("joinRoomSocket", ({ roomId }) => {
      if (roomId) socket.join(String(roomId));
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
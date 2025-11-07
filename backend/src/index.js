import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import http from "http";
// import { Server } from "socket.io";
import { initSocket } from "./utils/socket.js";
import connectDB from "./db/index.js";
import app from "./app.js";
import socketHandler from "./utils/socketHandler.js";

const PORT = process.env.PORT || 8000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

async function start() {
  await connectDB();

  const httpServer = http.createServer(app);

  // initialize shared Socket.IO instance
  const io = initSocket(httpServer); // ✅ global shared instance

  // optionally keep app.set if other code expects it (not required)
  // app.set("io", io);

  // wire up your socket handlers
  socketHandler(io);

  httpServer.listen(PORT, () =>
    console.log(`\n🟢 Server listening on port ${PORT}`)
  );
}

start().catch((err) => {
  console.error("Server bootstrap failed:", err);
  process.exit(1);
});
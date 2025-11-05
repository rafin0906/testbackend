import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import http from "http";
import { Server } from "socket.io";
import connectDB from "./db/index.js";
import app from "./app.js";
import socketHandler from "./utils/socketHandler.js";

const PORT = process.env.PORT || 8000;

async function start() {
  await connectDB();

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // make io available in controllers: req.app.get('io')
  app.set("io", io);

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
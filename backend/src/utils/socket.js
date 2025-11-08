import { Server } from "socket.io";

let io = null;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_ORIGIN || "https://chorpolice.onrender.com/",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    return io;
};

export const getIO = () => {
    if (!io) throw new Error("Socket.IO not initialized!");
    return io;
};
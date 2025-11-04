import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { GameRoom } from "../models/game-room.model.js";

/** small helper to generate readable 6-char room codes */
function generateRoomCode() {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // avoid ambiguous chars
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

/**
 * POST /api/rooms/create
 * Body: { name, avatar?, totalRounds? }
 * -> creates a user (host) and a room, assigns hostId and sets defaults:
 *    currentRound = 0, gameStatus = "waiting", expiresAt = now + 24h
 */
const createRoom = asyncHandler(async (req, res) => {
    const { name, avatar = null } = req.body; // totalRounds removed here
    if (!name) {
        return res.status(400).json({ message: "Name is required" });
    }
    // create host user
    const host = await User.create({
        name,
        avatar,
        isHost: true,
    });

    // create room with unique roomCode (retry on duplicate)
    let room;
    const maxAttempts = 6;
    for (let i = 0; i < maxAttempts; i++) {
        const roomCode = generateRoomCode();
        try {
            room = await GameRoom.create({
                hostId: host._id,
                roomCode,
                currentRound: 0, // starts at 0 in lobby
                gameStatus: "waiting",
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                // totalRounds intentionally omitted here — set when host starts the game
            });
            break;
        } catch (err) {
            // duplicate roomCode -> retry
            if (err.code === 11000) continue;
            throw err;
        }
    }
    if (!room) throw new Error("Failed to generate unique room code");

    // attach room to host user
    host.roomId = room._id;
    await host.save();

    // generate host access token 
    let hostToken = null;
    try {
      hostToken = host.generateHostAccessToken?.() || null;
    } catch (err) {
      // do not block room creation if token generation fails; log error
      console.error("Host token generation failed:", err);
    }

    const options = {
        httpOnly: true,
        secure: true
    }
    
  
    // respond with host, room, and set hostToken cookie
    return res
    .status(201)
    .cookie('hostToken', hostToken, options)
    .json({ host, room, hostToken })//after getting this response we will get host and room data in frontend
});

/**
 * POST /api/rooms/join
 * Body: { name, roomCode, avatar? }
 * -> finds room by code, verifies waiting and not full, creates user and assigns roomId
 */
const joinRoom = asyncHandler(async (req, res) => {
    const { name, roomCode, avatar = null } = req.body;
    if (!name || !roomCode) {
        return res.status(400).json({ message: "Name and roomCode are required" });
    }

    const room = await GameRoom.findOne({ roomCode });
    if (!room) {
        return res.status(404).json({ message: "Room not found" });
    }
    if (room.gameStatus !== "waiting") {
        return res.status(400).json({ message: "Game already started or room closed" });
    }

    // check current number of users in this room
    const playerCount = await User.countDocuments({ roomId: room._id });
    if (playerCount >= 4) {
        return res.status(400).json({ message: "Room is full" });
    }

    // create user and attach to room
    const user = await User.create({
        name,
        avatar,
        roomId: room._id,
        isHost: false,
    });

    return res.status(201).json({ user, room });
});

/**
 * POST /api/rooms/:roomId/start
 * Body: none (only host should call this)
 * -> ensure exactly 4 users, then set gameStatus and start round (currentRound = 1)
 */
const startGame = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(roomId)) return res.status(400).json({ message: "Invalid roomId" });

    const room = await GameRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.gameStatus !== "waiting") return res.status(400).json({ message: "Game already started or finished" });

    const playerCount = await User.countDocuments({ roomId: room._id });
    if (playerCount !== 4) return res.status(400).json({ message: "Need exactly 4 players to start the game" });

    room.gameStatus = "in_progress";
    room.currentRound = 1;
    room.currentInstruction = ["Find Chor", "Find Dakat"][Math.floor(Math.random() * 2)];
    await room.save();

    return res.status(200).json({ room });
});

export { createRoom, joinRoom, startGame };
import mongoose from "mongoose";
import { User } from "./user.model.js";
import { Round } from "./rounds.model.js";
/**
 * GameRoom Schema - Simplified
 * Manages game session with embedded game state
 */
const GameRoomSchema = new mongoose.Schema(
  {
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Host ID is required"],
      index: true,
    },
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      length: 6,
      index: true,
    },
    totalRounds: {
      type: Number,
      required: true,
      min: [1, "Must have at least 1 round"],
      max: [40, "Cannot exceed 40 rounds"],
      default: 5,
    },
    currentRound: {
      type: Number,
      default: 0,
      min: 0,
    },
    gameStatus: {
      type: String,
      enum: {
        values: ["waiting", "in_progress", "finished"],
        message: "{VALUE} is not a valid game status",
      },
      default: "waiting",
      index: true,
    },
    // Current round instruction
    currentInstruction: {
      type: String,
      enum: ["Find Chor", "Find Dakat", null],
      default: null,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
GameRoomSchema.index({ gameStatus: 1, expiresAt: 1 });
GameRoomSchema.index({ roomCode: 1 }, { unique: true });




/**
 * Cleanup when room is removed
 */
GameRoomSchema.pre("remove", async function (next) {
  try {

    await Promise.all([
      User.updateMany({ roomId: this._id }, { $set: { roomId: null, role: null, score: 0 } }),
      Round.deleteMany({ roomId: this._id }),
    ]);

    next();
  } catch (error) {
    next(error);
  }
});

// TTL index for auto-deletion
GameRoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const GameRoom=  mongoose.model("GameRoom", GameRoomSchema);
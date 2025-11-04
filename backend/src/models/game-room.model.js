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
 * Assign roles to all players in the room
 */
GameRoomSchema.methods.assignRoles = async function () {

  const users = await User.find({ roomId: this._id }).sort({ joinedAt: 1 });

  if (users.length !== 4) {
    throw new Error("Need exactly 4 players to assign roles");
  }

  // Shuffle roles
  const roles = ["King", "Police", "Chor", "Dakat"];
  const shuffledRoles = roles.sort(() => Math.random() - 0.5);

  // Assign roles to users
  const updates = users.map((user, index) =>
    User.findByIdAndUpdate(user._id, { role: shuffledRoles[index] })
  );

  await Promise.all(updates);

  return shuffledRoles;
};

/**
 * Advance to next round
 */
GameRoomSchema.methods.advanceRound = async function () {
  if (this.currentRound >= this.totalRounds) {
    this.gameStatus = "finished";
    this.currentInstruction = null;
  } else {
    this.currentRound += 1;
    // Assign new random instruction
    this.currentInstruction = ["Find Chor", "Find Dakat"][
      Math.floor(Math.random() * 2)
    ];
    
    // Reassign roles for new round
    await this.assignRoles();
  }
  
  return await this.save();
};

// Get current leaderboard

GameRoomSchema.methods.getLeaderboard = async function () {

  return await User.find({ roomId: this._id })
    .sort({ score: -1, name: 1 })
    .select("name score role")
    .lean();
};

/**
 * Reset all player scores
 */
GameRoomSchema.methods.resetScores = async function () {

  await User.updateMany(
    { roomId: this._id },
    { $set: { score: 0, role: null } }
  );
};

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
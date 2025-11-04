import mongoose from "mongoose";
import jwt from "jsonwebtoken";
/**
 * User Schema - Simplified
 * Represents a player with all game state consolidated
 */

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    avatar: {
      type: String,
      default: null,
      trim: true,
    },
    socketId: {
      type: String,
      index: true,
      default: null,
    },
    isHost: {
      type: Boolean,
      default: false,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameRoom",
      default: null,
      index: true,
    },
    // Current game state
    role: {
      type: String,
      enum: {
        values: ["King", "Police", "Chor", "Dakat", null],
        message: "{VALUE} is not a valid role",
      },
      default: null,
    },
    score: {
      type: Number,
      default: 0,
      min: [0, "Score cannot be negative"],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ roomId: 1, isHost: 1 });
UserSchema.index({ socketId: 1 }, { sparse: true });

/**
 * Increment user's score
 */
UserSchema.methods.incrementScore = async function (points) {
  this.score += points;
  return await this.save();
};

/**
 * Reset user's game state
 */
UserSchema.methods.resetGameState = async function () {
  this.role = null;
  this.score = 0;
  return await this.save();
};

/**
 * Assign role to user
 */
UserSchema.methods.assignRole = async function (role) {
  this.role = role;
  return await this.save();
};

/**
 * Find all users in a room
 */
UserSchema.statics.findByRoom = async function (roomId) {
  return await this.find({ roomId }).sort({ joinedAt: 1 });
};

/**
 * Get user by role in a room
 */
UserSchema.statics.findByRoleInRoom = async function (roomId, role) {
  return await this.findOne({ roomId, role });
};

// Generate JWT token for host access
UserSchema.methods.generateHostAccessToken = function () {
    if (!this.isHost) {
    throw new Error("Only host user can generate host access token");
  }
  return jwt.sign(
    {
      id: this._id,
      roomId: this.roomId,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1h" }
  );

   
};

export const User = mongoose.model("User", UserSchema);
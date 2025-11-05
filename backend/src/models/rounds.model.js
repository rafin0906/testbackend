import mongoose from "mongoose";
import { User } from "./user.model.js";

/**
 * Round Schema - Simplified
 * Stores round history with guess and results
 */
const RoundSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameRoom",
      required: [true, "Room ID is required"],
      index: true,
    },
    roundNumber: {
      type: Number,
      required: [true, "Round number is required"],
      min: [1, "Round number must be at least 1"],
    },
    instruction: {
      type: String,
      enum: {
        values: ["Find Chor", "Find Dakat"],
        message: "{VALUE} is not a valid instruction",
      },
      required: [true, "Instruction is required"],
    },
    // Police player who made the guess
    policeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Who did police guess
    guessedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Target role for this round
    targetRole: {
      type: String,
      enum: ["Chor", "Dakat"],
      required: true,
    },
    // Was the guess correct?
    isCorrect: {
      type: Boolean,
      required: true,
    },
    // Role assignments for this round (embedded)
    roleAssignments: {
      king: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      police: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      chor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      dakat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    // Per-round points awarded to each player
    playerScores: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        points: {
          type: Number,
          required: true,
        },
      },
    ],
    guessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index
RoundSchema.index({ roomId: 1, roundNumber: 1 }, { unique: true });


export const Round = mongoose.model("Round", RoundSchema);
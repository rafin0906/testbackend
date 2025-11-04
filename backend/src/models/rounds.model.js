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
    // Score changes for this round
    scoreChanges: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        points: Number,
        role: String,
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

/**
 * Create and evaluate a guess for the current round
 */
RoundSchema.statics.createRoundWithGuess = async function ({
  roomId,
  roundNumber,
  instruction,
  policeId,
  guessedUserId,
  roleAssignments,
}) {


  // Determine target role based on instruction
  const targetRole = instruction === "Find Chor" ? "Chor" : "Dakat";

  // Find who actually has the target role
  const actualTargetId =
    targetRole === "Chor" ? roleAssignments.chor : roleAssignments.dakat;

  // Check if guess is correct
  const isCorrect = actualTargetId.equals(guessedUserId);

  // Calculate score changes
  const scoreChanges = [];

  if (isCorrect) {
    // Correct guess
    scoreChanges.push(
      { userId: policeId, points: 500, role: "Police" },
      { userId: roleAssignments.king, points: 1000, role: "King" },
      { userId: roleAssignments.chor, points: 0, role: "Chor" },
      { userId: roleAssignments.dakat, points: 0, role: "Dakat" }
    );

    // Update user scores
    await User.findByIdAndUpdate(policeId, { $inc: { score: 500 } });
    await User.findByIdAndUpdate(roleAssignments.king, { $inc: { score: 1000 } });
  } else {
    // Wrong guess
    const otherCriminalId =
      targetRole === "Chor" ? roleAssignments.dakat : roleAssignments.chor;

    scoreChanges.push(
      { userId: policeId, points: 0, role: "Police" },
      { userId: roleAssignments.king, points: 0, role: "King" },
      { userId: actualTargetId, points: 1000, role: targetRole },
      {
        userId: otherCriminalId,
        points: 500,
        role: targetRole === "Chor" ? "Dakat" : "Chor",
      }
    );

    // Update user scores
    await User.findByIdAndUpdate(actualTargetId, { $inc: { score: 1000 } });
    await User.findByIdAndUpdate(otherCriminalId, { $inc: { score: 500 } });
  }

  // Create round record
  const round = await this.create({
    roomId,
    roundNumber,
    instruction,
    policeId,
    guessedUserId,
    targetRole,
    isCorrect,
    roleAssignments,
    scoreChanges,
  });

  return round;
};

/**
 * Get round history for a room
 */
RoundSchema.statics.getRoundHistory = async function (roomId) {
  return await this.find({ roomId })
    .sort({ roundNumber: 1 })
    .populate("policeId guessedUserId", "name ")
    .populate("roleAssignments.king roleAssignments.police roleAssignments.chor roleAssignments.dakat", "name")
    .lean();
};

/**
 * Get round statistics
 */
RoundSchema.statics.getRoomStats = async function (roomId) {
  const rounds = await this.find({ roomId });

  const totalRounds = rounds.length;
  const correctGuesses = rounds.filter((r) => r.isCorrect).length;
  const accuracy = totalRounds > 0 ? (correctGuesses / totalRounds) * 100 : 0;

  return {
    totalRounds,
    correctGuesses,
    wrongGuesses: totalRounds - correctGuesses,
    accuracy: accuracy.toFixed(2),
  };
};

export const Round= mongoose.model("Round", RoundSchema);
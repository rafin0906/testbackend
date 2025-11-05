import express from "express";
import {
    startNextRound,
    getUserRole,
    policeGuess,
    getLeaderboard,
    getWinner,
} from "../controllers/gamePlay.controller.js";

const router = express.Router();

router.post("/start-round/:roomId", startNextRound);
router.get("/roles/:roomId", getUserRole);
router.post("/guess/:roomId", policeGuess);
router.get("/leaderboard/:roomId", getLeaderboard);
router.get("/winner/:roomId", getWinner);

export default router;

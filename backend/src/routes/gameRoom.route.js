import { Router } from 'express';
import { createRoom, joinRoom, startGame, getRoomByCode, getPlayersByRoomCode } from '../controllers/generateRoom.controller.js';
import { verifyHost } from '../middlewares/host.middleware.js';
import { checkIsHost } from '../controllers/generateRoom.controller.js';
const router = Router();

router.route('/generate-room').post(createRoom);
router.route('/join').post(joinRoom);


// =======================================================
// fetch room by code (used by frontend to hydrate RoomContext)
router.route("/by-code/:roomCode").get(getRoomByCode);
// fetch players for a room (used by frontend to hydrate PlayerContext)
router.route("/:roomCode/players").get(getPlayersByRoomCode);
// =======================================================







// host-check endpoint — protected by verifyHost middleware which reads hostToken cookie
router.route("/:roomCode/is-host").get(verifyHost, checkIsHost);
// secured: only host can start the game
router.route('/:roomCode/start/:totalRounds').get(verifyHost, startGame);




// ===========================
router.route("/ping").get((req, res) => {
  res.status(200).json({ message: "Server running" });
});

// ===========================


export default router;
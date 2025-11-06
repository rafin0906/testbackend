import { Router } from 'express';
import { createRoom, joinRoom, startGame, getRoomByCode, getPlayersByRoomCode } from '../controllers/generateRoom.controller.js';
import { verifyHost } from '../middlewares/host.middleware.js';

const router = Router();

router.route('/generate-room').post(createRoom);
router.route('/join').post(joinRoom);


// =======================================================
// fetch room by code (used by frontend to hydrate RoomContext)
router.route("/by-code/:roomCode").get(getRoomByCode);
// fetch players for a room (used by frontend to hydrate PlayerContext)
router.route("/:roomCode/players").get(getPlayersByRoomCode);
// =======================================================







// secured: only host can start the game
router.route('/:roomId/start').get(verifyHost, startGame);

export default router;
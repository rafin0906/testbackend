import { Router } from 'express';
import { createRoom, joinRoom, startGame } from '../controllers/generateRoom.controller.js';
import { verifyHost } from '../middlewares/host.middleware.js';

const router = Router();

router.route('/generate-room').post(createRoom);
router.route('/join').post(joinRoom);

// secured: only host can start the game
router.route('/:roomId/start').get(verifyHost, startGame);

export default router;
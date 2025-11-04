import {Router} from 'express';
import {createRoom} from '../controllers/generateRoom.controller.js';
const router = Router();

router.route('/generate-room').post(createRoom)



//host access route
export default router;
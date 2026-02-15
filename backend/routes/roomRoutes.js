import express from 'express';
import * as roomController from '../controllers/roomController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/join-room', verifyToken, roomController.joinRoom); 

router.post('/admin/create-room', verifyToken, isAdmin, roomController.createRoom);
router.get('/admin/rooms', verifyToken, isAdmin, roomController.getAllRooms);
router.delete('/admin/rooms/:id', verifyToken, isAdmin, roomController.deleteRoom); 

export default router;

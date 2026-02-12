import express from 'express';
import roomController from '../controllers/roomController.js';

const router = express.Router();

router.post('/admin/create-room', roomController.createRoom);
router.get('/admin/rooms', roomController.getAllRooms);
router.post('/join-room', roomController.joinRoom);

router.delete('/rooms/:id', deleteRoom); 
export default router;

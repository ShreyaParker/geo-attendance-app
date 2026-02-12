import express from 'express';
import * as roomController from '../controllers/roomController.js'; // Use * to import all exports

const router = express.Router();

router.post('/admin/create-room', roomController.createRoom);
router.get('/admin/rooms', roomController.getAllRooms);
router.post('/join-room', roomController.joinRoom);


router.delete('/admin/rooms/:id', roomController.deleteRoom); 

export default router;

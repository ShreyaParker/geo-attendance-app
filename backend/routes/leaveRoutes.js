import express from 'express';
import * as leaveController from '../controllers/leaveController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/leave/apply', verifyToken, leaveController.applyLeave);
router.get('/leave/all', verifyToken, leaveController.getLeaves); 
router.put('/leave/status', verifyToken, isAdmin, leaveController.updateLeaveStatus);

export default router;

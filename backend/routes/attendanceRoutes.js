import express from 'express';
import attendanceController from '../controllers/attendanceController.js';

const router = express.Router();

router.post('/update-status', attendanceController.updateStatus);
router.get('/admin/dashboard', attendanceController.getDashboard);
router.get('/admin/dashboard/:roomCode', attendanceController.getDashboard);
router.get('/admin/calendar', verifyToken, isAdmin, attendanceController.getMonthlyAttendance);

export default router;

import { updateStatus, getDashboard, getAlerts, getMonthlyAttendance } from '../controllers/attendanceController.js';
import express from "express";
import {isAdmin, verifyToken} from "../middleware/auth.js";

const router = express.Router();

router.post('/update-status', updateStatus);
router.get('/admin/dashboard', getDashboard);
router.get('/admin/dashboard/:roomCode', getDashboard);
router.get('/admin/calendar', verifyToken, isAdmin, getMonthlyAttendance);
router.get('/admin/alerts', verifyToken, isAdmin, getAlerts)

export default router;

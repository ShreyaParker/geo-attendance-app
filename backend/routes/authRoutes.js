import { login, register, updateFaceModel } from '../controllers/authController.js';
import Router from "express"
import {verifyToken} from "../middleware/auth.js";

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/update-face-model', verifyToken, updateFaceModel);
export default router;

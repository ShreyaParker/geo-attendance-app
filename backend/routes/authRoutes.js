import { login, register, updateFaceModel } from '../controllers/authController.js';
import Router from "express"
const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/update-face-model', verifyToken, updateFaceModel);
export default router;

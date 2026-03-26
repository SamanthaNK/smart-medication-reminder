import { Router } from 'express';
import { getProfile, registerFcmToken } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);
router.get('/me', getProfile);
router.patch('/me/fcm-token', registerFcmToken);

export default router;
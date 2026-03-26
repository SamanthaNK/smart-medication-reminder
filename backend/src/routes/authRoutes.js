import { Router } from 'express';
import {
    register,
    verifyEmailAddress,
    resendCode,
    login,
    forgotPasswordRequest,
    resetPasswordRequest,
} from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/verify-email', verifyEmailAddress);
router.post('/resend-code', resendCode);
router.post('/login', login);
router.post('/forgot-password', forgotPasswordRequest);
router.post('/reset-password', resetPasswordRequest);

export default router;
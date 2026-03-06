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

// POST /v1/auth/register
router.post('/register', register);

// POST /v1/auth/verify-email  { email, code }
router.post('/verify-email', verifyEmailAddress);

// POST /v1/auth/resend-code  { email }
router.post('/resend-code', resendCode);

// POST /v1/auth/login
router.post('/login', login);

// POST /v1/auth/forgot-password
router.post('/forgot-password', forgotPasswordRequest);

// POST /v1/auth/reset-password  { email, code, password }
router.post('/reset-password', resetPasswordRequest);

export default router;
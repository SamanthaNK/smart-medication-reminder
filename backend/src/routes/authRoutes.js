import { Router } from 'express';
import {
    register,
    verifyEmailAddress,
    login,
    forgotPasswordRequest,
    resetPasswordRequest,
} from '../controllers/authController.js';

const router = Router();

// POST /v1/auth/register
router.post('/register', register);

// GET /v1/auth/verify-email?token=...
router.get('/verify-email', verifyEmailAddress);

// POST /v1/auth/login
router.post('/login', login);

// POST /v1/auth/forgot-password
router.post('/forgot-password', forgotPasswordRequest);

// POST /v1/auth/reset-password?token=...
router.post('/reset-password', resetPasswordRequest);

export default router;
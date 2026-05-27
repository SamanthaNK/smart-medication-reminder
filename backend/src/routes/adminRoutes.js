import { Router } from 'express';
import { platformStats, verifyUserAccount } from '../controllers/adminController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorise } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/stats', authorise('admin'), platformStats);
router.patch('/users/:id/verify', authorise('admin'), verifyUserAccount);

export default router;
import { Router } from 'express';
import { platformStats } from '../controllers/adminController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorise } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/stats', authorise('admin'), platformStats);

export default router;
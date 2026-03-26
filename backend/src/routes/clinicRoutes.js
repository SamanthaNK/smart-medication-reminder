import { Router } from 'express';
import { clinicDashboard } from '../controllers/clinicController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorise } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', authorise('clinic_staff', 'admin'), clinicDashboard);

export default router;
import { Router } from 'express';
import {
    confirmDoseHandler,
    markMissedHandler,
    getDoseHistoryHandler,
    getRiskScoreHandler,
} from '../controllers/doseEventController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorise } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

router.post('/:id/confirm', authorise('patient'), confirmDoseHandler);
router.post('/:id/miss', authorise('patient'), markMissedHandler);
router.get('/patients/:patientId/history', authorise('patient', 'caregiver', 'clinic_staff', 'admin'), getDoseHistoryHandler);
router.get('/patients/:patientId/risk', authorise('patient', 'caregiver', 'clinic_staff', 'admin'), getRiskScoreHandler);

export default router;
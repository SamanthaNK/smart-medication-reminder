import { Router } from 'express';
import { listAlerts, acknowledgeAlertHandler } from '../controllers/alertController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorise } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorise('caregiver'), listAlerts);
router.patch('/:id/acknowledge', authorise('caregiver'), acknowledgeAlertHandler);

export default router;
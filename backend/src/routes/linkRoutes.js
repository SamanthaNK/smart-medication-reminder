import { Router } from 'express';
import {
    requestLinkHandler,
    respondToLinkHandler,
    getPendingLinksHandler,
    getLinkedPatientsHandler,
} from '../controllers/linkController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorise } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

router.post('/request', authorise('caregiver'), requestLinkHandler);
router.patch('/:id/respond', authorise('patient'), respondToLinkHandler);
router.get('/pending', authorise('patient'), getPendingLinksHandler);
router.get('/patients', authorise('caregiver'), getLinkedPatientsHandler);

export default router;
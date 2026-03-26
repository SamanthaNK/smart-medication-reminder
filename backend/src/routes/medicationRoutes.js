import { Router } from 'express';
import {
    listMedications,
    createMedication,
    updateMedication,
    deleteMedication,
} from '../controllers/medicationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorise } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/patients/:patientId', authorise('patient', 'caregiver', 'clinic_staff', 'admin'), listMedications);
router.post('/patients/:patientId', authorise('patient', 'caregiver', 'clinic_staff', 'admin'), createMedication);
router.put('/:id', authorise('patient', 'caregiver', 'clinic_staff', 'admin'), updateMedication);
router.delete('/:id', authorise('patient', 'caregiver', 'clinic_staff', 'admin'), deleteMedication);

export default router;
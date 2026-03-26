import { AppError } from '../middleware/errorMiddleware.js';
import { findUserById } from '../repositories/userRepository.js';
import {
    findLinkByPair,
    findLinkById,
    findPendingLinksForPatient,
    findActiveCaregiversByPatient,
    findActivePatientsByCaregiver,
    createLink,
    updateLinkById,
} from '../repositories/linkRepository.js';
import { decrypt } from '../utils/encrypt.js';

const decryptName = (user) => ({ ...user, name: decrypt(user.name) });

export const requestLink = async (caregiverId, patientEmail) => {
    const patient = await findUserById(null);
    const { findUserByEmail } = await import('../repositories/userRepository.js');
    const patientUser = await findUserByEmail(patientEmail);

    if (!patientUser || patientUser.role !== 'patient') {
        throw new AppError(
            'No patient account found with that email address.',
            404,
            'PATIENT_NOT_FOUND'
        );
    }

    if (patientUser.id === caregiverId) {
        throw new AppError('You cannot link to yourself.', 400, 'INVALID_REQUEST');
    }

    const existing = await findLinkByPair(caregiverId, patientUser.id);
    if (existing) {
        if (existing.status === 'active') {
            throw new AppError('You are already linked to this patient.', 409, 'ALREADY_LINKED');
        }
        if (existing.status === 'pending') {
            throw new AppError('A link request is already pending for this patient.', 409, 'REQUEST_PENDING');
        }
        const renewed = await updateLinkById(existing.id, {
            status: 'pending',
            linked_at: null,
        });
        return { link: renewed };
    }

    const link = await createLink({
        caregiver_id: caregiverId,
        patient_id: patientUser.id,
        status: 'pending',
    });

    return { link };
};

export const respondToLink = async (patientId, linkId, action) => {
    const link = await findLinkById(linkId);

    if (!link) {
        throw new AppError('Link request not found.', 404, 'NOT_FOUND');
    }

    if (link.patient_id !== patientId) {
        throw new AppError('You are not authorised to respond to this request.', 403, 'FORBIDDEN');
    }

    if (link.status !== 'pending') {
        throw new AppError('This link request is no longer pending.', 400, 'INVALID_STATE');
    }

    if (!['approve', 'reject'].includes(action)) {
        throw new AppError('action must be "approve" or "reject".', 400, 'INVALID_ACTION');
    }

    const newStatus = action === 'approve' ? 'active' : 'revoked';
    const updated = await updateLinkById(linkId, {
        status: newStatus,
        linked_at: action === 'approve' ? new Date().toISOString() : null,
    });

    return { link: updated };
};

export const getPendingLinksForPatient = async (patientId) => {
    const links = await findPendingLinksForPatient(patientId);
    return links.map((l) => ({
        ...l,
        caregiver: decryptName(l.caregiver),
    }));
};

export const getLinkedPatients = async (caregiverId) => {
    const links = await findActivePatientsByCaregiver(caregiverId);
    return links.map((l) => ({
        ...l,
        patient: {
            ...l.patient,
            name: decrypt(l.patient.name),
            city: l.patient.city ? decrypt(l.patient.city) : null,
        },
    }));
};
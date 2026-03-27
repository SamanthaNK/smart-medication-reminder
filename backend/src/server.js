import './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { env } from './config/env.js';
import { errorHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import linkRoutes from './routes/linkRoutes.js';
import medicationRoutes from './routes/medicationRoutes.js';
import doseEventRoutes from './routes/doseEventRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import clinicRoutes from './routes/clinicRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

import { startScheduler } from './services/scheduleService.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/v1/auth', authRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1/links', linkRoutes);
app.use('/v1/medications', medicationRoutes);
app.use('/v1/dose-events', doseEventRoutes);
app.use('/v1/alerts', alertRoutes);
app.use('/v1/clinic', clinicRoutes);
app.use('/v1/admin', adminRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', app: 'MedMate API' });
});

app.use(errorHandler);

app.listen(env.PORT, () => {
    console.log(`MedMate API running on port ${env.PORT}`);
    startScheduler();
});
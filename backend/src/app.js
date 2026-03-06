import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

app.use(helmet());

app.use(cors());

app.use(express.json());

app.use('/v1/auth', authRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', app: 'MedMate API' });
});

app.use(errorHandler);

export default app;
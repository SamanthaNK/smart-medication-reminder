import './src/config/env.js';
import app from './src/app.js';
import { env } from './src/config/env.js';
import { startScheduler } from './src/services/scheduleService.js';

app.listen(env.PORT, () => {
    console.log(`MedMate API running on port ${env.PORT}`);
    startScheduler();
});
import AsyncStorage from '@react-native-async-storage/async-storage';
import { confirmDose, markDoseMissed } from '../api/api';

const QUEUE_KEY = 'dose_queue';

const readQueue = async () => {
    try {
        const raw = await AsyncStorage.getItem(QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const writeQueue = async (queue) => {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const confirmDoseWithQueue = async (doseEventId, confirmedByVoice = false) => {
    try {
        const result = await confirmDose(doseEventId, confirmedByVoice);
        return { queued: false, result };
    } catch (err) {
        if (err.errorCode && err.errorCode !== 'NETWORK_ERROR') {
            throw err;
        }
        await enqueueItem({ type: 'confirm', doseEventId, payload: { confirmedByVoice } });
        return { queued: true };
    }
};

export const markMissedWithQueue = async (doseEventId, missedReason) => {
    try {
        const result = await markDoseMissed(doseEventId, missedReason);
        return { queued: false, result };
    } catch (err) {
        if (err.errorCode && err.errorCode !== 'NETWORK_ERROR') {
            throw err;
        }
        await enqueueItem({ type: 'miss', doseEventId, payload: { missedReason } });
        return { queued: true };
    }
};

const enqueueItem = async ({ type, doseEventId, payload }) => {
    const queue = await readQueue();
    queue.push({
        id: `${doseEventId}_${type}_${Date.now()}`,
        type,
        doseEventId,
        payload,
        createdAt: new Date().toISOString(),
    });
    await writeQueue(queue);
    console.log(`[QUEUE] Saved ${type} for dose ${doseEventId} (total queued: ${queue.length})`);
};

export const flushQueue = async () => {
    const queue = await readQueue();
    if (queue.length === 0) return { flushed: 0, remaining: 0 };

    console.log(`[QUEUE] Flushing ${queue.length} queued dose action(s)...`);

    const remaining = [];
    let flushed = 0;

    for (const item of queue) {
        try {
            if (item.type === 'confirm') {
                await confirmDose(item.doseEventId, item.payload.confirmedByVoice);
            } else if (item.type === 'miss') {
                await markDoseMissed(item.doseEventId, item.payload.missedReason);
            }
            flushed++;
            console.log(`[QUEUE] Flushed ${item.type} for dose ${item.doseEventId}`);
        } catch (err) {
            if (!err.errorCode || err.errorCode === 'NETWORK_ERROR') {
                remaining.push(item);
            } else {
                console.log(`[QUEUE] Discarding stale item ${item.id}: ${err.errorCode}`);
            }
        }
    }

    await writeQueue(remaining);
    console.log(`[QUEUE] Done. Flushed: ${flushed}, Remaining: ${remaining.length}`);
    return { flushed, remaining: remaining.length };
};

export const getQueueCount = async () => {
    const queue = await readQueue();
    return queue.length;
};
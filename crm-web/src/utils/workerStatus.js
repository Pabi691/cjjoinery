import { DateTime } from 'luxon';

export const normalizeWorker = (payload) => {
    if (!payload || typeof payload !== 'object') return payload;

    const doc = payload._doc && typeof payload._doc === 'object'
        ? { ...payload, ...payload._doc }
        : payload;

    const statusHistory = [...(doc.statusHistory || [])].sort((a, b) => {
        const left = a?.date || '';
        const right = b?.date || '';
        return right.localeCompare(left);
    });

    const worker = {
        ...doc,
        statusHistory
    };

    return {
        ...worker,
        availability: getWorkerStatusForDate(worker, DateTime.now().toISODate())
    };
};

export const getWorkerStatusForDate = (worker, isoDate) => {
    const targetDate = isoDate || DateTime.now().toISODate();
    const today = DateTime.now().toISODate();
    const history = [...(worker?.statusHistory || [])].sort((a, b) => {
        const left = a?.date || '';
        const right = b?.date || '';
        return right.localeCompare(left);
    });

    const exactEntry = history.find((entry) => entry?.date === targetDate);
    if (exactEntry?.status) {
        return exactEntry.status;
    }

    if (targetDate === today) {
        return worker?.availability || 'Available';
    }

    return 'Available';
};

export const getAvailabilityColor = (status) => {
    switch (status) {
        case 'Available':
            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        case 'Busy':
            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        case 'On Leave':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

export const getCalendarTone = (status) => {
    switch (status) {
        case 'Available':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/40';
        case 'Busy':
            return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800/40';
        case 'On Leave':
            return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/40';
        default:
            return 'bg-white/60 text-gray-700 border-white/40 dark:bg-slate-800/40 dark:text-gray-300 dark:border-white/10';
    }
};

const pad = (value) => String(value).padStart(2, '0');

const normalizeDateKey = (value) => {
    if (!value) return null;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

const sortStatusHistory = (history = []) => {
    return [...history].sort((a, b) => {
        const left = normalizeDateKey(a?.date) || '';
        const right = normalizeDateKey(b?.date) || '';
        return right.localeCompare(left);
    });
};

const getEffectiveWorkerStatus = (worker, targetDate = new Date()) => {
    const targetKey = normalizeDateKey(targetDate) || normalizeDateKey(new Date());
    const history = sortStatusHistory(worker?.statusHistory || []);
    const todayKey = normalizeDateKey(new Date());

    const exactEntry = history.find((entry) => normalizeDateKey(entry?.date) === targetKey);
    if (exactEntry?.status) {
        return exactEntry.status;
    }

    if (targetKey === todayKey) {
        return worker?.availability || 'Available';
    }

    return 'Available';
};

const upsertStatusHistoryEntry = (history = [], entry) => {
    const nextHistory = [...history];
    const entryDate = normalizeDateKey(entry?.date);
    const existingIndex = nextHistory.findIndex(
        (item) => normalizeDateKey(item?.date) === entryDate
    );

    if (existingIndex >= 0) {
        nextHistory[existingIndex] = {
            ...nextHistory[existingIndex],
            ...entry,
            date: entryDate || nextHistory[existingIndex]?.date
        };
    } else {
        nextHistory.unshift({
            ...entry,
            date: entryDate || normalizeDateKey(new Date())
        });
    }

    return sortStatusHistory(nextHistory);
};

const decorateWorker = (worker, targetDate = new Date()) => {
    if (!worker) return null;

    const plain = worker.toObject ? worker.toObject() : { ...worker };
    const statusHistory = sortStatusHistory(plain.statusHistory || []);
    const availability = getEffectiveWorkerStatus(
        { ...plain, statusHistory },
        targetDate
    );

    return {
        ...plain,
        statusHistory,
        availability,
        todayStatus: availability
    };
};

module.exports = {
    normalizeDateKey,
    sortStatusHistory,
    getEffectiveWorkerStatus,
    upsertStatusHistoryEntry,
    decorateWorker
};

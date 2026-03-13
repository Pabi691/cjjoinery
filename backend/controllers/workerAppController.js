const asyncHandler = require('express-async-handler');
const mockData = require('../data/mockData');

const createNotification = (payload) => {
    const notification = {
        _id: `n-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date().toISOString(),
        read: false,
        ...payload
    };
    mockData.notifications.unshift(notification);
    return notification;
};

const sanitizeWorker = (worker) => {
    if (!worker) return null;
    const { password, ...safeWorker } = worker;
    return safeWorker;
};

// @desc    Worker login
// @route   POST /api/worker/login
// @access  Public
const loginWorker = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const worker = mockData.workers.find(
        w => w.username === username || w.email === username
    );

    if (!worker || worker.password !== password) {
        res.status(401);
        throw new Error('Invalid worker credentials');
    }

    res.json({
        worker: sanitizeWorker(worker),
        token: `worker-token-${worker._id}`
    });
});

// @desc    Get jobs for worker (without customer details)
// @route   GET /api/worker/:workerId/jobs
// @access  Public
const getWorkerJobs = asyncHandler(async (req, res) => {
    const { workerId } = req.params;
    const jobs = mockData.jobs
        .filter(job => (job.assignedWorkers || []).some(w => w._id === workerId))
        .map(job => {
            const { customerId, ...rest } = job;
            return rest;
        });

    res.json(jobs);
});

// @desc    Update worker status on a specific date
// @route   POST /api/worker/:workerId/status
// @access  Public
const updateWorkerStatus = asyncHandler(async (req, res) => {
    const { workerId } = req.params;
    const { date, status, note } = req.body;

    const worker = mockData.workers.find(w => w._id === workerId);
    if (!worker) {
        res.status(404);
        throw new Error('Worker not found');
    }

    worker.availability = status || worker.availability;
    if (!worker.statusHistory) worker.statusHistory = [];
    const statusEntry = {
        _id: `sh-${Date.now()}`,
        date: date || new Date().toISOString().slice(0, 10),
        status: status || worker.availability,
        note: note || ''
    };
    worker.statusHistory.unshift(statusEntry);

    createNotification({
        type: 'status_change',
        workerId: worker._id,
        workerName: worker.name,
        message: `Status updated to ${statusEntry.status}`,
        details: statusEntry
    });

    res.json({ worker: sanitizeWorker(worker), statusEntry });
});

// @desc    Schedule job dates for worker
// @route   POST /api/worker/:workerId/jobs/:jobId/schedule
// @access  Public
const scheduleJob = asyncHandler(async (req, res) => {
    const { workerId, jobId } = req.params;
    const { dates } = req.body;

    const job = mockData.jobs.find(j => j._id === jobId);
    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    if (!job.schedules) job.schedules = [];
    const existing = job.schedules.find(s => s.workerId === workerId);
    if (existing) {
        existing.dates = dates || [];
    } else {
        job.schedules.push({ workerId, dates: dates || [] });
    }

    const worker = mockData.workers.find(w => w._id === workerId);
    createNotification({
        type: 'schedule_update',
        workerId,
        workerName: worker?.name || 'Worker',
        message: `Scheduled work for ${job.title}`,
        details: { jobId, jobTitle: job.title, dates: dates || [] }
    });

    res.json(job);
});

// @desc    Add daily log entry for a job
// @route   POST /api/worker/:workerId/jobs/:jobId/daily-log
// @access  Public
const addDailyLog = asyncHandler(async (req, res) => {
    const { workerId, jobId } = req.params;
    const { date, description, imageUrl, location } = req.body;

    const job = mockData.jobs.find(j => j._id === jobId);
    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    if (!job.dailyLogs) job.dailyLogs = [];
    const worker = mockData.workers.find(w => w._id === workerId);

    const logEntry = {
        _id: `dl-${Date.now()}`,
        workerId,
        workerName: worker?.name || 'Worker',
        date: date || new Date().toISOString().slice(0, 10),
        description,
        imageUrl,
        location,
        createdAt: new Date().toISOString()
    };
    job.dailyLogs.unshift(logEntry);

    createNotification({
        type: 'daily_log',
        workerId,
        workerName: worker?.name || 'Worker',
        message: `Daily log added for ${job.title}`,
        details: { jobId, jobTitle: job.title, log: logEntry }
    });

    res.json(logEntry);
});

module.exports = {
    loginWorker,
    getWorkerJobs,
    updateWorkerStatus,
    scheduleJob,
    addDailyLog
};

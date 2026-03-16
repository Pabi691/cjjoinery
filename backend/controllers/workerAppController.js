const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Job = require('../models/Job');
const Worker = require('../models/Worker');

const sanitizeWorker = (worker) => {
    if (!worker) return null;
    const safeWorker = worker.toObject ? worker.toObject() : worker;
    delete safeWorker.password;
    return safeWorker;
};

const canUseDb = () => mongoose.connection && mongoose.connection.readyState === 1;

// @desc    Worker login
// @route   POST /api/worker/login
// @access  Public
const loginWorker = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!canUseDb()) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const worker = await Worker.findOne({
        $or: [{ username }, { email: username }]
    });

    if (!worker || !worker.password) {
        res.status(401);
        throw new Error('Invalid worker credentials');
    }

    let matches = false;
    if (worker.password.startsWith('$2')) {
        matches = await bcrypt.compare(password, worker.password);
    } else {
        matches = worker.password === password;
    }

    if (!matches) {
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
    if (!canUseDb()) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const jobs = await Job.find({ assignedWorkers: workerId })
        .populate('assignedWorkers', 'name')
        .lean();

    res.json(jobs);
});

// @desc    Update worker status on a specific date
// @route   POST /api/worker/:workerId/status
// @access  Public
const updateWorkerStatus = asyncHandler(async (req, res) => {
    const { workerId } = req.params;
    const { date, status, note } = req.body;
    if (!canUseDb()) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
        res.status(404);
        throw new Error('Worker not found');
    }

    worker.availability = status || worker.availability;
    worker.statusHistory = worker.statusHistory || [];
    const statusEntry = {
        _id: `sh-${Date.now()}`,
        date: date || new Date().toISOString().slice(0, 10),
        status: status || worker.availability,
        note: note || ''
    };
    worker.statusHistory.unshift(statusEntry);
    await worker.save();

    res.json({ worker: sanitizeWorker(worker), statusEntry });
});

// @desc    Schedule job dates for worker
// @route   POST /api/worker/:workerId/jobs/:jobId/schedule
// @access  Public
const scheduleJob = asyncHandler(async (req, res) => {
    const { workerId, jobId } = req.params;
    const { dates } = req.body;
    if (!canUseDb()) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const job = await Job.findById(jobId);
    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    job.schedules = job.schedules || [];
    const existing = job.schedules.find(
        s => s.workerId?.toString() === workerId
    );
    if (existing) {
        existing.dates = dates || [];
    } else {
        job.schedules.push({ workerId, dates: dates || [] });
    }

    await job.save();
    res.json(job);
});

// @desc    Add daily log entry for a job
// @route   POST /api/worker/:workerId/jobs/:jobId/daily-log
// @access  Public
const normalizeLocation = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (_) {
            return null;
        }
    }
    return value;
};

const normalizeNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

const addDailyLog = asyncHandler(async (req, res) => {
    const { workerId, jobId } = req.params;
    const { date, description, imageUrl, location } = req.body;

    const parsedLocation = normalizeLocation(location) || {};
    const resolvedLocation = {
        lat: normalizeNumber(parsedLocation.lat),
        lng: normalizeNumber(parsedLocation.lng),
        address: parsedLocation.address || null
    };

    const hasLocation =
        resolvedLocation.lat !== null ||
        resolvedLocation.lng !== null ||
        (resolvedLocation.address && resolvedLocation.address.toString().trim() !== '');

    let resolvedImageUrl = imageUrl;
    const imagePayload = req.file
        ? {
            data: req.file.buffer,
            contentType: req.file.mimetype,
            filename: req.file.originalname
        }
        : null;

    const shouldUseDb = canUseDb() && mongoose.Types.ObjectId.isValid(jobId);
    if (shouldUseDb) {
        const job = await Job.findById(jobId);
        if (!job) {
            res.status(404);
            throw new Error('Job not found');
        }

        let workerName = 'Worker';
        if (mongoose.Types.ObjectId.isValid(workerId)) {
            const dbWorker = await Worker.findById(workerId).lean();
            workerName = dbWorker?.name || workerName;
        }

        const logId = new mongoose.Types.ObjectId();
        if (imagePayload) {
            resolvedImageUrl = `/api/worker/jobs/${jobId}/daily-logs/${logId}/image`;
        }

        const logEntry = {
            _id: logId,
            workerId,
            workerName,
            date: date ? new Date(date) : new Date(),
            description,
            imageUrl: resolvedImageUrl,
            image: imagePayload || undefined,
            location: hasLocation ? resolvedLocation : null,
            createdAt: new Date()
        };

        job.dailyLogs = job.dailyLogs || [];
        job.dailyLogs.unshift(logEntry);
        await job.save();

        createNotification({
            type: 'daily_log',
            workerId,
            workerName,
            message: `Daily log added for ${job.title}`,
            details: { jobId, jobTitle: job.title, log: logEntry }
        });

        const responseLog = { ...logEntry };
        delete responseLog.image;
        res.json(responseLog);
        return;
    }

    res.status(503);
    throw new Error('Database not connected');
});

// @desc    Get daily log image
// @route   GET /api/worker/jobs/:jobId/daily-logs/:logId/image
// @access  Public
const getDailyLogImage = asyncHandler(async (req, res) => {
    const { jobId, logId } = req.params;
    let image = null;

    if (canUseDb() && mongoose.Types.ObjectId.isValid(jobId)) {
        const job = await Job.findById(jobId).select('dailyLogs');
        const log = job?.dailyLogs?.id(logId);
        if (log?.image?.data) {
            image = log.image;
        }
    }

    if (!image) {
        res.status(404);
        throw new Error('Image not found');
    }

    res.set('Content-Type', image.contentType || 'image/jpeg');
    res.send(image.data);
});

module.exports = {
    loginWorker,
    getWorkerJobs,
    updateWorkerStatus,
    scheduleJob,
    addDailyLog,
    getDailyLogImage
};

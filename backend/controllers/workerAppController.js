const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Job = require('../models/Job');
const Worker = require('../models/Worker');
const Notification = require('../models/Notification');
const connectDB = require('../config/db');
const mockData = require('../data/mockData');
const {
    decorateWorker,
    getEffectiveWorkerStatus,
    normalizeDateKey,
    upsertStatusHistoryEntry
} = require('../utils/workerStatus');
const { autoUpdateJobStatuses } = require('./jobController');

const sanitizeWorker = (worker) => {
    if (!worker) return null;
    const safeWorker = decorateWorker(worker);
    delete safeWorker.password;
    return safeWorker;
};

const canUseDb = () => mongoose.connection && mongoose.connection.readyState === 1;

const ensureDb = async () => {
    if (!canUseDb()) {
        await connectDB();
    }
    return canUseDb();
};

const createNotification = async (payload) => {
    if (!payload) return null;
    try {
        if (await ensureDb()) {
            const created = await Notification.create({
                read: false,
                ...payload
            });
            return created?.toObject ? created.toObject() : created;
        }
    } catch (error) {
        console.warn('Failed to save notification to DB:', error?.message || error);
    }
    if (!Array.isArray(mockData.notifications)) {
        mockData.notifications = [];
    }
    const fallback = {
        _id: `n${Date.now()}`,
        read: false,
        createdAt: new Date().toISOString(),
        ...payload
    };
    mockData.notifications.unshift(fallback);
    return fallback;
};

// @desc    Worker login
// @route   POST /api/worker/login
// @access  Public
const loginWorker = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const dbWorker = await Worker.findOne({
        $or: [{ username }, { email: username }]
    });

    if (dbWorker && dbWorker.password) {
        let matches = false;
        if (dbWorker.password.startsWith('$2')) {
            matches = await bcrypt.compare(password, dbWorker.password);
        } else {
            matches = dbWorker.password === password;
        }

        if (matches) {
            const safeWorker = sanitizeWorker(dbWorker);
            res.json({
                worker: safeWorker,
                token: `worker-token-${dbWorker._id}`
            });
            return;
        }

        res.status(401);
        throw new Error('Invalid worker credentials');
    }

    res.status(401);
    throw new Error('Invalid worker credentials');
});

// @desc    Get jobs for worker (without customer details)
// @route   GET /api/worker/:workerId/jobs
// @access  Public
const getWorkerJobs = asyncHandler(async (req, res) => {
    const { workerId } = req.params;
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    await autoUpdateJobStatuses();

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
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
        res.status(404);
        throw new Error('Worker not found');
    }

    const statusDate = normalizeDateKey(date) || normalizeDateKey(new Date());
    const todayKey = normalizeDateKey(new Date());
    if (statusDate < todayKey) {
        res.status(400);
        throw new Error('Past dates cannot be updated');
    }

    const statusEntry = {
        _id: `sh-${Date.now()}`,
        date: statusDate,
        status: status || worker.availability,
        note: note || ''
    };

    worker.statusHistory = upsertStatusHistoryEntry(worker.statusHistory || [], statusEntry);
    worker.availability = getEffectiveWorkerStatus(worker, new Date());
    await worker.save();

    await createNotification({
        type: 'status_change',
        workerId,
        workerName: worker.name,
        message: `${worker.name} updated status to ${statusEntry.status}`,
        details: {
            date: statusEntry.date,
            status: statusEntry.status,
            note: statusEntry.note,
            effectiveToday: worker.availability
        }
    });

    res.json({ worker: sanitizeWorker(worker), statusEntry });
});

// @desc    Schedule job dates for worker
// @route   POST /api/worker/:workerId/jobs/:jobId/schedule
// @access  Public
const scheduleJob = asyncHandler(async (req, res) => {
    const { workerId, jobId } = req.params;
    const { dates } = req.body;
    if (!(await ensureDb())) {
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

    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
        res.status(400);
        throw new Error('Invalid job id');
    }

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

    await createNotification({
        type: 'daily_log',
        workerId,
        workerName,
        message: `Daily log added for ${job.title}`,
        details: { jobId, jobTitle: job.title, log: logEntry }
    });

    const responseLog = { ...logEntry };
    delete responseLog.image;
    res.json(responseLog);
});

// @desc    Get daily log image
// @route   GET /api/worker/jobs/:jobId/daily-logs/:logId/image
// @access  Public
const getDailyLogImage = asyncHandler(async (req, res) => {
    const { jobId, logId } = req.params;
    let image = null;

    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    if (mongoose.Types.ObjectId.isValid(jobId)) {
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

// @desc    Worker check-in for today's job
// @route   POST /api/worker/:workerId/check-in
// @access  Public
const checkInWorker = asyncHandler(async (req, res) => {
    const { workerId } = req.params;
    const { jobId } = req.body;

    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const job = await Job.findById(jobId);
    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    const todayKey = normalizeDateKey(new Date());
    job.workCalendar = job.workCalendar || [];

    let entryIndex = job.workCalendar.findIndex(e => e.date === todayKey);
    if (entryIndex >= 0) {
        const existing = (job.workCalendar[entryIndex].workerIds || []).map(id => id.toString());
        if (!existing.includes(workerId)) {
            job.workCalendar[entryIndex].workerIds.push(workerId);
        }
    } else {
        job.workCalendar.push({ date: todayKey, hours: 0, workerIds: [workerId], workerSchedules: [] });
        entryIndex = job.workCalendar.length - 1;
    }

    // Record check-in time in workerSchedules
    const now = new Date();
    const schedules = job.workCalendar[entryIndex].workerSchedules || [];
    const wsIdx = schedules.findIndex(s => s.workerId?.toString() === workerId);
    if (wsIdx >= 0) {
        schedules[wsIdx].checkInTime = schedules[wsIdx].checkInTime || now;
    } else {
        schedules.push({ workerId, startTime: '', endTime: '', hours: 0, checkInTime: now, checkOutTime: null });
    }
    job.workCalendar[entryIndex].workerSchedules = schedules;

    job.markModified('workCalendar');
    await job.save();

    const worker = await Worker.findById(workerId).lean();

    await createNotification({
        type: 'check_in',
        workerId,
        workerName: worker?.name || 'Worker',
        message: `${worker?.name || 'Worker'} checked in for ${job.title}`,
        details: { jobId, jobTitle: job.title, date: todayKey }
    });

    res.json({ success: true, date: todayKey, jobId, jobTitle: job.title });
});

// @desc    Worker check-out for today's job
// @route   POST /api/worker/:workerId/check-out
// @access  Public
const checkOutWorker = asyncHandler(async (req, res) => {
    const { workerId } = req.params;
    const { jobId } = req.body;

    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const job = await Job.findById(jobId);
    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    const todayKey = normalizeDateKey(new Date());
    const entryIndex = (job.workCalendar || []).findIndex(e => e.date === todayKey);
    if (entryIndex < 0) {
        res.status(400);
        throw new Error('No check-in record found for today');
    }

    const now = new Date();
    const schedules = job.workCalendar[entryIndex].workerSchedules || [];
    const wsIdx = schedules.findIndex(s => s.workerId?.toString() === workerId);

    let checkInTime = null;
    if (wsIdx >= 0) {
        checkInTime = schedules[wsIdx].checkInTime || null;
        schedules[wsIdx].checkOutTime = now;
    } else {
        schedules.push({ workerId, startTime: '', endTime: '', hours: 0, checkInTime: null, checkOutTime: now });
    }

    // Calculate actual hours worked and daily earning
    const worker = await Worker.findById(workerId).lean();
    let hoursWorked = 0;
    let dailyEarning = 0;

    if (checkInTime && wsIdx >= 0) {
        const diffMs = now.getTime() - new Date(checkInTime).getTime();
        hoursWorked = Math.round((diffMs / 3600000) * 100) / 100;
        if (hoursWorked > 0) {
            schedules[wsIdx].hours = hoursWorked;
            dailyEarning = Math.round(hoursWorked * (worker?.hourlyRate || 0) * 100) / 100;
        }
    }

    job.workCalendar[entryIndex].workerSchedules = schedules;
    job.markModified('workCalendar');
    await job.save();

    await createNotification({
        type: 'check_out',
        workerId,
        workerName: worker?.name || 'Worker',
        message: `${worker?.name || 'Worker'} checked out from ${job.title}`,
        details: { jobId, jobTitle: job.title, date: todayKey, checkOutTime: now, hoursWorked, dailyEarning }
    });

    res.json({
        success: true,
        checkOutTime: now,
        checkInTime,
        jobId,
        date: todayKey,
        hoursWorked,
        dailyEarning,
        hourlyRate: worker?.hourlyRate || 0
    });
});

module.exports = {
    loginWorker,
    getWorkerJobs,
    updateWorkerStatus,
    scheduleJob,
    addDailyLog,
    getDailyLogImage,
    checkInWorker,
    checkOutWorker
};

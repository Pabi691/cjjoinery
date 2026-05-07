const asyncHandler = require('express-async-handler');
const Job = require('../models/Job');
const Trash = require('../models/Trash');

const normalizeDateKey = (value) => {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '';
    }

    return parsed.toISOString().slice(0, 10);
};

const validateDateOrder = (startDate, deadline) => {
    const startKey = normalizeDateKey(startDate);
    const deadlineKey = normalizeDateKey(deadline);

    if (startKey && deadlineKey && deadlineKey < startKey) {
        const error = new Error('Deadline cannot be before start date');
        error.statusCode = 400;
        throw error;
    }
};

const validateWorkCalendarRange = (workCalendar = [], startDate, deadline) => {
    const startKey = normalizeDateKey(startDate);
    const deadlineKey = normalizeDateKey(deadline);
    const normalizedCalendar = normalizeWorkCalendar(workCalendar);

    if (!normalizedCalendar.length) return;

    if (!startKey || !deadlineKey) {
        const error = new Error('Set both start date and deadline before planning calendar days');
        error.statusCode = 400;
        throw error;
    }

    for (const entry of normalizedCalendar) {
        if (entry.date < startKey || entry.date > deadlineKey) {
            const error = new Error('Planner dates must stay between start date and deadline');
            error.statusCode = 400;
            throw error;
        }
    }
};

const parseTimeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const [h, m] = timeStr.split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
};

const calcWorkerHours = (startTime, endTime) => {
    const start = parseTimeToMinutes(startTime);
    const end   = parseTimeToMinutes(endTime);
    if (start === null || end === null || end <= start) return 0;
    return Math.round(((end - start) / 60) * 100) / 100;
};

const normalizeWorkerSchedules = (rawSchedules = []) => {
    const seen = new Set();
    const result = [];
    for (const s of rawSchedules) {
        const wid = s?.workerId?._id?.toString?.() || s?.workerId?.toString?.() || s?.workerId || '';
        if (!wid || seen.has(wid)) continue;
        seen.add(wid);
        const h = calcWorkerHours(s.startTime, s.endTime);
        result.push({
            workerId:     wid,
            startTime:    s.startTime    || '',
            endTime:      s.endTime      || '',
            hours:        h > 0 ? h : (Number.isFinite(Number(s.hours)) && Number(s.hours) > 0 ? Number(s.hours) : 0),
            checkInTime:  s.checkInTime  || null,
            checkOutTime: s.checkOutTime || null,
        });
    }
    return result;
};

const normalizeWorkCalendar = (entries = []) => {
    const calendarMap = new Map();

    for (const rawEntry of entries) {
        const date = normalizeDateKey(rawEntry?.date);
        if (!date) continue;

        const workerIds = Array.from(
            new Set(
                (rawEntry?.workerIds || [])
                    .map((workerId) => workerId?._id?.toString?.() || workerId?.toString?.() || workerId)
                    .filter(Boolean)
            )
        );

        const workerSchedules = normalizeWorkerSchedules(rawEntry?.workerSchedules || []);

        // Derive total hours: sum of per-worker hours if schedules exist, else fallback to entry.hours
        const scheduleHoursTotal = workerSchedules.reduce((sum, s) => sum + (s.hours || 0), 0);
        const fallbackHours = Number(rawEntry?.hours);
        const safeHours = scheduleHoursTotal > 0
            ? scheduleHoursTotal
            : (Number.isFinite(fallbackHours) && fallbackHours > 0 ? fallbackHours : 0);

        // Merge workerIds from workerSchedules too
        const scheduleWorkerIds = workerSchedules.map((s) => s.workerId).filter(Boolean);
        const allWorkerIds = Array.from(new Set([...workerIds, ...scheduleWorkerIds]));

        const existing = calendarMap.get(date) || { date, hours: 0, workerIds: [], workerSchedules: [] };

        // Merge workerSchedules (keep existing for workers not in this entry)
        const mergedSchedules = [...existing.workerSchedules];
        for (const ws of workerSchedules) {
            const idx = mergedSchedules.findIndex((e) => e.workerId === ws.workerId);
            if (idx >= 0) {
                mergedSchedules[idx] = ws;
            } else {
                mergedSchedules.push(ws);
            }
        }

        const mergedWorkerIds = Array.from(new Set([...(existing.workerIds || []), ...allWorkerIds]));
        const mergedHoursTotal = mergedSchedules.reduce((sum, s) => sum + (s.hours || 0), 0);

        calendarMap.set(date, {
            date,
            hours: mergedHoursTotal > 0 ? mergedHoursTotal : Math.max(safeHours, existing.hours || 0),
            workerIds: mergedWorkerIds,
            workerSchedules: mergedSchedules,
        });
    }

    return [...calendarMap.values()].sort((a, b) => a.date.localeCompare(b.date));
};

const buildWorkCalendarFromSchedules = (schedules = []) => {
    const derivedEntries = [];

    for (const schedule of schedules) {
        const workerId = schedule?.workerId?._id?.toString?.() || schedule?.workerId?.toString?.() || schedule?.workerId;
        for (const date of schedule?.dates || []) {
            derivedEntries.push({
                date,
                hours: 0,
                workerIds: workerId ? [workerId] : []
            });
        }
    }

    return normalizeWorkCalendar(derivedEntries);
};

const buildSchedulesFromWorkCalendar = (workCalendar = []) => {
    const grouped = new Map();

    for (const entry of normalizeWorkCalendar(workCalendar)) {
        for (const workerId of entry.workerIds || []) {
            const key = workerId?.toString?.() || workerId;
            if (!key) continue;

            if (!grouped.has(key)) {
                grouped.set(key, {
                    workerId: key,
                    dates: []
                });
            }

            grouped.get(key).dates.push(entry.date);
        }
    }

    return [...grouped.values()].map((entry) => ({
        ...entry,
        dates: [...new Set(entry.dates)].sort((a, b) => a.localeCompare(b))
    }));
};

const getTotalPlannedHours = (workCalendar = []) => (
    normalizeWorkCalendar(workCalendar).reduce((total, entry) => total + (Number(entry.hours) || 0), 0)
);

// Auto-transition Scheduled → In Progress when startDate has arrived,
// and In Progress → Completed when deadline has passed (only if no manual override).
const autoUpdateJobStatuses = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Scheduled jobs whose start date is today or in the past → In Progress
    await Job.updateMany(
        { status: 'Scheduled', startDate: { $lte: today } },
        { $set: { status: 'In Progress' } }
    );
};

const normalizeJob = (job) => {
    if (!job) return job;
    const plain = job.toObject ? job.toObject() : job;
    const workCalendar = normalizeWorkCalendar(
        plain.workCalendar?.length ? plain.workCalendar : buildWorkCalendarFromSchedules(plain.schedules || [])
    );
    return {
        ...plain,
        deadline: plain.deadline || plain.dueDate || plain.endDate || null,
        workCalendar,
        expectedHours: plain.expectedHours ?? getTotalPlannedHours(workCalendar),
        schedules: buildSchedulesFromWorkCalendar(workCalendar)
    };
};

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Private
const getJobs = asyncHandler(async (req, res) => {
    await autoUpdateJobStatuses();
    const jobs = await Job.find({})
        .populate('customerId', 'name email')
        .populate('assignedWorkers', 'name')
        .populate('quoteId', 'total quoteNumber')
        .lean();
    res.json(jobs.map(normalizeJob));
});

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Private
const getJobById = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id)
        .populate('customerId', 'name email')
        .populate('assignedWorkers', 'name')
        .lean();

    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    res.json(normalizeJob(job));
});

// @desc    Create a job (usually from a quote)
// @route   POST /api/jobs
// @access  Private/Admin
const createJob = asyncHandler(async (req, res) => {
    const {
        customerId,
        quoteId,
        title,
        description,
        startDate,
        endDate,
        deadline,
        assignedStaff,
        materials,
        expectedHours,
        assignedWorkers,
        priority,
        workCalendar,
        status
    } = req.body;
    const normalizedCalendar = normalizeWorkCalendar(workCalendar || []);
    const totalHours = expectedHours ?? getTotalPlannedHours(normalizedCalendar);
    validateDateOrder(startDate, deadline || endDate);
    validateWorkCalendarRange(normalizedCalendar, startDate, deadline || endDate);

    const newJob = await Job.create({
        customerId,
        quoteId,
        title,
        description,
        startDate: startDate || null,
        endDate: endDate || deadline || null,
        deadline: deadline || endDate || null,
        expectedHours: totalHours,
        assignedStaff,
        materials,
        workCalendar: normalizedCalendar,
        schedules: buildSchedulesFromWorkCalendar(normalizedCalendar),
        status: status || 'Scheduled',
        priority: priority || 'Medium',
        assignedWorkers: assignedWorkers || [],
    });

    const populated = await Job.findById(newJob._id)
        .populate('customerId', 'name email')
        .populate('assignedWorkers', 'name');

    res.status(201).json(normalizeJob(populated));
});

// @desc    Update job details
// @route   PUT /api/jobs/:id
// @access  Private
const updateJob = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        status,
        startDate,
        deadline,
        assignedWorkers,
        progressUpdate,
        beforeImages,
        afterImages,
        expectedHours,
        workCalendar
    } = req.body;

    const job = await Job.findById(req.params.id);
    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    const nextStartDate = startDate !== undefined ? (startDate || null) : job.startDate;
    const nextDeadline = deadline !== undefined ? (deadline || null) : (job.deadline || job.endDate);
    const nextWorkCalendar = workCalendar !== undefined ? normalizeWorkCalendar(workCalendar) : (job.workCalendar || []);
    try {
        validateDateOrder(nextStartDate, nextDeadline);
        validateWorkCalendarRange(nextWorkCalendar, nextStartDate, nextDeadline);
    } catch (error) {
        res.status(error.statusCode || 400);
        throw error;
    }

    if (title !== undefined) job.title = title || job.title;
    if (description !== undefined) job.description = description || job.description;
    if (status !== undefined) job.status = status || job.status;
    if (startDate !== undefined) job.startDate = startDate || null;
    if (deadline !== undefined) {
        job.deadline = deadline || null;
        job.endDate = deadline || null;
    }

    if (assignedWorkers) {
        job.assignedWorkers = assignedWorkers;
    }

    if (workCalendar !== undefined) {
        const normalizedCalendar = nextWorkCalendar;
        job.workCalendar = normalizedCalendar;
        job.schedules = buildSchedulesFromWorkCalendar(normalizedCalendar);
        if (expectedHours !== undefined) {
            job.expectedHours = expectedHours;
        } else if (job.expectedHours == null) {
            job.expectedHours = getTotalPlannedHours(normalizedCalendar);
        }
    } else if (expectedHours !== undefined) {
        job.expectedHours = expectedHours;
    }

    if (progressUpdate) {
        job.progressUpdates = job.progressUpdates || [];
        job.progressUpdates.push(progressUpdate);
    }
    if (beforeImages) {
        job.beforeImages = job.beforeImages || [];
        job.beforeImages = [...job.beforeImages, ...beforeImages];
    }
    if (afterImages) {
        job.afterImages = job.afterImages || [];
        job.afterImages = [...job.afterImages, ...afterImages];
    }

    await job.save();

    const populated = await Job.findById(job._id)
        .populate('customerId', 'name email')
        .populate('assignedWorkers', 'name');

    res.json(normalizeJob(populated));
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
const deleteJob = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    await Trash.create({
        itemType: 'job',
        itemId: job._id.toString(),
        itemName: job.title || 'Job',
        data: job.toObject(),
    });

    await job.deleteOne();
    res.json({ message: 'Job removed' });
});

module.exports = { getJobs, getJobById, createJob, updateJob, deleteJob, autoUpdateJobStatuses };

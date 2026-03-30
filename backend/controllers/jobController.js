const asyncHandler = require('express-async-handler');
const Job = require('../models/Job');

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

const normalizeWorkCalendar = (entries = []) => {
    const calendarMap = new Map();

    for (const rawEntry of entries) {
        const date = normalizeDateKey(rawEntry?.date);
        if (!date) continue;

        const hours = Number(rawEntry?.hours);
        const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 0;
        const workerIds = Array.from(
            new Set(
                (rawEntry?.workerIds || [])
                    .map((workerId) => workerId?._id?.toString?.() || workerId?.toString?.() || workerId)
                    .filter(Boolean)
            )
        );

        const existing = calendarMap.get(date) || { date, hours: 0, workerIds: [] };
        calendarMap.set(date, {
            date,
            hours: safeHours,
            workerIds: Array.from(new Set([...(existing.workerIds || []), ...workerIds]))
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
    const jobs = await Job.find({})
        .populate('customerId', 'name email')
        .populate('assignedWorkers', 'name')
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
        workCalendar
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
        status: 'Pending',
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
        job.expectedHours = expectedHours ?? getTotalPlannedHours(normalizedCalendar);
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

    await job.deleteOne();
    res.json({ message: 'Job removed' });
});

module.exports = { getJobs, getJobById, createJob, updateJob, deleteJob };

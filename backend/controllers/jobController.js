const asyncHandler = require('express-async-handler');
const Job = require('../models/Job');

const normalizeJob = (job) => {
    if (!job) return job;
    return {
        ...job,
        deadline: job.deadline || job.dueDate || job.endDate || null
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
        .populate('assignedWorkers', 'name');

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
    const { customerId, quoteId, title, description, startDate, endDate, assignedStaff, materials, expectedHours, assignedWorkers, priority } = req.body;

    const newJob = await Job.create({
        customerId,
        quoteId,
        title,
        description,
        startDate,
        endDate,
        expectedHours,
        assignedStaff,
        materials,
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
    const { title, description, status, deadline, assignedWorkers, progressUpdate, beforeImages, afterImages, expectedHours } = req.body;

    const job = await Job.findById(req.params.id);
    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    job.title = title || job.title;
    job.description = description || job.description;
    job.status = status || job.status;
    job.deadline = deadline || job.deadline;
    job.expectedHours = expectedHours || job.expectedHours;

    if (assignedWorkers) {
        job.assignedWorkers = assignedWorkers;
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

module.exports = { getJobs, getJobById, createJob, updateJob };

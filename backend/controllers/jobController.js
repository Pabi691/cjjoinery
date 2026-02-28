const asyncHandler = require('express-async-handler');
const mockData = require('../data/mockData');

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Private
const getJobs = asyncHandler(async (req, res) => {
    // MOCK DATA
    res.json(mockData.jobs);
});

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Private
const getJobById = asyncHandler(async (req, res) => {
    // MOCK DATA
    const job = mockData.jobs.find(j => j._id === req.params.id);

    if (job) {
        res.json(job);
    } else {
        res.status(404);
        throw new Error('Job not found');
    }
});

// @desc    Create a job (usually from a quote)
// @route   POST /api/jobs
// @access  Private/Admin
const createJob = asyncHandler(async (req, res) => {
    const { customerId, quoteId, title, description, startDate, endDate, assignedStaff, materials, expectedHours, assignedWorkers } = req.body;

    // FIND RELATED DATA
    const customer = mockData.users.find(u => u._id === customerId);

    let resolvedWorkers = [];
    if (assignedWorkers && Array.isArray(assignedWorkers)) {
        resolvedWorkers = mockData.workers.filter(w => assignedWorkers.includes(w._id));
    }

    // MOCK DATA
    const newJob = {
        _id: Date.now().toString(),
        customerId: customer || { name: 'Unknown', email: 'unknown@example.com' }, // Store full object or fallback
        quoteId,
        title,
        description,
        startDate,
        endDate,
        expectedHours,
        assignedStaff,
        materials,
        status: 'Pending',
        priority: 'Medium',
        assignedWorkers: resolvedWorkers,
    };
    mockData.jobs.push(newJob);

    res.status(201).json(newJob);
});

// @desc    Update job details
// @route   PUT /api/jobs/:id
// @access  Private
const updateJob = asyncHandler(async (req, res) => {
    const { title, description, status, deadline, assignedWorkers, progressUpdate, beforeImages, afterImages, expectedHours } = req.body;

    // MOCK DATA
    const jobIndex = mockData.jobs.findIndex(j => j._id === req.params.id);

    if (jobIndex > -1) {
        const job = mockData.jobs[jobIndex];
        job.title = title || job.title;
        job.description = description || job.description;
        job.status = status || job.status;
        job.deadline = deadline || job.deadline; // Note: Schema uses dueDate/endDate, keeping consistent with controller input
        job.expectedHours = expectedHours || job.expectedHours;

        if (assignedWorkers) {
            job.assignedWorkers = mockData.workers.filter(w => assignedWorkers.includes(w._id));
        }

        // Mock update logic for arrays
        if (progressUpdate) {
            if (!job.progressUpdates) job.progressUpdates = [];
            job.progressUpdates.push(progressUpdate);
        }
        if (beforeImages) {
            if (!job.beforeImages) job.beforeImages = [];
            job.beforeImages = [...job.beforeImages, ...beforeImages];
        }
        if (afterImages) {
            if (!job.afterImages) job.afterImages = [];
            job.afterImages = [...job.afterImages, ...afterImages];
        }

        res.json(job);
    } else {
        res.status(404);
        throw new Error('Job not found');
    }
});

module.exports = { getJobs, getJobById, createJob, updateJob };

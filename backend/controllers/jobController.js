const asyncHandler = require('express-async-handler');
const Job = require('../models/Job');

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Private
const getJobs = asyncHandler(async (req, res) => {
    const jobs = await Job.find({})
        .populate('customerId', 'name email')
        .populate('assignedStaff', 'name')
        .populate('assignedWorkers', 'name skills');
    res.json(jobs);
});

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Private
const getJobById = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id)
        .populate('customerId', 'name email')
        .populate('assignedStaff', 'name')
        .populate('assignedWorkers', 'name skills')
        .populate('quoteId');

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
    const { customerId, quoteId, title, description, startDate, endDate, assignedStaff, materials } = req.body;

    const job = new Job({
        customerId,
        quoteId,
        title,
        description,
        startDate,
        endDate,
        assignedStaff,
        materials,
    });

    const createdJob = await job.save();
    res.status(201).json(createdJob);
});

// @desc    Update job details
// @route   PUT /api/jobs/:id
// @access  Private
const updateJob = asyncHandler(async (req, res) => {
    const { title, description, status, deadline, assignedWorkers, progressUpdate, beforeImages, afterImages } = req.body;
    const job = await Job.findById(req.params.id);

    if (job) {
        job.title = title || job.title;
        job.description = description || job.description;
        job.status = status || job.status;
        job.deadline = deadline || job.deadline;
        job.assignedWorkers = assignedWorkers || job.assignedWorkers;

        if (progressUpdate) {
            job.progressUpdates.push(progressUpdate);
        }
        if (beforeImages) {
            job.beforeImages = [...job.beforeImages, ...beforeImages];
        }
        if (afterImages) {
            job.afterImages = [...job.afterImages, ...afterImages];
        }

        const updatedJob = await job.save();
        res.json(updatedJob);
    } else {
        res.status(404);
        throw new Error('Job not found');
    }
});

module.exports = { getJobs, getJobById, createJob, updateJob };

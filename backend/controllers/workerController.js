const asyncHandler = require('express-async-handler');
const Worker = require('../models/Worker');
const Job = require('../models/Job');

// @desc    Get all workers
// @route   GET /api/workers
// @access  Private
const getWorkers = asyncHandler(async (req, res) => {
    const workers = await Worker.find({}).populate('currentJob', 'title');
    res.json(workers);
});

// @desc    Get worker by ID
// @route   GET /api/workers/:id
// @access  Private
const getWorkerById = asyncHandler(async (req, res) => {
    const worker = await Worker.findById(req.params.id).populate('currentJob');

    if (worker) {
        // Aggregation for profile: Find all jobs where this worker is assigned
        const jobs = await Job.find({ assignedWorkers: req.params.id }).select('title status startDate deadline');

        res.json({ ...worker.toObject(), jobs });
    } else {
        res.status(404);
        throw new Error('Worker not found');
    }
});

// @desc    Create a new worker
// @route   POST /api/workers
// @access  Private/Admin
const createWorker = asyncHandler(async (req, res) => {
    const { name, email, phone, skills, hourlyRate, availability } = req.body;

    const worker = new Worker({
        name,
        email,
        phone,
        skills,
        hourlyRate,
        availability
    });

    const createdWorker = await worker.save();
    res.status(201).json(createdWorker);
});

// @desc    Update worker
// @route   PUT /api/workers/:id
// @access  Private/Admin
const updateWorker = asyncHandler(async (req, res) => {
    const { name, email, phone, skills, hourlyRate, availability } = req.body;
    const worker = await Worker.findById(req.params.id);

    if (worker) {
        worker.name = name || worker.name;
        worker.email = email || worker.email;
        worker.phone = phone || worker.phone;
        worker.skills = skills || worker.skills;
        worker.hourlyRate = hourlyRate || worker.hourlyRate;
        worker.availability = availability || worker.availability;

        const updatedWorker = await worker.save();
        res.json(updatedWorker);
    } else {
        res.status(404);
        throw new Error('Worker not found');
    }
});

module.exports = { getWorkers, getWorkerById, createWorker, updateWorker };

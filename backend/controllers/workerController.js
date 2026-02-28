const asyncHandler = require('express-async-handler');
const mockData = require('../data/mockData');

// @desc    Get all workers
// @route   GET /api/workers
// @access  Private
const getWorkers = asyncHandler(async (req, res) => {
    // MOCK DATA
    res.json(mockData.workers);
});

// @desc    Get worker by ID
// @route   GET /api/workers/:id
// @access  Private
const getWorkerById = asyncHandler(async (req, res) => {
    // MOCK DATA
    const worker = mockData.workers.find(w => w._id === req.params.id);

    if (worker) {
        // Mock aggregation: find jobs assigned to this worker
        const jobs = mockData.jobs.filter(j => j.assignedWorkers.some(w => w._id === req.params.id));
        res.json({ ...worker, jobs });
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

    // MOCK DATA
    const newWorker = {
        _id: Date.now().toString(),
        name,
        email,
        phone,
        skills,
        hourlyRate,
        availability
    };
    mockData.workers.push(newWorker);

    res.status(201).json(newWorker);
});

// @desc    Update worker
// @route   PUT /api/workers/:id
// @access  Private/Admin
const updateWorker = asyncHandler(async (req, res) => {
    const { name, email, phone, skills, hourlyRate, availability } = req.body;

    // MOCK DATA
    const worker = mockData.workers.find(w => w._id === req.params.id);

    if (worker) {
        worker.name = name || worker.name;
        worker.email = email || worker.email;
        worker.phone = phone || worker.phone;
        worker.skills = skills || worker.skills;
        worker.hourlyRate = hourlyRate || worker.hourlyRate;
        worker.availability = availability || worker.availability;

        res.json(worker);
    } else {
        res.status(404);
        throw new Error('Worker not found');
    }
});

module.exports = { getWorkers, getWorkerById, createWorker, updateWorker };

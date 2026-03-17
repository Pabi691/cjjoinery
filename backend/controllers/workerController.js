const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Worker = require('../models/Worker');
const Job = require('../models/Job');

const ensureDb = async () => {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        await connectDB();
    }
    return mongoose.connection && mongoose.connection.readyState === 1;
};

const sanitizeWorker = (worker) => {
    if (!worker) return null;
    const safeWorker = worker.toObject ? worker.toObject() : worker;
    delete safeWorker.password;
    return safeWorker;
};

// @desc    Get all workers
// @route   GET /api/workers
// @access  Private
const getWorkers = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const workers = await Worker.find({}).select('-password').lean();
    res.json(workers);
});

// @desc    Get worker by ID
// @route   GET /api/workers/:id
// @access  Private
const getWorkerById = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const worker = await Worker.findById(req.params.id).select('-password').lean();
    if (!worker) {
        res.status(404);
        throw new Error('Worker not found');
    }

    const jobs = await Job.find({ assignedWorkers: req.params.id })
        .populate('assignedWorkers', 'name')
        .lean();

    res.json({ ...worker, jobs });
});

// @desc    Create a new worker
// @route   POST /api/workers
// @access  Private/Admin
const createWorker = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const { name, email, phone, skills, hourlyRate, availability, username, password, status } = req.body;

    const existing = await Worker.findOne({
        $or: [
            { email },
            ...(username ? [{ username }] : [])
        ]
    });
    if (existing) {
        res.status(400);
        throw new Error('Worker already exists with this email or username');
    }

    const worker = await Worker.create({
        name,
        email,
        phone,
        skills,
        hourlyRate,
        availability,
        username,
        password,
        status
    });

    res.status(201).json(sanitizeWorker(worker));
});

// @desc    Update worker
// @route   PUT /api/workers/:id
// @access  Private/Admin
const updateWorker = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const worker = await Worker.findById(req.params.id);
    if (!worker) {
        res.status(404);
        throw new Error('Worker not found');
    }

    const { name, email, phone, skills, hourlyRate, availability, username, password, status } = req.body;

    if (email && email !== worker.email) {
        const emailExists = await Worker.findOne({ email });
        if (emailExists) {
            res.status(400);
            throw new Error('Email already in use');
        }
    }

    if (username && username !== worker.username) {
        const usernameExists = await Worker.findOne({ username });
        if (usernameExists) {
            res.status(400);
            throw new Error('Username already in use');
        }
    }

    worker.name = name ?? worker.name;
    worker.email = email ?? worker.email;
    worker.phone = phone ?? worker.phone;
    worker.skills = skills ?? worker.skills;
    if (hourlyRate !== undefined) worker.hourlyRate = Number(hourlyRate);
    worker.availability = availability ?? worker.availability;
    worker.username = username ?? worker.username;
    worker.status = status ?? worker.status;
    if (password) {
        worker.password = password;
    }

    const updated = await worker.save();
    res.json(sanitizeWorker(updated));
});

module.exports = { getWorkers, getWorkerById, createWorker, updateWorker };

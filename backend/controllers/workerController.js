const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Worker = require('../models/Worker');
const Job = require('../models/Job');
const {
    decorateWorker,
    normalizeDateKey,
    upsertStatusHistoryEntry
} = require('../utils/workerStatus');

const ensureDb = async () => {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        await connectDB();
    }
    return mongoose.connection && mongoose.connection.readyState === 1;
};

const sanitizeWorker = (worker) => {
    if (!worker) return null;
    const safeWorker = decorateWorker(worker);
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

    const workers = await Worker.find({}).lean();
    res.json(workers.map(sanitizeWorker));
});

// @desc    Get worker by ID
// @route   GET /api/workers/:id
// @access  Private
const getWorkerById = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const worker = await Worker.findById(req.params.id).lean();
    if (!worker) {
        res.status(404);
        throw new Error('Worker not found');
    }

    const jobs = await Job.find({ assignedWorkers: req.params.id })
        .populate('assignedWorkers', 'name')
        .lean();

    res.json({ ...sanitizeWorker(worker), jobs });
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
    const resolvedAvailability = availability || 'Available';
    const todayKey = normalizeDateKey(new Date());

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
        availability: resolvedAvailability,
        username,
        password,
        status,
        statusHistory: upsertStatusHistoryEntry([], {
            _id: `sh-${Date.now()}`,
            date: todayKey,
            status: resolvedAvailability,
            note: 'Initial status'
        })
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
    const nextAvailability = availability ?? worker.availability;
    const hasAvailabilityChanged =
        availability !== undefined && nextAvailability !== worker.availability;
    worker.availability = nextAvailability;
    worker.username = username ?? worker.username;
    worker.status = status ?? worker.status;
    if (password) {
        worker.password = password;
    }

    if (hasAvailabilityChanged) {
        worker.statusHistory = upsertStatusHistoryEntry(worker.statusHistory || [], {
            _id: `sh-${Date.now()}`,
            date: normalizeDateKey(new Date()),
            status: nextAvailability,
            note: 'Updated by admin'
        });
    }

    const updated = await worker.save();
    res.json(sanitizeWorker(updated));
});

// @desc    Delete worker
// @route   DELETE /api/workers/:id
// @access  Private/Admin
const deleteWorker = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const worker = await Worker.findById(req.params.id);
    if (!worker) {
        res.status(404);
        throw new Error('Worker not found');
    }

    // Remove worker from any assigned jobs
    await Job.updateMany(
        { assignedWorkers: req.params.id },
        { $pull: { assignedWorkers: req.params.id } }
    );

    await worker.deleteOne();
    res.json({ message: 'Worker deleted successfully' });
});

module.exports = { getWorkers, getWorkerById, createWorker, updateWorker, deleteWorker };

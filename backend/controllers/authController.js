const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const connectDB = require('../config/db');

const ensureDb = async () => {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        await connectDB();
    }
    return mongoose.connection && mongoose.connection.readyState === 1;
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
        return;
    }

    res.status(401);
    throw new Error('Invalid email or password');
});

// @desc    Register a new user
// @route   POST /api/auth
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, phone, address } = req.body;

    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
        phone,
        address
    });

    res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
    });
});

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }
    const users = await User.find({}).select('-password');
    res.json(users);
});

module.exports = { authUser, registerUser, getUsers };

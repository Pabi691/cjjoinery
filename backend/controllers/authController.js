const asyncHandler = require('express-async-handler');
const mockData = require('../data/mockData');
const generateToken = require('../utils/generateToken');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // FIND IN MOCK DATA
    const user = mockData.users.find(u => u.email === email);

    if (user && password === 'password123') { // Simple password check for mock
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register a new user
// @route   POST /api/auth
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, phone, address } = req.body;

    // CHECK MOCK DATA
    const userExists = mockData.users.find(u => u.email === email);

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const newUser = {
        _id: Date.now().toString(),
        name,
        email,
        role: 'user', // Default role
        phone,
        address
    };
    mockData.users.push(newUser);

    res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        token: generateToken(newUser._id),
    });
});

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
    // MOCK DATA
    res.json(mockData.users);
});

module.exports = { authUser, registerUser, getUsers };

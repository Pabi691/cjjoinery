const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');
const connectDB = require('../config/db');

const ensureDb = async () => {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        await connectDB();
    }
    return mongoose.connection && mongoose.connection.readyState === 1;
};

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }
    const customers = await User.find({ role: 'customer' }).select('-password').lean();
    res.json(customers);
});

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).select('-password').lean();
    if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
    }

    // Include related jobs
    const jobs = await Job.find({ customerId: req.params.id })
        .populate('assignedWorkers', 'name')
        .lean();

    res.json({ ...customer, jobs });
});

// @desc    Create a new customer (User with role='customer')
// @route   POST /api/customers
// @access  Private/Admin
const createCustomer = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const { name, email, phone, address, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('A user/customer with this email already exists');
    }

    const customer = await User.create({
        name,
        email,
        phone,
        address,
        role: 'customer',
        // If not provided, generate a safe random password
        password: password || Math.random().toString(36).slice(-10) + 'A1!'
    });

    res.status(201).json({
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        role: customer.role
    });
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private/Admin
const updateCustomer = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
    }

    const { name, email, phone, address } = req.body;

    if (email && email !== customer.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            res.status(400);
            throw new Error('Email already in use');
        }
    }

    customer.name = name ?? customer.name;
    customer.email = email ?? customer.email;
    customer.phone = phone ?? customer.phone;
    customer.address = address ?? customer.address;

    const updated = await customer.save();

    res.json({
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        address: updated.address,
        role: updated.role
    });
});

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
const deleteCustomer = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
    }

    // Option 1: Prevent deletion if they have jobs
    const jobCount = await Job.countDocuments({ customerId: req.params.id });
    if (jobCount > 0) {
        res.status(400);
        throw new Error('Cannot delete a customer with associated projects. Please delete the projects first.');
    }

    await customer.deleteOne();
    res.json({ message: 'Customer deleted successfully' });
});

module.exports = { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer };

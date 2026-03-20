const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Notification = require('../models/Notification');

const canUseDb = () => mongoose.connection && mongoose.connection.readyState === 1;

const ensureDb = async () => {
    if (!canUseDb()) {
        await connectDB();
    }
    return canUseDb();
};

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }
    const notifications = await Notification.find()
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
    res.json(notifications);
});

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
const getNotificationById = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }
    const notification = await Notification.findById(req.params.id).lean();
    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }
    res.json(notification);
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationRead = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }
    const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { read: true, readStatus: true },
        { new: true }
    ).lean();
    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }
    res.json(notification);
});

module.exports = { getNotifications, getNotificationById, markNotificationRead };

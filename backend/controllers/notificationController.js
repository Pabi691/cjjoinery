const asyncHandler = require('express-async-handler');
const mockData = require('../data/mockData');

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    res.json(mockData.notifications || []);
});

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
const getNotificationById = asyncHandler(async (req, res) => {
    const notification = (mockData.notifications || []).find(n => n._id === req.params.id);
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
    const notification = (mockData.notifications || []).find(n => n._id === req.params.id);
    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }
    notification.read = true;
    res.json(notification);
});

module.exports = { getNotifications, getNotificationById, markNotificationRead };

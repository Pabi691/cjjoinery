const express = require('express');
const router = express.Router();
const {
    getNotifications,
    getNotificationById,
    markNotificationRead,
    deleteNotification,
    clearAllNotifications
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getNotifications)
    .delete(protect, clearAllNotifications);

router.route('/:id')
    .get(protect, getNotificationById)
    .delete(protect, deleteNotification);

router.route('/:id/read')
    .put(protect, markNotificationRead);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
    getNotifications,
    getNotificationById,
    markNotificationRead
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getNotifications);

router.route('/:id')
    .get(protect, getNotificationById);

router.route('/:id/read')
    .put(protect, markNotificationRead);

module.exports = router;

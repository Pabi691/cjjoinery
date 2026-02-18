const express = require('express');
const router = express.Router();
const {
    getJobs,
    getJobById,
    createJob,
    updateJob,
} = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getJobs).post(protect, createJob);
router.route('/:id').get(protect, getJobById).put(protect, updateJob);

module.exports = router;

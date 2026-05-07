const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getEnquiries,
    getEnquiryById,
    createEnquiry,
    updateEnquiry,
    deleteEnquiry,
} = require('../controllers/enquiryController');

router.route('/').get(protect, getEnquiries).post(protect, createEnquiry);
router.route('/:id').get(protect, getEnquiryById).put(protect, updateEnquiry).delete(protect, deleteEnquiry);

module.exports = router;

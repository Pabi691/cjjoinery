const express = require('express');
const router = express.Router();
const {
    getLeads,
    getLeadById,
    createLead,
    updateLead,
    deleteLead,
} = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/').get(protect, getLeads).post(createLead); // Create lead likely public? For now leaving unprotected? No, safer to protect if admin creates, but customer needs to create from website.
// Making createLead public for website/mobile app leads (no auth required initially)

router
    .route('/:id')
    .get(protect, getLeadById)
    .put(protect, updateLead)
    .delete(protect, authorize('admin'), deleteLead);

module.exports = router;

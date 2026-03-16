const asyncHandler = require('express-async-handler');
const Lead = require('../models/Lead');

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private
const getLeads = asyncHandler(async (req, res) => {
    const leads = await Lead.find({}).sort({ createdAt: -1 });
    res.json(leads);
});

// @desc    Get lead by ID
// @route   GET /api/leads/:id
// @access  Private
const getLeadById = asyncHandler(async (req, res) => {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
        res.status(404);
        throw new Error('Lead not found');
    }
    res.json(lead);
});

// @desc    Create a lead
// @route   POST /api/leads
// @access  Public (or Private depending on if customer creates it or admin)
const createLead = asyncHandler(async (req, res) => {
    const { customerName, phone, email, address, serviceType, description } = req.body;
    const newLead = await Lead.create({
        customerName,
        phone,
        email,
        address,
        serviceType,
        description,
        status: 'New',
    });

    res.status(201).json(newLead);
});

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
const updateLead = asyncHandler(async (req, res) => {
    const { status, assignedTo, description } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
        res.status(404);
        throw new Error('Lead not found');
    }

    lead.status = status || lead.status;
    lead.assignedTo = assignedTo || lead.assignedTo;
    lead.description = description || lead.description;

    await lead.save();
    res.json(lead);
});

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private/Admin
const deleteLead = asyncHandler(async (req, res) => {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
        res.status(404);
        throw new Error('Lead not found');
    }
    res.json({ message: 'Lead removed' });
});

module.exports = { getLeads, getLeadById, createLead, updateLead, deleteLead };

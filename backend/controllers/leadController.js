const asyncHandler = require('express-async-handler');
const Lead = require('../models/Lead');

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private
const getLeads = asyncHandler(async (req, res) => {
    const leads = await Lead.find({});
    res.json(leads);
});

// @desc    Get lead by ID
// @route   GET /api/leads/:id
// @access  Private
const getLeadById = asyncHandler(async (req, res) => {
    const lead = await Lead.findById(req.params.id);
    if (lead) {
        res.json(lead);
    } else {
        res.status(404);
        throw new Error('Lead not found');
    }
});

// @desc    Create a lead
// @route   POST /api/leads
// @access  Public (or Private depending on if customer creates it or admin)
const createLead = asyncHandler(async (req, res) => {
    const { customerName, phone, email, address, serviceType, description } = req.body;

    const lead = new Lead({
        customerName,
        phone,
        email,
        address,
        serviceType,
        description,
    });

    const createdLead = await lead.save();
    res.status(201).json(createdLead);
});

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
const updateLead = asyncHandler(async (req, res) => {
    const { status, assignedTo, description } = req.body;
    const lead = await Lead.findById(req.params.id);

    if (lead) {
        lead.status = status || lead.status;
        lead.assignedTo = assignedTo || lead.assignedTo;
        lead.description = description || lead.description;

        const updatedLead = await lead.save();
        res.json(updatedLead);
    } else {
        res.status(404);
        throw new Error('Lead not found');
    }
});

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private/Admin
const deleteLead = asyncHandler(async (req, res) => {
    const lead = await Lead.findById(req.params.id);

    if (lead) {
        await lead.deleteOne();
        res.json({ message: 'Lead removed' });
    } else {
        res.status(404);
        throw new Error('Lead not found');
    }
});

module.exports = { getLeads, getLeadById, createLead, updateLead, deleteLead };

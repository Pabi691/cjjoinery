const asyncHandler = require('express-async-handler');
const mockData = require('../data/mockData');

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private
const getLeads = asyncHandler(async (req, res) => {
    // MOCK DATA
    res.json(mockData.leads);
});

// @desc    Get lead by ID
// @route   GET /api/leads/:id
// @access  Private
const getLeadById = asyncHandler(async (req, res) => {
    // MOCK DATA
    const lead = mockData.leads.find(l => l._id === req.params.id);
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

    // MOCK DATA
    const newLead = {
        _id: Date.now().toString(),
        customerName,
        phone,
        email,
        address,
        serviceType,
        description,
        status: 'New',
        createdAt: new Date().toISOString()
    };
    mockData.leads.push(newLead);

    res.status(201).json(newLead);
});

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
const updateLead = asyncHandler(async (req, res) => {
    const { status, assignedTo, description } = req.body;

    // MOCK DATA
    const lead = mockData.leads.find(l => l._id === req.params.id);

    if (lead) {
        lead.status = status || lead.status;
        lead.assignedTo = assignedTo || lead.assignedTo;
        lead.description = description || lead.description;

        res.json(lead);
    } else {
        res.status(404);
        throw new Error('Lead not found');
    }
});

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private/Admin
const deleteLead = asyncHandler(async (req, res) => {
    // MOCK DATA
    const leadIndex = mockData.leads.findIndex(l => l._id === req.params.id);

    if (leadIndex > -1) {
        mockData.leads.splice(leadIndex, 1);
        res.json({ message: 'Lead removed' });
    } else {
        res.status(404);
        throw new Error('Lead not found');
    }
});

module.exports = { getLeads, getLeadById, createLead, updateLead, deleteLead };

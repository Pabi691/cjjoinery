const asyncHandler = require('express-async-handler');
const Enquiry = require('../models/Enquiry');
const Trash = require('../models/Trash');

// GET /api/enquiries
const getEnquiries = asyncHandler(async (req, res) => {
    const enquiries = await Enquiry.find({})
        .populate('customerId', 'name email phone')
        .sort({ createdAt: -1 });
    res.json(enquiries);
});

// GET /api/enquiries/:id
const getEnquiryById = asyncHandler(async (req, res) => {
    const enquiry = await Enquiry.findById(req.params.id).populate('customerId', 'name email phone');
    if (!enquiry) { res.status(404); throw new Error('Enquiry not found'); }
    res.json(enquiry);
});

// POST /api/enquiries
const createEnquiry = asyncHandler(async (req, res) => {
    const { title, description, customerId, notes } = req.body;
    const enquiry = await Enquiry.create({ title, description, customerId, notes, status: 'New' });
    const populated = await Enquiry.findById(enquiry._id).populate('customerId', 'name email phone');
    res.status(201).json(populated);
});

// PUT /api/enquiries/:id
const updateEnquiry = asyncHandler(async (req, res) => {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) { res.status(404); throw new Error('Enquiry not found'); }

    const { title, description, customerId, status, notes } = req.body;
    if (title       !== undefined) enquiry.title       = title;
    if (description !== undefined) enquiry.description = description;
    if (customerId  !== undefined) enquiry.customerId  = customerId;
    if (status      !== undefined) enquiry.status      = status;
    if (notes       !== undefined) enquiry.notes       = notes;

    const updated = await enquiry.save();
    const populated = await Enquiry.findById(updated._id).populate('customerId', 'name email phone');
    res.json(populated);
});

// DELETE /api/enquiries/:id
const deleteEnquiry = asyncHandler(async (req, res) => {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) { res.status(404); throw new Error('Enquiry not found'); }
    await Trash.create({
        itemType: 'enquiry',
        itemId: enquiry._id.toString(),
        itemName: enquiry.title || 'Enquiry',
        data: enquiry.toObject(),
    });
    await enquiry.deleteOne();
    res.json({ message: 'Enquiry deleted' });
});

module.exports = { getEnquiries, getEnquiryById, createEnquiry, updateEnquiry, deleteEnquiry };

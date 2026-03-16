const asyncHandler = require('express-async-handler');
const Quote = require('../models/Quote');

// @desc    Get all quotes
// @route   GET /api/quotes
// @access  Private
const getQuotes = asyncHandler(async (req, res) => {
    const quotes = await Quote.find({})
        .populate('leadId', 'customerName email phone')
        .populate('customerId', 'name email')
        .sort({ createdAt: -1 });
    res.json(quotes);
});

// @desc    Get quote by ID
// @route   GET /api/quotes/:id
// @access  Private
const getQuoteById = asyncHandler(async (req, res) => {
    const quote = await Quote.findById(req.params.id)
        .populate('leadId', 'customerName email phone')
        .populate('customerId', 'name email');
    if (!quote) {
        res.status(404);
        throw new Error('Quote not found');
    }
    res.json(quote);
});

// @desc    Create a quote
// @route   POST /api/quotes
// @access  Private (Staff/Admin)
const createQuote = asyncHandler(async (req, res) => {
    const { leadId, customerId, items, subtotal, vat, total, validUntil } = req.body;
    const newQuote = await Quote.create({
        leadId,
        customerId,
        items,
        subtotal,
        vat,
        total,
        validUntil,
        status: 'Pending'
    });

    const populated = await Quote.findById(newQuote._id)
        .populate('leadId', 'customerName email phone')
        .populate('customerId', 'name email');

    res.status(201).json(populated);
});

// @desc    Update quote status
// @route   PUT /api/quotes/:id
// @access  Private
const updateQuote = asyncHandler(async (req, res) => {
    const { status } = req.body; // Approved, Rejected
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
        res.status(404);
        throw new Error('Quote not found');
    }
    quote.status = status || quote.status;
    await quote.save();
    res.json(quote);
});

module.exports = { getQuotes, getQuoteById, createQuote, updateQuote };

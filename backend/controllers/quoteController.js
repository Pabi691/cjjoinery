const asyncHandler = require('express-async-handler');
const Quote = require('../models/Quote');

// @desc    Get all quotes
// @route   GET /api/quotes
// @access  Private
const getQuotes = asyncHandler(async (req, res) => {
    const quotes = await Quote.find({}).populate('leadId', 'customerName');
    res.json(quotes);
});

// @desc    Get quote by ID
// @route   GET /api/quotes/:id
// @access  Private
const getQuoteById = asyncHandler(async (req, res) => {
    const quote = await Quote.findById(req.params.id).populate('leadId');
    if (quote) {
        res.json(quote);
    } else {
        res.status(404);
        throw new Error('Quote not found');
    }
});

// @desc    Create a quote
// @route   POST /api/quotes
// @access  Private (Staff/Admin)
const createQuote = asyncHandler(async (req, res) => {
    const { leadId, customerId, items, subtotal, vat, total, validUntil } = req.body;

    const quote = new Quote({
        leadId,
        customerId,
        items,
        subtotal,
        vat,
        total,
        validUntil,
    });

    const createdQuote = await quote.save();
    res.status(201).json(createdQuote);
});

// @desc    Update quote status
// @route   PUT /api/quotes/:id
// @access  Private
const updateQuote = asyncHandler(async (req, res) => {
    const { status } = req.body; // Approved, Rejected
    const quote = await Quote.findById(req.params.id);

    if (quote) {
        quote.status = status || quote.status;
        const updatedQuote = await quote.save();
        res.json(updatedQuote);
    } else {
        res.status(404);
        throw new Error('Quote not found');
    }
});

module.exports = { getQuotes, getQuoteById, createQuote, updateQuote };

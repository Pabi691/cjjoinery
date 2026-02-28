const asyncHandler = require('express-async-handler');
const mockData = require('../data/mockData');

// @desc    Get all quotes
// @route   GET /api/quotes
// @access  Private
const getQuotes = asyncHandler(async (req, res) => {
    // MOCK DATA
    res.json(mockData.quotes);
});

// @desc    Get quote by ID
// @route   GET /api/quotes/:id
// @access  Private
const getQuoteById = asyncHandler(async (req, res) => {
    // MOCK DATA
    const quote = mockData.quotes.find(q => q._id === req.params.id);
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

    // MOCK DATA
    const newQuote = {
        _id: Date.now().toString(),
        leadId,
        customerId,
        items,
        subtotal,
        vat,
        total,
        validUntil,
        status: 'Draft'
    };
    mockData.quotes.push(newQuote);

    res.status(201).json(newQuote);
});

// @desc    Update quote status
// @route   PUT /api/quotes/:id
// @access  Private
const updateQuote = asyncHandler(async (req, res) => {
    const { status } = req.body; // Approved, Rejected

    // MOCK DATA
    const quote = mockData.quotes.find(q => q._id === req.params.id);

    if (quote) {
        quote.status = status || quote.status;
        res.json(quote);
    } else {
        res.status(404);
        throw new Error('Quote not found');
    }
});

module.exports = { getQuotes, getQuoteById, createQuote, updateQuote };

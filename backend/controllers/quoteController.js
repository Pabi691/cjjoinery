const asyncHandler = require('express-async-handler');
const Quote = require('../models/Quote');

// @desc    Get all quotes
// @route   GET /api/quotes
const getQuotes = asyncHandler(async (req, res) => {
    const quotes = await Quote.find({})
        .populate('customerId', 'name email')
        .sort({ createdAt: -1 });
    res.json(quotes);
});

// @desc    Get quote by ID
// @route   GET /api/quotes/:id
const getQuoteById = asyncHandler(async (req, res) => {
    const quote = await Quote.findById(req.params.id)
        .populate('customerId', 'name email');
    if (!quote) { res.status(404); throw new Error('Quote not found'); }
    res.json(quote);
});

// @desc    Create a quote
// @route   POST /api/quotes
const createQuote = asyncHandler(async (req, res) => {
    const { customerId, items, subtotal, vat, total, validUntil } = req.body;
    const newQuote = await Quote.create({ customerId, items, subtotal, vat, total, validUntil, status: 'Pending' });
    const populated = await Quote.findById(newQuote._id).populate('customerId', 'name email');
    res.status(201).json(populated);
});

// @desc    Update a quote (status + all fields)
// @route   PUT /api/quotes/:id
const updateQuote = asyncHandler(async (req, res) => {
    const quote = await Quote.findById(req.params.id);
    if (!quote) { res.status(404); throw new Error('Quote not found'); }

    const { customerId, items, subtotal, vat, total, validUntil, status } = req.body;
    if (customerId !== undefined) quote.customerId = customerId;
    if (items      !== undefined) quote.items      = items;
    if (subtotal   !== undefined) quote.subtotal   = subtotal;
    if (vat        !== undefined) quote.vat        = vat;
    if (total      !== undefined) quote.total      = total;
    if (validUntil !== undefined) quote.validUntil = validUntil;
    if (status     !== undefined) quote.status     = status;

    const updated = await quote.save();
    const populated = await Quote.findById(updated._id).populate('customerId', 'name email');
    res.json(populated);
});

// @desc    Delete a quote
// @route   DELETE /api/quotes/:id
const deleteQuote = asyncHandler(async (req, res) => {
    const quote = await Quote.findById(req.params.id);
    if (!quote) { res.status(404); throw new Error('Quote not found'); }
    await quote.deleteOne();
    res.json({ message: 'Quote deleted' });
});

module.exports = { getQuotes, getQuoteById, createQuote, updateQuote, deleteQuote };

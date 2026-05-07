const asyncHandler = require('express-async-handler');
const Quote = require('../models/Quote');
const Enquiry = require('../models/Enquiry');
const Trash = require('../models/Trash');

// GET /api/quotes
const getQuotes = asyncHandler(async (req, res) => {
    const quotes = await Quote.find({})
        .populate('customerId', 'name email')
        .populate('enquiryId', 'title description')
        .sort({ createdAt: -1 });
    res.json(quotes);
});

// GET /api/quotes/:id
const getQuoteById = asyncHandler(async (req, res) => {
    const quote = await Quote.findById(req.params.id)
        .populate('customerId', 'name email')
        .populate('enquiryId', 'title');
    if (!quote) { res.status(404); throw new Error('Quote not found'); }
    res.json(quote);
});

// POST /api/quotes
const createQuote = asyncHandler(async (req, res) => {
    const { customerId, enquiryId, items, subtotal, vat, total, validUntil } = req.body;
    const newQuote = await Quote.create({ customerId, enquiryId, items, subtotal, vat, total, validUntil, status: 'Pending' });

    // Mark linked enquiry as Quoted
    if (enquiryId) {
        await Enquiry.findByIdAndUpdate(enquiryId, { status: 'Quoted' });
    }

    const populated = await Quote.findById(newQuote._id)
        .populate('customerId', 'name email')
        .populate('enquiryId', 'title');
    res.status(201).json(populated);
});

// PUT /api/quotes/:id
const updateQuote = asyncHandler(async (req, res) => {
    const quote = await Quote.findById(req.params.id);
    if (!quote) { res.status(404); throw new Error('Quote not found'); }

    const { customerId, enquiryId, items, subtotal, vat, total, validUntil, status } = req.body;
    if (customerId  !== undefined) quote.customerId  = customerId;
    if (enquiryId   !== undefined) quote.enquiryId   = enquiryId;
    if (items       !== undefined) quote.items       = items;
    if (subtotal    !== undefined) quote.subtotal    = subtotal;
    if (vat         !== undefined) quote.vat         = vat;
    if (total       !== undefined) quote.total       = total;
    if (validUntil  !== undefined) quote.validUntil  = validUntil;
    if (status      !== undefined) quote.status      = status;

    // Sync enquiry status with quote outcome
    if (status === 'Approved' && quote.enquiryId) {
        await Enquiry.findByIdAndUpdate(quote.enquiryId, { status: 'Won' });
    } else if (status === 'Rejected' && quote.enquiryId) {
        await Enquiry.findByIdAndUpdate(quote.enquiryId, { status: 'Lost' });
    } else if (status === 'Pending' && quote.enquiryId) {
        await Enquiry.findByIdAndUpdate(quote.enquiryId, { status: 'Quoted' });
    }

    const updated = await quote.save();
    const populated = await Quote.findById(updated._id)
        .populate('customerId', 'name email')
        .populate('enquiryId', 'title');
    res.json(populated);
});

// DELETE /api/quotes/:id
const deleteQuote = asyncHandler(async (req, res) => {
    const quote = await Quote.findById(req.params.id);
    if (!quote) { res.status(404); throw new Error('Quote not found'); }
    await Trash.create({
        itemType: 'quote',
        itemId: quote._id.toString(),
        itemName: quote.quoteNumber || 'Quote',
        data: quote.toObject(),
    });
    await quote.deleteOne();
    res.json({ message: 'Quote deleted' });
});

module.exports = { getQuotes, getQuoteById, createQuote, updateQuote, deleteQuote };

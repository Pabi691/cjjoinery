const asyncHandler = require('express-async-handler');
const mockData = require('../data/mockData');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = asyncHandler(async (req, res) => {
    // MOCK DATA
    res.json(mockData.invoices);
});

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = asyncHandler(async (req, res) => {
    // MOCK DATA
    const invoice = mockData.invoices.find(i => i._id === req.params.id);
    if (invoice) {
        res.json(invoice);
    } else {
        res.status(404);
        throw new Error('Invoice not found');
    }
});

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private/Admin
const createInvoice = asyncHandler(async (req, res) => {
    const { jobId, invoiceNumber, customerName, customerEmail, dueDate, items, totalAmount } = req.body;

    // MOCK DATA
    const newInvoice = {
        _id: Date.now().toString(),
        jobId,
        invoiceNumber,
        customerName,
        customerEmail,
        dueDate,
        items,
        totalAmount,
        status: 'Sent', // Default
        payments: []
    };
    mockData.invoices.push(newInvoice);

    res.status(201).json(newInvoice);
});

// @desc    Update invoice (e.g., mark as paid)
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = asyncHandler(async (req, res) => {
    const { status, payment } = req.body;

    // MOCK DATA
    const invoice = mockData.invoices.find(i => i._id === req.params.id);

    if (invoice) {
        invoice.status = status || invoice.status;
        if (payment) {
            if (!invoice.payments) invoice.payments = [];
            invoice.payments.push(payment);
        }

        res.json(invoice);
    } else {
        res.status(404);
        throw new Error('Invoice not found');
    }
});

module.exports = { getInvoices, getInvoiceById, createInvoice, updateInvoice };

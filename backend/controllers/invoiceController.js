const asyncHandler = require('express-async-handler');
const Invoice = require('../models/Invoice');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = asyncHandler(async (req, res) => {
    const invoices = await Invoice.find({}).populate('jobId', 'title');
    res.json(invoices);
});

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id).populate('jobId');
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

    const invoice = new Invoice({
        jobId,
        invoiceNumber,
        customerName,
        customerEmail,
        dueDate,
        items,
        totalAmount,
    });

    const createdInvoice = await invoice.save();
    res.status(201).json(createdInvoice);
});

// @desc    Update invoice (e.g., mark as paid)
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = asyncHandler(async (req, res) => {
    const { status, payment } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (invoice) {
        invoice.status = status || invoice.status;
        if (payment) {
            invoice.payments.push(payment);
        }

        const updatedInvoice = await invoice.save();
        res.json(updatedInvoice);
    } else {
        res.status(404);
        throw new Error('Invoice not found');
    }
});

module.exports = { getInvoices, getInvoiceById, createInvoice, updateInvoice };

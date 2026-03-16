const asyncHandler = require('express-async-handler');
const Invoice = require('../models/Invoice');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = asyncHandler(async (req, res) => {
    const invoices = await Invoice.find({}).sort({ createdAt: -1 });
    res.json(invoices);
});

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
        res.status(404);
        throw new Error('Invoice not found');
    }
    res.json(invoice);
});

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private/Admin
const createInvoice = asyncHandler(async (req, res) => {
    const { jobId, invoiceNumber, customerName, customerEmail, dueDate, items, totalAmount } = req.body;
    const newInvoice = await Invoice.create({
        jobId,
        invoiceNumber,
        customerName,
        customerEmail,
        dueDate,
        items,
        totalAmount,
        status: 'Unpaid',
        payments: []
    });

    res.status(201).json(newInvoice);
});

// @desc    Update invoice (e.g., mark as paid)
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = asyncHandler(async (req, res) => {
    const { status, payment } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
        res.status(404);
        throw new Error('Invoice not found');
    }

    invoice.status = status || invoice.status;
    if (payment) {
        invoice.payments = invoice.payments || [];
        invoice.payments.push(payment);
    }

    await invoice.save();
    res.json(invoice);
});

module.exports = { getInvoices, getInvoiceById, createInvoice, updateInvoice };

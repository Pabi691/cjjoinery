const mongoose = require('mongoose');

const invoiceSchema = mongoose.Schema(
    {
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
            required: true,
        },
        invoiceNumber: { type: String, required: true, unique: true },
        customerName: { type: String, required: true },
        customerEmail: { type: String, required: true },
        issueDate: { type: Date, default: Date.now },
        dueDate: { type: Date, required: true },
        items: [
            {
                description: String,
                quantity: Number,
                price: Number,
            },
        ],
        totalAmount: { type: Number, required: true },
        status: {
            type: String,
            enum: ['Unpaid', 'Paid', 'Overdue'],
            default: 'Unpaid',
        },
        payments: [
            {
                amount: Number,
                method: String,
                transactionId: String,
                paidAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;

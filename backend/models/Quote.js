const mongoose = require('mongoose');

const quoteSchema = mongoose.Schema(
    {
        quoteNumber: { type: String, unique: true }, // Logic to auto-increment needed
        leadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lead',
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        items: [
            {
                description: String,
                quantity: Number,
                price: Number,
            },
        ],
        subtotal: { type: Number, required: true },
        vat: { type: Number, default: 0 },
        total: { type: Number, required: true },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending',
        },
        validUntil: { type: Date },
        pdfUrl: { type: String },
    },
    {
        timestamps: true,
    }
);

// Pre-save hook to generate quote number if not exists
// Pre-save hook to generate quote number if not exists
quoteSchema.pre('save', async function () {
    if (!this.quoteNumber) {
        // Simple generation logic, in production should specific counter collection
        const count = await mongoose.model('Quote').countDocuments();
        this.quoteNumber = `Q${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
    }
});

const Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote;

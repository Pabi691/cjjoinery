const mongoose = require('mongoose');

const enquirySchema = mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['New', 'Quoted', 'Won', 'Lost'],
            default: 'New',
        },
        notes: { type: String },
    },
    { timestamps: true }
);

const Enquiry = mongoose.model('Enquiry', enquirySchema);

module.exports = Enquiry;

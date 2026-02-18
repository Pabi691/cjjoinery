const mongoose = require('mongoose');

const leadSchema = mongoose.Schema(
    {
        customerName: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true },
        address: { type: String, required: true },
        serviceType: {
            type: String,
            required: true,
            enum: [
                'Bespoke Wardrobes',
                'Kitchen Installations',
                'Storage Solutions',
                'Media Walls',
                'General Joinery',
                'Repairs',
                'Extensions',
                'Garage Roofs',
                'Other',
            ],
        },
        description: { type: String },
        images: [{ type: String }],
        status: {
            type: String,
            enum: ['New', 'Contacted', 'Quoted', 'Won', 'Lost'],
            default: 'New',
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;

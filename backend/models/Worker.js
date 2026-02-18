const mongoose = require('mongoose');

const workerSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        phone: {
            type: String,
            required: true,
        },
        skills: [{ type: String }], // e.g., 'Carpentry', 'Plumbing', 'Electrical'
        hourlyRate: {
            type: Number,
            required: true,
            default: 0,
        },
        availability: {
            type: String,
            enum: ['Available', 'Busy', 'On Leave'],
            default: 'Available',
        },
        currentJob: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
        },
    },
    {
        timestamps: true,
    }
);

const Worker = mongoose.model('Worker', workerSchema);

module.exports = Worker;

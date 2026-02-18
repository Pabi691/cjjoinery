const mongoose = require('mongoose');

const jobSchema = mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        quoteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quote',
            required: true,
        },
        title: { type: String, required: true },
        description: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        deadline: { type: Date }, // Target completion date
        completionTime: { type: Number }, // Actual time taken in hours
        status: {
            type: String,
            enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Pending'],
            default: 'Scheduled',
        },
        assignedWorkers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Worker',
            },
        ],
        assignedStaff: [ // Creating a backup/legacy field if needed, or keeping for User-based staff
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        materials: [{ type: String }],
        progressUpdates: [
            {
                date: { type: Date, default: Date.now },
                description: String,
                images: [String],
                updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
            },
        ],
        beforeImages: [String],
        afterImages: [String],
    },
    {
        timestamps: true,
    }
);

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;

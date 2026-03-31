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
        },
        title: { type: String, required: true },
        description: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        deadline: { type: Date }, // Target completion date
        completionTime: { type: Number }, // Actual time taken in hours
        expectedHours: { type: Number },
        status: {
            type: String,
            enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Pending'],
            default: 'Scheduled',
        },
        priority: { type: String },
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
        workCalendar: [
            {
                date: { type: String },
                hours: { type: Number, default: 0 },
                workerIds: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Worker',
                    },
                ],
            }
        ],
        schedules: [
            {
                workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
                dates: [String]
            }
        ],
        dailyLogs: [
            {
                workerId: { type: mongoose.Schema.Types.Mixed },
                workerName: { type: String },
                date: { type: Date },
                description: { type: String },
                imageUrl: { type: String },
                image: {
                    data: { type: Buffer, select: false },
                    contentType: { type: String, select: false },
                    filename: { type: String, select: false }
                },
                location: {
                    lat: Number,
                    lng: Number,
                    address: String
                },
                createdAt: { type: Date, default: Date.now }
            }
        ],
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

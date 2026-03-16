const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const workerSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            unique: true,
            sparse: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
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
        status: {
            type: String,
        },
        availability: {
            type: String,
            enum: ['Available', 'Busy', 'On Leave'],
            default: 'Available',
        },
        statusHistory: [
            {
                _id: { type: String },
                date: { type: String },
                status: { type: String },
                note: { type: String },
            }
        ],
        currentJob: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
        },
    },
    {
        timestamps: true,
    }
);

workerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    if (this.password && this.password.startsWith('$2')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const Worker = mongoose.model('Worker', workerSchema);

module.exports = Worker;

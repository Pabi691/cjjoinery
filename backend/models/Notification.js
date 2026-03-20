const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        title: { type: String },
        body: { type: String },
        readStatus: { type: Boolean, default: false },
        type: { type: String }, // e.g., 'quote', 'job', 'invoice'
        referenceId: { type: mongoose.Schema.Types.String }, // ID of the related object
        workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
        workerName: { type: String },
        message: { type: String },
        details: { type: mongoose.Schema.Types.Mixed },
        read: { type: Boolean, default: false }
    },
    {
        timestamps: true,
    }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

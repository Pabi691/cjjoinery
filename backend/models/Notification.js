const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: { type: String, required: true },
        body: { type: String, required: true },
        readStatus: { type: Boolean, default: false },
        type: { type: String }, // e.g., 'quote', 'job', 'invoice'
        referenceId: { type: mongoose.Schema.Types.String }, // ID of the related object
    },
    {
        timestamps: true,
    }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

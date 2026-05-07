const mongoose = require('mongoose');

const trashSchema = new mongoose.Schema({
    itemType: { type: String, required: true }, // 'worker' | 'job' | 'customer' | 'quote' | 'enquiry'
    itemId:   { type: String, required: true },
    itemName: { type: String, default: 'Unknown' },
    data:     { type: mongoose.Schema.Types.Mixed, required: true },
    deletedAt:{ type: Date, default: Date.now },
});

module.exports = mongoose.model('Trash', trashSchema);

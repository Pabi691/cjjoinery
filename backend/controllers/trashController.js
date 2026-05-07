const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Trash = require('../models/Trash');
const Worker = require('../models/Worker');
const Job = require('../models/Job');
const User = require('../models/User');
const Quote = require('../models/Quote');
const Enquiry = require('../models/Enquiry');

const canUseDb = () => mongoose.connection && mongoose.connection.readyState === 1;
const ensureDb = async () => { if (!canUseDb()) await connectDB(); return canUseDb(); };

// GET /api/trash
const getTrash = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) { res.status(503); throw new Error('Database not connected'); }
    const items = await Trash.find().sort({ deletedAt: -1 }).lean();
    res.json(items);
});

// POST /api/trash/:id/restore
const restoreTrashItem = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) { res.status(503); throw new Error('Database not connected'); }

    const trashItem = await Trash.findById(req.params.id);
    if (!trashItem) { res.status(404); throw new Error('Trash item not found'); }

    const { itemType, data } = trashItem;
    // Strip Mongoose metadata, keep _id so original reference is preserved
    const rawData = { ...data };

    try {
        switch (itemType) {
            case 'worker':   await Worker.create(rawData);   break;
            case 'job':      await Job.create(rawData);      break;
            case 'customer': await User.create(rawData);     break;
            case 'quote':    await Quote.create(rawData);    break;
            case 'enquiry':  await Enquiry.create(rawData);  break;
            default:
                res.status(400); throw new Error('Unknown item type');
        }
    } catch (err) {
        res.status(500);
        throw new Error(`Restore failed: ${err.message}`);
    }

    await trashItem.deleteOne();
    res.json({ message: `${itemType} restored successfully` });
});

// DELETE /api/trash/:id  (permanently delete one)
const deleteTrashItem = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) { res.status(503); throw new Error('Database not connected'); }
    const item = await Trash.findByIdAndDelete(req.params.id);
    if (!item) { res.status(404); throw new Error('Trash item not found'); }
    res.json({ message: 'Permanently deleted' });
});

// DELETE /api/trash  (empty entire trash)
const emptyTrash = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) { res.status(503); throw new Error('Database not connected'); }
    await Trash.deleteMany({});
    res.json({ message: 'Trash emptied' });
});

module.exports = { getTrash, restoreTrashItem, deleteTrashItem, emptyTrash };

const express = require('express');
const router = express.Router();
const { getTrash, restoreTrashItem, deleteTrashItem, emptyTrash } = require('../controllers/trashController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getTrash)
    .delete(protect, emptyTrash);

router.route('/:id/restore')
    .post(protect, restoreTrashItem);

router.route('/:id')
    .delete(protect, deleteTrashItem);

module.exports = router;

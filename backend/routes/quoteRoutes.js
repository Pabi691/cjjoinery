const express = require('express');
const router = express.Router();
const {
    getQuotes,
    getQuoteById,
    createQuote,
    updateQuote,
} = require('../controllers/quoteController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getQuotes).post(protect, createQuote);
router.route('/:id').get(protect, getQuoteById).put(protect, updateQuote);

module.exports = router;

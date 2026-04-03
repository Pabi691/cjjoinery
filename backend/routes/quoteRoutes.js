const express = require('express');
const router = express.Router();
const { getQuotes, getQuoteById, createQuote, updateQuote, deleteQuote } = require('../controllers/quoteController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getQuotes).post(protect, createQuote);
router.route('/:id').get(protect, getQuoteById).put(protect, updateQuote).delete(protect, deleteQuote);

module.exports = router;

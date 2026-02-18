const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
const getReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({}).populate('customerId', 'name');
    res.json(reviews);
});

// @desc    Create review
// @route   POST /api/reviews
// @access  Private (Customer)
const createReview = asyncHandler(async (req, res) => {
    const { jobId, rating, comment } = req.body;

    const review = new Review({
        customerId: req.user._id,
        jobId,
        rating,
        comment,
    });

    const createdReview = await review.save();
    res.status(201).json(createdReview);
});

module.exports = { getReviews, createReview };

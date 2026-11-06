// routes/reviews.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync');
const reviewController = require('../controllers/reviews');
const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware');
// Reviews route
router.post('/', isLoggedIn, validateReview, wrapAsync(reviewController.newReview));

// Delete review route
router.delete('/:reviewId', isLoggedIn, isReviewAuthor, wrapAsync(reviewController.destroyListing));

module.exports = router;

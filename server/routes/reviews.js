const router = require('express').Router();
const { createReview, getUserReviews } = require('../controllers/reviewsController');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, createReview);
router.get('/user/:id', getUserReviews);

module.exports = router;

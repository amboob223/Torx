const router = require('express').Router();
const { getProfile, updateProfile } = require('../controllers/usersController');
const { authMiddleware } = require('../middleware/auth');

router.get('/:id', authMiddleware, getProfile);
router.patch('/me', authMiddleware, updateProfile);

module.exports = router;

const router = require('express').Router();
const { register, login, me, deleteAccount } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, me);
router.delete('/account', authMiddleware, deleteAccount);

module.exports = router;
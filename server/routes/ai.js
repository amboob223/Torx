const router = require('express').Router();
const { diagnose } = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/auth');

router.post('/diagnose', authMiddleware, diagnose);

module.exports = router;

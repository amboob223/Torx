const router = require('express').Router();
const { createPaymentIntent, createConnectAccount, getConnectStatus, webhook } = require('../controllers/paymentsController');
const { authMiddleware } = require('../middleware/auth');

// Webhook must come BEFORE express.json() parsing — raw body required
router.post('/webhook', webhook);

router.post('/intent', authMiddleware, createPaymentIntent);
router.post('/connect', authMiddleware, createConnectAccount);
router.get('/connect/status', authMiddleware, getConnectStatus);

module.exports = router;
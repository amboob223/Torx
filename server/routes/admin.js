const router = require('express').Router();
const { getStats } = require('../controllers/adminController');

// Simple admin protection via secret header
const adminAuth = (req, res, next) => {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.get('/stats', adminAuth, getStats);

module.exports = router;
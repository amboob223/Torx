const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { createJob, getJobs, getJobById, acceptJob, declineJob, completeJob, setPrice } = require('../controllers/jobsController');

router.post('/', authMiddleware, createJob);
router.get('/', authMiddleware, getJobs);
router.get('/:id', authMiddleware, getJobById);
router.patch('/:id/accept', authMiddleware, acceptJob);
router.patch('/:id/decline', authMiddleware, declineJob);
router.patch('/:id/complete', authMiddleware, completeJob);
router.patch('/:id/price', authMiddleware, setPrice);

module.exports = router;
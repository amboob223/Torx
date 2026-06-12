const pool = require('../config/db');

exports.createReview = async (req, res) => {
  const { job_id, rating, comment } = req.body;
  if (!job_id || !rating) return res.status(400).json({ error: 'job_id and rating required' });
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

  try {
    const jobResult = await pool.query('SELECT * FROM jobs WHERE id=$1', [job_id]);
    const job = jobResult.rows[0];
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'completed') return res.status(400).json({ error: 'Can only review completed jobs' });
    if (job.torkee_id !== req.user.id) return res.status(403).json({ error: 'Not your job' });

    const review = await pool.query(
      `INSERT INTO reviews (job_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [job_id, req.user.id, job.torka_id, rating, comment || null]
    );

    // Update Torka's rating average
    await pool.query(
      `UPDATE users SET
         rating_avg = (SELECT AVG(rating) FROM reviews WHERE reviewee_id=$1),
         rating_count = (SELECT COUNT(*) FROM reviews WHERE reviewee_id=$1)
       WHERE id=$1`,
      [job.torka_id]
    );

    res.status(201).json(review.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserReviews = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.first_name as reviewer_first, u.last_name as reviewer_last
       FROM reviews r JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewee_id=$1 ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const pool = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    const [
      jobStats,
      userStats,
      revenueStats,
      recentJobs,
      recentUsers,
    ] = await Promise.all([
      // Job counts by status
      pool.query(`
        SELECT status, COUNT(*) as count
        FROM jobs
        GROUP BY status
      `),
      // User counts by role
      pool.query(`
        SELECT role, COUNT(*) as count
        FROM users
        GROUP BY role
      `),
      // Revenue: total paid + platform fees
      pool.query(`
        SELECT
          COALESCE(SUM(price_amount), 0) AS total_revenue,
          COALESCE(SUM(ROUND(price_amount * 0.15)), 0) AS platform_fees
        FROM jobs
        WHERE payment_status = 'paid'
      `),
      // Recent 10 jobs
      pool.query(`
        SELECT j.id, j.service_type, j.status, j.price_amount, j.payment_status,
               j.created_at, j.location_address,
               tee.first_name || ' ' || tee.last_name AS torkee_name,
               ka.first_name || ' ' || ka.last_name AS torka_name
        FROM jobs j
        JOIN users tee ON j.torkee_id = tee.id
        LEFT JOIN users ka ON j.torka_id = ka.id
        ORDER BY j.created_at DESC
        LIMIT 10
      `),
      // Recent 10 signups
      pool.query(`
        SELECT id, first_name, last_name, email, role, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 10
      `),
    ]);

    const jobs = {};
    jobStats.rows.forEach(r => { jobs[r.status] = parseInt(r.count); });

    const users = {};
    userStats.rows.forEach(r => { users[r.role] = parseInt(r.count); });

    res.json({
      jobs: {
        pending:     jobs.pending     || 0,
        accepted:    jobs.accepted    || 0,
        in_progress: jobs.in_progress || 0,
        completed:   jobs.completed   || 0,
        cancelled:   jobs.cancelled   || 0,
        total: Object.values(jobs).reduce((a, b) => a + b, 0),
      },
      users: {
        torkees: users.torkee || 0,
        torkas:  users.torka  || 0,
        total: (users.torkee || 0) + (users.torka || 0),
      },
      revenue: {
        total:        parseInt(revenueStats.rows[0].total_revenue),
        platform_fees: parseInt(revenueStats.rows[0].platform_fees),
      },
      recent_jobs:  recentJobs.rows,
      recent_users: recentUsers.rows,
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
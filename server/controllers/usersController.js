const pool = require('../config/db');

exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, role, first_name, last_name, phone, avatar_url, bio,
              service_types, is_available, rating_avg, rating_count, stripe_onboarded, created_at
       FROM users WHERE id=$1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  const { first_name, last_name, phone, bio, service_types, is_available } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET
         first_name=COALESCE($1, first_name),
         last_name=COALESCE($2, last_name),
         phone=COALESCE($3, phone),
         bio=COALESCE($4, bio),
         service_types=COALESCE($5, service_types),
         is_available=COALESCE($6, is_available),
         updated_at=NOW()
       WHERE id=$7
       RETURNING id, email, role, first_name, last_name, phone, bio, service_types, is_available`,
      [first_name, last_name, phone, bio, service_types, is_available, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

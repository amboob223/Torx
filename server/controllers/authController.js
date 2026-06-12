const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

exports.register = async (req, res) => {
  const { email, password, role, first_name, last_name, phone, service_types } = req.body;
  if (!email || !password || !role || !first_name || !last_name) {
    return res.status(400).json({ error: 'All fields required' });
  }
  if (!['torka', 'torkee'].includes(role)) {
    return res.status(400).json({ error: 'Role must be torka or torkee' });
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, service_types)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, email, role, first_name, last_name`,
      [email, password_hash, role, first_name, last_name, phone || null, service_types || null]
    );
    const user = result.rows[0];
    res.status(201).json({ token: generateToken(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, role, first_name, last_name FROM users WHERE email=$1',
      [email]
    );
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const { password_hash, ...safeUser } = user;
    res.json({ token: generateToken(safeUser), user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.me = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, role, first_name, last_name, phone, avatar_url, bio,
              service_types, is_available, rating_avg, rating_count,
              stripe_onboarded, created_at
       FROM users WHERE id=$1`,
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

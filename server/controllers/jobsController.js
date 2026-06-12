const pool = require('../config/db');
const Groq = require('groq-sdk');

let groq = null;
const getGroq = () => {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
};

const getIO = () => require('../index').io;

// POST /api/jobs — Torkee creates a job request
const createJob = async (req, res) => {
  const { service_type, description, location_address, latitude, longitude } = req.body;
  const torkee_id = req.user.id;

  if (!service_type || !description || !location_address) {
    return res.status(400).json({ error: 'service_type, description, and location_address are required' });
  }

  try {
    let ai_diagnosis = null;
    try {
      const completion = await getGroq().chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a concise automotive assistant. A customer has described a car issue or service request. 
Summarize it clearly for a mechanic or service provider in 2-3 sentences. 
Focus on: what the problem/service is, any symptoms mentioned, and urgency if implied. 
Be direct and professional.`
          },
          { role: 'user', content: description }
        ],
        max_tokens: 150
      });
      ai_diagnosis = completion.choices[0].message.content;
    } catch (aiError) {
      console.error('Groq error (non-fatal):', aiError.message);
    }

    const result = await pool.query(
      `INSERT INTO jobs 
        (torkee_id, service_type, description, ai_diagnosis, location_address, location_lat, location_lng, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [torkee_id, service_type, description, ai_diagnosis, location_address, latitude || null, longitude || null]
    );

    const job = result.rows[0];

    // Notify all connected Torkas of a new pending job
    getIO().emit('job_created', { job });

    res.status(201).json({ job });
  } catch (err) {
    console.error('createJob error:', err);
    res.status(500).json({ error: 'Failed to create job' });
  }
};

// GET /api/jobs
const getJobs = async (req, res) => {
  const { id, role } = req.user;

  try {
    let result;

    if (role === 'torka') {
      result = await pool.query(
        `SELECT j.*, 
                u.first_name || ' ' || u.last_name AS torkee_name,
                u.phone AS torkee_phone
         FROM jobs j
         JOIN users u ON j.torkee_id = u.id
         WHERE j.status = 'pending'
            OR (j.torka_id = $1 AND j.status IN ('accepted', 'in_progress', 'completed'))
         ORDER BY 
           CASE WHEN j.torka_id = $1 THEN 0 ELSE 1 END,
           j.created_at DESC`,
        [id]
      );
    } else {
      result = await pool.query(
        `SELECT j.*,
                u.first_name || ' ' || u.last_name AS torka_name
         FROM jobs j
         LEFT JOIN users u ON j.torka_id = u.id
         WHERE j.torkee_id = $1
         ORDER BY j.created_at DESC`,
        [id]
      );
    }

    res.json({ jobs: result.rows });
  } catch (err) {
    console.error('getJobs error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

// GET /api/jobs/:id
const getJobById = async (req, res) => {
  const { id: jobId } = req.params;
  const { id: userId, role } = req.user;

  try {
    const result = await pool.query(
      `SELECT j.*,
              tee.first_name || ' ' || tee.last_name AS torkee_name,
              tee.phone AS torkee_phone,
              ka.first_name || ' ' || ka.last_name AS torka_name,
              ka.phone AS torka_phone
       FROM jobs j
       JOIN users tee ON j.torkee_id = tee.id
       LEFT JOIN users ka ON j.torka_id = ka.id
       WHERE j.id = $1`,
      [jobId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });

    const job = result.rows[0];

    if (role === 'torkee' && job.torkee_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ job });
  } catch (err) {
    console.error('getJobById error:', err);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
};

// PATCH /api/jobs/:id/accept
const acceptJob = async (req, res) => {
  const { id: jobId } = req.params;
  const { id: torkaId, role } = req.user;

  if (role !== 'torka') return res.status(403).json({ error: 'Only Torkas can accept jobs' });

  try {
    const result = await pool.query(
      `UPDATE jobs 
       SET status = 'accepted', torka_id = $1
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [torkaId, jobId]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Job not available (already taken or not found)' });
    }

    const job = result.rows[0];

    // Notify the specific job room (Torkee is listening here)
    getIO().to(`job_${jobId}`).emit('job_updated', { job });
    // Notify all Torkas so the job disappears from their feed
    getIO().emit('job_taken', { jobId });

    res.json({ job });
  } catch (err) {
    console.error('acceptJob error:', err);
    res.status(500).json({ error: 'Failed to accept job' });
  }
};

// PATCH /api/jobs/:id/decline
const declineJob = async (req, res) => {
  const { role } = req.user;

  if (role !== 'torka') return res.status(403).json({ error: 'Only Torkas can decline jobs' });

  try {
    res.json({ message: 'Job declined' });
  } catch (err) {
    console.error('declineJob error:', err);
    res.status(500).json({ error: 'Failed to decline job' });
  }
};

// PATCH /api/jobs/:id/complete
const completeJob = async (req, res) => {
  const { id: jobId } = req.params;
  const { id: torkaId, role } = req.user;

  if (role !== 'torka') return res.status(403).json({ error: 'Only Torkas can complete jobs' });

  try {
    const result = await pool.query(
      `UPDATE jobs 
       SET status = 'completed'
       WHERE id = $1 AND torka_id = $2 AND status = 'in_progress'
       RETURNING *`,
      [jobId, torkaId]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Job not found or not yours to complete' });
    }

    const job = result.rows[0];

    // Notify the job room that work is done
    getIO().to(`job_${jobId}`).emit('job_updated', { job });

    res.json({ job });
  } catch (err) {
    console.error('completeJob error:', err);
    res.status(500).json({ error: 'Failed to complete job' });
  }
};

const setPrice = async (req, res) => {
  const { id: jobId } = req.params;
  const { id: torkaId, role } = req.user;
  const { price_amount } = req.body;

  if (role !== 'torka') return res.status(403).json({ error: 'Only Torkas can set prices' });
  if (!price_amount || price_amount < 100) return res.status(400).json({ error: 'Minimum price is $1.00' });

  try {
    const result = await pool.query(
      `UPDATE jobs 
       SET price_amount = $1, updated_at = NOW()
       WHERE id = $2 AND torka_id = $3 AND status = 'accepted'
       RETURNING *`,
      [price_amount, jobId, torkaId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found or not yours' });
    }

    const job = result.rows[0];

    // Notify Torkee that a price has been set
    getIO().to(`job_${jobId}`).emit('job_updated', { job });

    res.json({ job });
  } catch (err) {
    console.error('setPrice error:', err);
    res.status(500).json({ error: 'Failed to set price' });
  }
};

module.exports = { createJob, getJobs, getJobById, acceptJob, declineJob, completeJob, setPrice };
const pool = require('../config/db');

exports.diagnose = async (req, res) => {
  const { job_id, description } = req.body;
  if (!description) return res.status(400).json({ error: 'description required' });

  try {
    // Call Hermes API
    const hermesRes = await fetch(process.env.HERMES_API_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HERMES_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'hermes', // update to your actual Hermes model name
        messages: [
          {
            role: 'system',
            content: `You are an expert automotive diagnostic assistant for Torx, a mobile car service app.
When a customer describes their car problem, provide:
1. Likely diagnosis (1-2 sentences)
2. Urgency level: LOW / MEDIUM / HIGH
3. What the mechanic should bring or check
Keep it concise and professional. Format as JSON: { "diagnosis": "...", "urgency": "...", "mechanic_notes": "..." }`
          },
          { role: 'user', content: description }
        ],
        max_tokens: 300,
      }),
    });

    if (!hermesRes.ok) {
      const errText = await hermesRes.text();
      console.error('Hermes API error:', errText);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const data = await hermesRes.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    let aiResult;
    try {
      aiResult = JSON.parse(rawContent);
    } catch {
      aiResult = { diagnosis: rawContent, urgency: 'UNKNOWN', mechanic_notes: '' };
    }

    const summaryText = JSON.stringify(aiResult);

    // Save to job if job_id provided
    if (job_id) {
      await pool.query(
        'UPDATE jobs SET ai_diagnosis=$1, updated_at=NOW() WHERE id=$2 AND torkee_id=$3',
        [summaryText, job_id, req.user.id]
      );
    }

    res.json({ summary: aiResult });
  } catch (err) {
    console.error('AI diagnose error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

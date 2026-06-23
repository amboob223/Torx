const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../config/db');

const PLATFORM_FEE_PERCENT = 15; // Torx takes 15%

// Torkee initiates payment for a job
exports.createPaymentIntent = async (req, res) => {
  const { job_id } = req.body;
  try {
    // Load job + torka's stripe account in one query
    const jobResult = await pool.query(
      `SELECT j.*, u.stripe_account_id, u.stripe_onboarded
       FROM jobs j
       JOIN users u ON u.id = j.torka_id
       WHERE j.id = $1 AND j.torkee_id = $2`,
      [job_id, req.user.id]
    );
    const job = jobResult.rows[0];

    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (!job.price_amount) return res.status(400).json({ error: 'Price not set yet' });
    if (job.payment_status === 'paid') return res.status(400).json({ error: 'Already paid' });
    if (!job.stripe_account_id || !job.stripe_onboarded) {
      return res.status(400).json({ error: 'Torka has not connected their Stripe account yet' });
    }

    // If a payment intent already exists, return its client secret
    if (job.stripe_payment_intent_id) {
      const existing = await stripe.paymentIntents.retrieve(job.stripe_payment_intent_id);
      if (existing.status === 'requires_payment_method' || existing.status === 'requires_confirmation') {
        return res.json({ client_secret: existing.client_secret });
      }
    }

    const applicationFee = Math.round(job.price_amount * (PLATFORM_FEE_PERCENT / 100));

    const paymentIntent = await stripe.paymentIntents.create({
      amount: job.price_amount,
      currency: 'usd',
      // Route funds to Torka's connected account, Torx keeps the fee
      transfer_data: {
        destination: job.stripe_account_id,
      },
      application_fee_amount: applicationFee,
      metadata: {
        job_id,
        torkee_id: req.user.id,
        torka_stripe_account: job.stripe_account_id,
      },
    });

    await pool.query(
      'UPDATE jobs SET stripe_payment_intent_id=$1, updated_at=NOW() WHERE id=$2',
      [paymentIntent.id, job_id]
    );

    res.json({ client_secret: paymentIntent.client_secret });
  } catch (err) {
    console.error('createPaymentIntent error:', err);
    res.status(500).json({ error: 'Payment error' });
  }
};

// Torka: start Stripe Connect onboarding
exports.createConnectAccount = async (req, res) => {
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    const user = userResult.rows[0];

    let accountId = user.stripe_account_id;

    // Create a new Connect account only if they don't have one
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        metadata: { user_id: req.user.id },
      });
      accountId = account.id;
      await pool.query(
        'UPDATE users SET stripe_account_id=$1 WHERE id=$2',
        [accountId, req.user.id]
      );
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.CLIENT_URL}/dashboard?stripe=refresh`,
      return_url:  `${process.env.CLIENT_URL}/dashboard?stripe=success`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (err) {
    console.error('createConnectAccount error:', err);
    res.status(500).json({ error: 'Could not start Stripe onboarding' });
  }
};

// Check Torka's Connect account status
// Also verifies directly with Stripe if not yet marked onboarded — fixes webhook timing issues
exports.getConnectStatus = async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT stripe_account_id, stripe_onboarded FROM users WHERE id=$1',
      [req.user.id]
    );
    const user = userResult.rows[0];

    // Already fully onboarded — return immediately
    if (user.stripe_onboarded) {
      return res.json({ stripe_account_id: user.stripe_account_id, stripe_onboarded: true });
    }

    // Has an account ID but webhook hasn't fired yet — check Stripe directly
    if (user.stripe_account_id) {
      const account = await stripe.accounts.retrieve(user.stripe_account_id);
      if (account.details_submitted) {
        // Persist it so future calls don't need to hit Stripe
        await pool.query(
          'UPDATE users SET stripe_onboarded=true WHERE id=$1',
          [req.user.id]
        );
        return res.json({ stripe_account_id: user.stripe_account_id, stripe_onboarded: true });
      }
    }

    // Not onboarded yet
    res.json({ stripe_account_id: user.stripe_account_id, stripe_onboarded: false });
  } catch (err) {
    console.error('getConnectStatus error:', err);
    res.status(500).json({ error: 'Could not fetch connect status' });
  }
};

// Stripe webhook — must use raw body (see server.js)
exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send('Webhook signature invalid');
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    await pool.query(
      `UPDATE jobs
       SET payment_status='paid', status='in_progress', updated_at=NOW()
       WHERE stripe_payment_intent_id=$1`,
      [pi.id]
    );
    console.log(`✅ Payment succeeded for intent ${pi.id}`);
  }

  if (event.type === 'account.updated') {
    const account = event.data.object;
    if (account.details_submitted) {
      await pool.query(
        'UPDATE users SET stripe_onboarded=true WHERE stripe_account_id=$1',
        [account.id]
      );
      console.log(`✅ Torka onboarded: ${account.id}`);
    }
  }

  res.json({ received: true });
};
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import api from '../utils/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const STATUS_LABELS = {
  pending:     { label: 'Waiting for Torka',  color: 'bg-yellow-100 text-yellow-700' },
  accepted:    { label: 'Torka On The Way',   color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress',         color: 'bg-purple-100 text-purple-700' },
  completed:   { label: 'Completed',           color: 'bg-green-100 text-green-700' },
  cancelled:   { label: 'Cancelled',           color: 'bg-red-100 text-red-700' },
};

const SERVICE_ICONS = { mechanic: '🔧', gasser: '⛽', washer: '🚿' };

function CheckoutForm({ jobId, amount }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setError('');
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/jobs/${jobId}?paid=true` },
    });
    if (stripeError) {
      setError(stripeError.message);
      setPaying(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        onClick={handlePay}
        disabled={paying || !stripe}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-sm"
      >
        {paying ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
      </button>
    </div>
  );
}

function ReviewForm({ jobId, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!rating) return setError('Please select a rating');
    setSubmitting(true);
    setError('');
    try {
      await api.post('/api/reviews', { job_id: jobId, rating, comment });
      onSubmitted();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Leave a Review</p>

      {/* Star selector */}
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl transition"
          >
            <span className={(hovered || rating) >= star ? 'text-yellow-400' : 'text-gray-200'}>★</span>
          </button>
        ))}
      </div>

      <textarea
        placeholder="How did it go? (optional)"
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={3}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-orange-400 transition mb-3"
      />

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting || !rating}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-sm"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justPaid = searchParams.get('paid') === 'true';

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const [priceInput, setPriceInput] = useState('');
  const [settingPrice, setSettingPrice] = useState(false);

  const [clientSecret, setClientSecret] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);

  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const fetchJob = () => {
    api.get(`/api/jobs/${id}`)
      .then(r => setJob(r.data.job))
      .catch(err => setError(err.response?.data?.error || 'Failed to load job'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJob(); }, [id]);

  useEffect(() => {
    if (user?.role === 'torkee' && job?.price_amount && job?.payment_status === 'unpaid' && !clientSecret && !justPaid) {
      setLoadingPayment(true);
      api.post('/api/payments/intent', { job_id: id })
        .then(r => setClientSecret(r.data.client_secret))
        .catch(err => setError(err.response?.data?.error || 'Could not load payment'))
        .finally(() => setLoadingPayment(false));
    }
  }, [job]);

  const handleAction = async (action) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await api.patch(`/api/jobs/${id}/${action}`);
      if (action === 'decline') {
        navigate('/dashboard');
      } else {
        setJob(res.data.job);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetPrice = async () => {
    const amount = Math.round(parseFloat(priceInput) * 100);
    if (!amount || amount < 100) return setError('Minimum price is $1.00');
    setSettingPrice(true);
    setError('');
    try {
      const res = await api.patch(`/api/jobs/${id}/price`, { price_amount: amount });
      setJob(res.data.job);
      setPriceInput('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set price');
    } finally {
      setSettingPrice(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <p className="text-center text-gray-400 mt-20">Loading job...</p>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <p className="text-center text-red-500 mt-20">{error || 'Job not found'}</p>
    </div>
  );

  const status = STATUS_LABELS[job.status] || { label: job.status, color: 'bg-gray-100 text-gray-600' };
  const canReview = user?.role === 'torkee' && job.status === 'completed' && job.torka_id && !reviewSubmitted;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4">

        <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600">← Back</button>

        {/* Payment confirmation banner */}
        {justPaid && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-green-700">✅ Payment received! Your Torka is on the way.</p>
            <p className="text-xs text-green-600 mt-1">Your job status will update shortly.</p>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-3xl">{SERVICE_ICONS[job.service_type]}</span>
              <h1 className="text-xl font-bold text-gray-800 mt-1 capitalize">{job.service_type} Service</h1>
              <p className="text-xs text-gray-400 mt-0.5">{new Date(job.created_at).toLocaleDateString()}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">📍 {job.location_address}</p>
          {job.price_amount && (
            <p className="text-sm font-semibold text-gray-800 mt-2">
              💰 ${(job.price_amount / 100).toFixed(2)}
              <span className={`ml-2 text-xs font-medium ${job.payment_status === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>
                {job.payment_status === 'paid' ? '✓ Paid' : 'Awaiting payment'}
              </span>
            </p>
          )}
        </div>

        {/* AI Diagnosis */}
        {job.ai_diagnosis && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
            <p className="text-xs font-semibold text-orange-500 mb-1">✨ AI Summary</p>
            <p className="text-sm text-orange-900 leading-relaxed">{job.ai_diagnosis}</p>
          </div>
        )}

        {/* Description */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer Description</p>
          <p className="text-sm text-gray-700 leading-relaxed">{job.description}</p>
        </div>

        {/* Assigned Torka */}
        {job.torka_name && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Your Torka</p>
            <p className="text-sm font-semibold text-gray-800">{job.torka_name}</p>
            {job.torka_phone && <p className="text-sm text-gray-500">{job.torka_phone}</p>}
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Torka: accept / decline */}
        {user?.role === 'torka' && job.status === 'pending' && (
          <div className="flex gap-3">
            <button
              onClick={() => handleAction('decline')}
              disabled={actionLoading}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition text-sm"
            >
              Decline
            </button>
            <button
              onClick={() => handleAction('accept')}
              disabled={actionLoading}
              className="flex-grow bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition text-sm"
            >
              {actionLoading ? 'Accepting...' : '✅ Accept Job'}
            </button>
          </div>
        )}

        {/* Torka: set price */}
        {user?.role === 'torka' && job.status === 'accepted' && !job.price_amount && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Set Job Price</p>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={priceInput}
                  onChange={e => setPriceInput(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition"
                />
              </div>
              <button
                onClick={handleSetPrice}
                disabled={settingPrice || !priceInput}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold px-5 rounded-xl transition text-sm"
              >
                {settingPrice ? 'Saving...' : 'Set Price'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Torx takes 15% — you receive 85%</p>
          </div>
        )}

        {/* Torkee: pay */}
        {user?.role === 'torkee' && job.price_amount && job.payment_status === 'unpaid' && !justPaid && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Payment Required — ${(job.price_amount / 100).toFixed(2)}
            </p>
            {loadingPayment && <p className="text-sm text-gray-400">Loading payment form...</p>}
            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm jobId={id} amount={job.price_amount} />
              </Elements>
            )}
          </div>
        )}

        {/* Torka: mark complete (only after payment) */}
        {user?.role === 'torka' && job.status === 'in_progress' && job.payment_status === 'paid' && (
          <button
            onClick={() => handleAction('complete')}
            disabled={actionLoading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition text-sm"
          >
            {actionLoading ? 'Completing...' : '🏁 Mark as Complete'}
          </button>
        )}

        {/* Torkee: review form */}
        {canReview && (
          <ReviewForm jobId={id} onSubmitted={() => setReviewSubmitted(true)} />
        )}

        {/* Review submitted confirmation */}
        {reviewSubmitted && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-green-700">⭐ Review submitted — thanks!</p>
          </div>
        )}

      </div>
    </div>
  );
}
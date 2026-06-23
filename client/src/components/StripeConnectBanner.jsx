import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';

export default function StripeConnectBanner() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchStatus = () =>
    api.get('/api/payments/connect/status')
      .then(r => setStatus(r.data))
      .catch(() => setStatus({ stripe_onboarded: false }));

  useEffect(() => {
    const stripeParam = searchParams.get('stripe');

    if (stripeParam === 'success' || stripeParam === 'refresh') {
      // Stripe just redirected back — check status (this triggers the DB write in the controller)
      fetchStatus().then(() => {
        // Clean the URL param so it doesn't linger
        searchParams.delete('stripe');
        setSearchParams(searchParams, { replace: true });
      });
    } else {
      fetchStatus();
    }
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/payments/connect');
      window.location.href = res.data.url;
    } catch (err) {
      alert(err.response?.data?.error || 'Could not start Stripe setup');
      setLoading(false);
    }
  };

  if (status === null) return null;
  if (status.stripe_onboarded) return (
    <div className="bg-green-950/40 border border-green-900/60 rounded-2xl p-4 mb-4">
      <p className="text-sm font-semibold text-green-400">✅ Stripe connected — you're set up to receive payments</p>
    </div>
  );

  return (
    <div className="bg-blue-950/40 border border-blue-900/60 rounded-2xl p-5 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-300">💳 Set up payouts to get paid</p>
          <p className="text-xs text-blue-400/80 mt-1">
            Connect your Stripe account so Torx can send you your earnings after each job.
            Torx keeps 15% — you receive 85%.
          </p>
        </div>
        <button
          onClick={handleConnect}
          disabled={loading}
          className="shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
        >
          {loading ? 'Loading...' : 'Connect Stripe'}
        </button>
      </div>
    </div>
  );
}
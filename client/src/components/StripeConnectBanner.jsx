import { useEffect, useState } from 'react';
import api from '../utils/api';

export default function StripeConnectBanner() {
  const [status, setStatus] = useState(null); // null = loading
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/payments/connect/status')
      .then(r => setStatus(r.data))
      .catch(() => setStatus({ stripe_onboarded: false }));
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/payments/connect');
      window.location.href = res.data.url; // Redirect to Stripe onboarding
    } catch (err) {
      alert(err.response?.data?.error || 'Could not start Stripe setup');
      setLoading(false);
    }
  };

  if (status === null) return null; // still loading
  if (status.stripe_onboarded) return null; // all good, hide banner

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-orange-700">💳 Set up payouts to get paid</p>
          <p className="text-xs text-orange-600 mt-1">
            Connect your Stripe account so Torx can send you your earnings after each job.
            Torx keeps 15% — you receive 85%.
          </p>
        </div>
        <button
          onClick={handleConnect}
          disabled={loading}
          className="shrink-0 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
        >
          {loading ? 'Loading...' : 'Connect Stripe'}
        </button>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SERVICE_TYPES = [
  { value: 'mechanic', label: '🔧 Mechanic', desc: 'Repairs, diagnostics, maintenance' },
  { value: 'gas', label: '⛽ Gas Delivery', desc: 'Fuel delivered to your location' },
  { value: 'wash', label: '🚗 Car Wash', desc: 'Wash & detail at your location' },
];

export default function RequestJobPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    service_type: '',
    description: '',
    location_address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.service_type) return setError('Please select a service type.');
    if (!form.description.trim()) return setError('Please describe what you need.');
    if (!form.location_address.trim()) return setError('Please enter your location.');

    setLoading(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit job');

      navigate(`/jobs/${data.job.id}`, { state: { justCreated: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Request a Service</h1>
        <p className="text-gray-500 text-sm mb-6">Tell us what you need — our AI will summarize it for your Torka.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Service Type</label>
            <div className="grid grid-cols-3 gap-3">
              {SERVICE_TYPES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm({ ...form, service_type: s.value })}
                  className={`border-2 rounded-xl p-3 text-center transition-all ${
                    form.service_type === s.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{s.label.split(' ')[0]}</div>
                  <div className="text-xs font-semibold text-gray-700">{s.label.split(' ').slice(1).join(' ')}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Describe your issue or request
            </label>
            <textarea
              rows={4}
              placeholder={
                form.service_type === 'mechanic'
                  ? "e.g. My car is making a grinding noise when I brake, especially at low speeds. It started 3 days ago..."
                  : form.service_type === 'gas'
                  ? "e.g. I'm out of gas on regular unleaded, I need about half a tank..."
                  : "e.g. Full exterior wash and interior vacuum please, SUV size..."
              }
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">✨ Our AI will summarize this for your Torka</p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Your Location</label>
            <input
              type="text"
              placeholder="e.g. 123 Main St, Las Vegas, NV"
              value={form.location_address}
              onChange={(e) => setForm({ ...form, location_address: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? '⏳ Submitting & generating AI summary...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
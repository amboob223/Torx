import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../utils/api';

export default function NewJobPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    service_type: '',
    location_address: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.service_type || !form.location_address || !form.description) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/jobs', form);
      navigate(`/jobs/${res.data.job.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">← Back</button>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">New request</h1>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">

          {/* Service Type */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Service type</label>
            <div className="grid grid-cols-3 gap-2">
              {['mechanic', 'gasser', 'washer'].map(type => (
                <button key={type} type="button"
                  onClick={() => setForm({ ...form, service_type: type })}
                  className={`py-3 rounded-xl text-sm font-semibold capitalize border transition ${
                    form.service_type === type
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                  }`}>
                  {type === 'mechanic' ? '🔧' : type === 'gasser' ? '⛽' : '🚿'} {type}
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Your location</label>
            <input
              name="location_address"
              value={form.location_address}
              onChange={handleChange}
              placeholder="123 Main St, Las Vegas, NV"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Describe the issue</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="My car won't start, there's a clicking sound when I turn the key..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
            {loading ? 'Submitting...' : 'Submit request'}
          </button>
        </div>
      </div>
    </div>
  );
}

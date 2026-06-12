import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SERVICE_OPTIONS = ['mechanic', 'gasser', 'washer'];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]     = useState(1); // step 1: role, step 2: details
  const [role, setRole]     = useState('');
  const [form, setForm]     = useState({ first_name:'', last_name:'', email:'', password:'', phone:'' });
  const [services, setServices] = useState([]);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const toggleService = (s) =>
    setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form, role, service_types: role === 'torka' ? services : undefined };
      const user = await register(payload);
      navigate(user.role === 'torka' ? '/torka/dashboard' : '/torkee/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500">Torx</h1>
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>

        {/* Step 1: Role selection */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">I am a...</h2>
            <p className="text-gray-400 text-sm mb-6">Choose your role on Torx</p>
            <div className="space-y-3">
              {[
                { id: 'torkee', label: 'Torkee', desc: 'I need car services (gas, wash, mechanic)' },
                { id: 'torka',  label: 'Torka',  desc: 'I provide car services and want to earn' },
              ].map(r => (
                <button key={r.id} onClick={() => { setRole(r.id); setStep(2); }}
                  className="w-full text-left border-2 border-gray-200 hover:border-orange-400 rounded-xl p-4 transition">
                  <div className="font-semibold text-gray-800">{r.label}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mt-6">
              Have an account? <Link to="/login" className="text-orange-500 font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button type="button" onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
              <span className="text-sm font-medium text-orange-500 capitalize">{role}</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Your details</h2>
            {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              {['first_name','last_name'].map(f => (
                <input key={f} required placeholder={f === 'first_name' ? 'First name' : 'Last name'}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                  value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
              ))}
            </div>
            {['email','password','phone'].map(f => (
              <input key={f} type={f === 'password' ? 'password' : f === 'email' ? 'email' : 'tel'}
                required={f !== 'phone'} placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
            ))}
            {role === 'torka' && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Services you offer</p>
                <div className="flex gap-2 flex-wrap">
                  {SERVICE_OPTIONS.map(s => (
                    <button key={s} type="button" onClick={() => toggleService(s)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                        services.includes(s)
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'border-gray-200 text-gray-600 hover:border-orange-400'
                      }`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

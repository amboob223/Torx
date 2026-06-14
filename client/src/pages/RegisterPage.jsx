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
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-500">Torx</h1>
          <p className="text-neutral-400 mt-1">Create your account</p>
        </div>

        {/* Step 1: Role selection */}
        {step === 1 && (
          <div className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 p-8">
            <h2 className="text-xl font-semibold text-neutral-100 mb-2">I am a...</h2>
            <p className="text-neutral-400 text-sm mb-6">Choose your role on Torx</p>
            <div className="space-y-3">
              {[
                { id: 'torkee', label: 'Torkee', desc: 'I need car services (gas, wash, mechanic)' },
                { id: 'torka',  label: 'Torka',  desc: 'I provide car services and want to earn' },
              ].map(r => (
                <button key={r.id} onClick={() => { setRole(r.id); setStep(2); }}
                  className="w-full text-left border-2 border-neutral-800 hover:border-blue-500 rounded-xl p-4 transition">
                  <div className="font-semibold text-neutral-100">{r.label}</div>
                  <div className="text-sm text-neutral-400 mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-neutral-400 mt-6">
              Have an account? <Link to="/login" className="text-blue-400 font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 p-8 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button type="button" onClick={() => setStep(1)} className="text-neutral-500 hover:text-neutral-300 text-sm">← Back</button>
              <span className="text-sm font-medium text-blue-400 capitalize">{role}</span>
            </div>
            <h2 className="text-xl font-semibold text-neutral-100">Your details</h2>
            {error && <div className="bg-red-950 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              {['first_name','last_name'].map(f => (
                <input key={f} required placeholder={f === 'first_name' ? 'First name' : 'Last name'}
                  className="px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
              ))}
            </div>
            {['email','password','phone'].map(f => (
              <input key={f} type={f === 'password' ? 'password' : f === 'email' ? 'email' : 'tel'}
                required={f !== 'phone'} placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
            ))}
            {role === 'torka' && (
              <div>
                <p className="text-sm font-medium text-neutral-300 mb-2">Services you offer</p>
                <div className="flex gap-2 flex-wrap">
                  {SERVICE_OPTIONS.map(s => (
                    <button key={s} type="button" onClick={() => toggleService(s)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                        services.includes(s)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-neutral-700 text-neutral-300 hover:border-blue-500'
                      }`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
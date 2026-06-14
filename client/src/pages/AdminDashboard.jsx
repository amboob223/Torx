import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../utils/api';

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;

const STATUS_COLOR = {
  pending:     'bg-yellow-900/40 text-yellow-400',
  accepted:    'bg-blue-900/40 text-blue-400',
  in_progress: 'bg-purple-900/40 text-purple-400',
  completed:   'bg-green-900/40 text-green-400',
  cancelled:   'bg-neutral-800 text-neutral-400',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/admin/stats', {
      headers: { 'x-admin-secret': ADMIN_SECRET }
    })
      .then(r => setStats(r.data))
      .catch(() => setError('Unauthorized or failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-neutral-950"><Navbar />
      <p className="text-center text-neutral-500 mt-20">Loading admin data...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-neutral-950"><Navbar />
      <p className="text-center text-red-400 mt-20">{error}</p>
    </div>
  );

  const { jobs, users, revenue, recent_jobs, recent_users } = stats;

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        <h1 className="text-2xl font-bold text-neutral-100">Admin Dashboard</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Jobs" value={jobs.total} icon="📋" />
          <StatCard label="Total Users" value={users.total} icon="👥" />
          <StatCard label="Total Revenue" value={`$${(revenue.total / 100).toFixed(2)}`} icon="💰" />
          <StatCard label="Platform Fees" value={`$${(revenue.platform_fees / 100).toFixed(2)}`} icon="🏦" />
        </div>

        {/* Job breakdown */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4">Jobs by Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['pending', 'accepted', 'in_progress', 'completed', 'cancelled'].map(status => (
              <div key={status} className="text-center">
                <p className="text-2xl font-bold text-neutral-100">{jobs[status]}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[status]}`}>
                  {status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* User breakdown */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4">Users</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-neutral-100">{users.torkees}</p>
              <p className="text-sm text-neutral-500 mt-1">Torkees</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-neutral-100">{users.torkas}</p>
              <p className="text-sm text-neutral-500 mt-1">Torkas</p>
            </div>
          </div>
        </div>

        {/* Recent jobs */}
        <div>
          <h2 className="text-lg font-bold text-neutral-100 mb-3">Recent Jobs</h2>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-900 text-xs text-neutral-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Torkee</th>
                  <th className="px-4 py-3 text-left">Torka</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {recent_jobs.map(job => (
                  <tr
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="hover:bg-neutral-800 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 capitalize font-medium text-neutral-200">{job.service_type}</td>
                    <td className="px-4 py-3 text-neutral-400">{job.torkee_name}</td>
                    <td className="px-4 py-3 text-neutral-400">{job.torka_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[job.status]}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-200">
                      {job.price_amount ? `$${(job.price_amount / 100).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent users */}
        <div>
          <h2 className="text-lg font-bold text-neutral-100 mb-3">Recent Signups</h2>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-900 text-xs text-neutral-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {recent_users.map(user => (
                  <tr key={user.id} className="hover:bg-neutral-800 transition">
                    <td className="px-4 py-3 font-medium text-neutral-200">{user.first_name} {user.last_name}</td>
                    <td className="px-4 py-3 text-neutral-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.role === 'torka' ? 'bg-blue-900/40 text-blue-400' : 'bg-purple-900/40 text-purple-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5 text-center">
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-2xl font-bold text-neutral-100">{value}</p>
      <p className="text-xs text-neutral-500 mt-1">{label}</p>
    </div>
  );
}
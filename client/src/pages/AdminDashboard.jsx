import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../utils/api';

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;

const STATUS_COLOR = {
  pending:     'bg-yellow-100 text-yellow-700',
  accepted:    'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-gray-100 text-gray-500',
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
    <div className="min-h-screen bg-gray-50"><Navbar />
      <p className="text-center text-gray-400 mt-20">Loading admin data...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <p className="text-center text-red-500 mt-20">{error}</p>
    </div>
  );

  const { jobs, users, revenue, recent_jobs, recent_users } = stats;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Jobs" value={jobs.total} icon="📋" />
          <StatCard label="Total Users" value={users.total} icon="👥" />
          <StatCard label="Total Revenue" value={`$${(revenue.total / 100).toFixed(2)}`} icon="💰" />
          <StatCard label="Platform Fees" value={`$${(revenue.platform_fees / 100).toFixed(2)}`} icon="🏦" />
        </div>

        {/* Job breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Jobs by Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['pending', 'accepted', 'in_progress', 'completed', 'cancelled'].map(status => (
              <div key={status} className="text-center">
                <p className="text-2xl font-bold text-gray-800">{jobs[status]}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[status]}`}>
                  {status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* User breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Users</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-800">{users.torkees}</p>
              <p className="text-sm text-gray-400 mt-1">Torkees</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-800">{users.torkas}</p>
              <p className="text-sm text-gray-400 mt-1">Torkas</p>
            </div>
          </div>
        </div>

        {/* Recent jobs */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">Recent Jobs</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Torkee</th>
                  <th className="px-4 py-3 text-left">Torka</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent_jobs.map(job => (
                  <tr
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 capitalize font-medium text-gray-700">{job.service_type}</td>
                    <td className="px-4 py-3 text-gray-500">{job.torkee_name}</td>
                    <td className="px-4 py-3 text-gray-500">{job.torka_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[job.status]}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {job.price_amount ? `$${(job.price_amount / 100).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
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
          <h2 className="text-lg font-bold text-gray-800 mb-3">Recent Signups</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent_users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-700">{user.first_name} {user.last_name}</td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.role === 'torka' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
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
    <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}
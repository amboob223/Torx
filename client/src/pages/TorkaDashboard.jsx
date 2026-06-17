import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../utils/api';
import socket from '../utils/socket';
import StripeConnectBanner from '../components/StripeConnectBanner';

const SERVICE_ICONS = { mechanic: '🔧', gasser: '⛽', washer: '🚿' };

const STATUS_LABELS = {
  accepted:    { label: 'Accepted', color: 'bg-blue-900/40 text-blue-400' },
  in_progress: { label: 'Paid ✓',   color: 'bg-green-900/40 text-green-400' },
  completed:   { label: 'Completed', color: 'bg-green-900/40 text-green-400' },
};

export default function TorkaDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = () => {
    api.get('/api/jobs')
      .then(r => setJobs(r.data.jobs))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();

    socket.connect();

    socket.on('job_created', ({ job }) => {
      setJobs(prev => [job, ...prev]);
    });

    socket.on('job_taken', ({ jobId }) => {
      setJobs(prev => prev.filter(j => j.id !== jobId || ['accepted', 'in_progress', 'completed'].includes(j.status)));
    });

    socket.on('job_updated', ({ job }) => {
      setJobs(prev => prev.map(j => j.id === job.id ? job : j));
    });

    return () => {
      socket.off('job_created');
      socket.off('job_taken');
      socket.off('job_updated');
      socket.disconnect();
    };
  }, []);

  const myJobs = jobs.filter(j => ['accepted', 'in_progress', 'completed'].includes(j.status));
  const pendingJobs = jobs.filter(j => j.status === 'pending');

  const JobCard = ({ job, showStatus = false }) => (
    <div
      onClick={() => navigate(`/jobs/${job.id}`)}
      className="block bg-neutral-900 rounded-2xl border border-neutral-800 p-5 hover:border-blue-500/50 transition cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{SERVICE_ICONS[job.service_type]}</span>
          <div>
            <span className="font-semibold text-neutral-100 capitalize">{job.service_type}</span>
            <p className="text-xs text-neutral-500">
              {job.torkee_name} · {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        {showStatus && STATUS_LABELS[job.status] ? (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_LABELS[job.status].color}`}>
            {STATUS_LABELS[job.status].label}
          </span>
        ) : (
          <span className="text-xs bg-yellow-900/40 text-yellow-400 font-semibold px-2 py-0.5 rounded-full">
            Pending
          </span>
        )}
      </div>

      {job.price_amount && (
        <p className="text-sm font-semibold text-neutral-200 mb-1">
          💰 ${(job.price_amount / 100).toFixed(2)}
          {job.payment_status === 'paid' && (
            <span className="ml-2 text-xs text-green-400 font-medium">✓ Paid</span>
          )}
        </p>
      )}

      {job.ai_diagnosis && (
        <div className="bg-blue-950/40 rounded-xl px-3 py-2 mb-2">
          <p className="text-xs text-blue-400 font-semibold mb-0.5">✨ AI Summary</p>
          <p className="text-xs text-blue-200 line-clamp-2">{job.ai_diagnosis}</p>
        </div>
      )}

      <p className="text-xs text-neutral-500">📍 {job.location_address}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        <StripeConnectBanner />

        {myJobs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-neutral-100 mb-3">My Jobs</h2>
            <div className="space-y-3">
              {myJobs.map(job => <JobCard key={job.id} job={job} showStatus={true} />)}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-neutral-100">Available Jobs</h2>
          <button onClick={fetchJobs} className="text-sm text-blue-400 hover:text-blue-300 font-medium">
            ↻ Refresh
          </button>
        </div>

        {loading && <p className="text-neutral-500 text-sm">Loading...</p>}

        {!loading && pendingJobs.length === 0 && (
          <div className="text-center py-16 text-neutral-500">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-lg mb-1">No pending jobs right now</p>
            <p className="text-sm">Check back soon — new requests come in fast</p>
          </div>
        )}

        <div className="space-y-3">
          {pendingJobs.map(job => <JobCard key={job.id} job={job} />)}
        </div>

      </div>
    </div>
  );
}
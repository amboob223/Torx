import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../utils/api';
import socket from '../utils/socket';

const STATUS_COLOR = {
  pending:     'bg-yellow-100 text-yellow-700',
  accepted:    'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-gray-100 text-gray-500',
};

export default function TorkeeDashboard() {
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const joinedRooms = useRef(new Set());

  useEffect(() => {
    api.get('/api/jobs')
      .then(r => {
        const fetchedJobs = r.data.jobs;
        setJobs(fetchedJobs);

        socket.connect();

        const joinRooms = () => {
          fetchedJobs.forEach(job => {
            if (!joinedRooms.current.has(job.id)) {
              socket.emit('join_job', job.id);
              joinedRooms.current.add(job.id);
            }
          });
        };

        if (socket.connected) {
          joinRooms();
        } else {
          socket.once('connect', joinRooms);
        }
      })
      .finally(() => setLoading(false));

    socket.on('job_updated', ({ job }) => {
      setJobs(prev => prev.map(j => j.id === job.id ? job : j));
    });

    return () => {
      socket.off('job_updated');
      socket.disconnect();
      joinedRooms.current.clear();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My requests</h1>
          <Link to="/torkee/new-job"
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
            + New request
          </Link>
        </div>

        {loading && <p className="text-gray-400 text-sm">Loading...</p>}

        {!loading && jobs.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">No requests yet</p>
            <p className="text-sm">Tap "New request" to get started</p>
          </div>
        )}

        <div className="space-y-3">
          {jobs.map(job => (
            <Link key={job.id} to={`/jobs/${job.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-orange-200 transition">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800 capitalize">{job.service_type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[job.status]}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">{job.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{job.location_address}</p>
                </div>
                {job.price_amount && (
                  <span className="text-sm font-semibold text-gray-700">
                    ${(job.price_amount / 100).toFixed(2)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
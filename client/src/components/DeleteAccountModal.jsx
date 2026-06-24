import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function DeleteAccountModal({ onClose }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete('/api/auth/account');
      localStorage.removeItem('token');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete account');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full">
        <h2 className="text-lg font-bold text-neutral-100 mb-2">Delete account</h2>

        {!confirming ? (
          <>
            <p className="text-sm text-neutral-400 mb-6">
              This will permanently delete your account and all your data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-semibold py-2.5 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-xl transition"
              >
                Delete account
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-red-400 font-semibold mb-1">Are you absolutely sure?</p>
            <p className="text-sm text-neutral-400 mb-6">
              Type <span className="text-neutral-200 font-mono">DELETE</span> to confirm.
            </p>
            <ConfirmInput onConfirmed={handleDelete} loading={loading} onCancel={onClose} />
          </>
        )}
      </div>
    </div>
  );
}

function ConfirmInput({ onConfirmed, loading, onCancel }) {
  const [value, setValue] = useState('');
  return (
    <>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Type DELETE"
        className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 mb-4 focus:outline-none focus:border-red-500"
      />
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-semibold py-2.5 rounded-xl transition"
        >
          Cancel
        </button>
        <button
          onClick={onConfirmed}
          disabled={value !== 'DELETE' || loading}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition"
        >
          {loading ? 'Deleting...' : 'Confirm delete'}
        </button>
      </div>
    </>
  );
}
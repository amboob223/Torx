import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import DeleteAccountModal from '../components/DeleteAccountModal';

export default function SettingsPage() {
  const { user } = useAuth();
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4">

        <h1 className="text-2xl font-bold text-neutral-100">Settings</h1>

        {/* Account info */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">Account</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-950/50 flex items-center justify-center text-blue-400 font-bold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div>
              <p className="text-neutral-100 font-semibold">{user?.first_name} {user?.last_name}</p>
              <p className="text-sm text-neutral-500">{user?.email}</p>
              <p className="text-xs text-neutral-600 capitalize mt-0.5">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-neutral-900 rounded-2xl border border-red-900/40 p-6">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-1">Danger zone</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <button
            onClick={() => setShowDelete(true)}
            className="bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            Delete my account
          </button>
        </div>

      </div>

      {showDelete && <DeleteAccountModal onClose={() => setShowDelete(false)} />}
    </div>
  );
}
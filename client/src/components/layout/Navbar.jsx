import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-neutral-950 border-b border-neutral-800 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 text-2xl font-bold text-blue-500">
          <img src="/favicon.svg" alt="" className="w-7 h-7 rounded-lg" />
          Torx
        </Link>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-400 capitalize">{user.role}</span>
            <Link to={`/profile/${user.id}`} className="text-sm font-medium text-neutral-200 hover:text-blue-400">
              {user.first_name}
            </Link>
            <button onClick={logout} className="text-sm text-neutral-500 hover:text-red-500 transition">
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
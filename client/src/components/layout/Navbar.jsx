import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-white border-b border-gray-100 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link to="/dashboard" className="text-2xl font-bold text-orange-500">Torx</Link>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 capitalize">{user.role}</span>
            <Link to={`/profile/${user.id}`} className="text-sm font-medium text-gray-700 hover:text-orange-500">
              {user.first_name}
            </Link>
            <button onClick={logout} className="text-sm text-gray-400 hover:text-red-500 transition">
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

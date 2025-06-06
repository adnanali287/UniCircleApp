import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function MainLayout({ children }) {
  const { signOut } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/home" className="text-2xl font-bold text-primary-500">
              UniCircle
            </Link>
            <button
              onClick={() => signOut()}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <i className="fas fa-sign-out-alt text-xl" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around py-3">
            <Link
              to="/home"
              className={`p-2 rounded-lg ${
                isActive('/home')
                  ? 'text-primary-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <i className="fas fa-home text-xl" />
            </Link>
            <Link
              to="/circles"
              className={`p-2 rounded-lg ${
                isActive('/circles')
                  ? 'text-primary-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <i className="fas fa-users text-xl" />
            </Link>
            <Link
              to="/profile"
              className={`p-2 rounded-lg ${
                isActive('/profile')
                  ? 'text-primary-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <i className="fas fa-user text-xl" />
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
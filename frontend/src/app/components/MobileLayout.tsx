import { Outlet, useLocation, Link } from 'react-router';
import { Home, BookOpen, BarChart3, User, Users, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useAdminMode } from '../contexts/AdminContext';

export function MobileLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const { adminMode, setAdminMode } = useAdminMode();

  // student navigation
  const studentNav = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/exams', icon: BookOpen, label: 'Exams' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  // admin navigation (separate)
  const adminNav = [
    { path: '/admin', icon: BarChart3, label: 'Overview' },
    { path: '/admin/dashboard', icon: Shield, label: 'Areas' },
    { path: '/admin/vouchers', icon: BookOpen, label: 'Vouchers' },
    { path: '/admin/departments', icon: Users, label: 'Departments' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const navItems = user?.role === 'ADMIN' ? (adminMode ? adminNav : studentNav) : studentNav;

  return (
    // page background changed to cyan, secondary deep purple used for nav/sidebar
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-cyan-50">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* admin toggle pill for mobile (visible only to admins) */}
      {user?.role === 'ADMIN' && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-16 z-50 md:hidden">
          <button
            onClick={() => setAdminMode(!adminMode)}
            aria-pressed={adminMode}
            className="px-3 py-1 rounded-full bg-purple-800 text-cyan-50 text-sm shadow-md"
          >
            {adminMode ? 'Admin Mode' : 'Student Mode'}
          </button>
        </div>
      )}

      {/* Bottom Navigation - Mobile (deep purplish secondary) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-purple-900 border-t border-purple-800 md:hidden z-50 safe-area-inset-bottom">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center flex-1 h-full relative"
              >
                <motion.div
                  className="flex flex-col items-center"
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isActive ? 'text-cyan-300' : 'text-white/80'
                    }`}
                  />
                  <span
                    className={`text-[11px] mt-1 ${
                      isActive ? 'text-cyan-200 font-medium' : 'text-white/80'
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.div>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-cyan-300 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar (deep purplish secondary) */}
      <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-purple-900 border-r border-purple-800 text-cyan-50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-cyan-50">Exit Examiner</h1>

            {/* admin toggle for desktop */}
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => setAdminMode(!adminMode)}
                aria-pressed={adminMode}
                className="ml-2 px-2 py-1 rounded bg-purple-800/60 hover:bg-purple-800 text-cyan-50 text-xs"
                title="Toggle admin/student nav"
              >
                {adminMode ? 'Admin' : 'Student'}
              </button>
            )}
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-purple-800/20 text-cyan-300 font-semibold'
                      : 'text-cyan-100 hover:bg-purple-800/10 hover:text-cyan-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-300' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </div>
  );
}


import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { 
  Trophy, BookOpen, Users, Ticket, 
  LayoutDashboard, LogOut, Menu, X, User as UserIcon 
} from 'lucide-react';

   


export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    { label: 'Overview', path: '/', icon: LayoutDashboard, show: true },
    { label: 'Practice Exams', path: '/exams', icon: BookOpen, show: true },
    { label: 'Vouchers', path: '/admin/vouchers', icon: Ticket, show: isAdmin },
    { label: 'Departments', path: '/admin/departments', icon: Users, show: isAdmin },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="fixed inset-y-0 left-0 hidden md:flex w-64 flex-col bg-indigo-950 text-white">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <Trophy className="text-indigo-400" />
            <span className="text-xl font-bold">Exit Examiner</span>
          </div>
          
          <nav className="space-y-2">
            {navItems.filter(item => item.show).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  location.pathname === item.path 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-indigo-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/10">
          <button onClick={logout} className="flex items-center gap-3 text-indigo-300 hover:text-white transition-colors">
            <LogOut size={20} /> <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="md:pl-64 flex flex-col min-h-screen">
        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{user?.full_name}</p>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{user?.role}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700">
               <UserIcon size={20} /> {/* Corrected Lucide usage */}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1">
          <Outlet /> {/* CRITICAL: This is where Dashboard/Vouchers appear */}
        </div>
      </main>
    </div>
  );
}
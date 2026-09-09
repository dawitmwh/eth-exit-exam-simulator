import { Outlet, useLocation, Link } from 'react-router';
import { 
  Home, BookOpen, BarChart3, User, Users, Building2,
  Shield, Upload, LogOut, LayoutGrid, Settings, SchoolIcon,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useAdminMode } from '../contexts/AdminContext';
import { use } from 'react';

export function MobileLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { adminMode, setAdminMode } = useAdminMode();
  const tenantLogo = user?.university_logo



  // Navigation Logic
  const studentNav = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/exams', icon: BookOpen, label: 'Practice' },
    { path: '/analytics', icon: BarChart3, label: 'Progress' },
    { path: '/profile', icon: User, label: 'Account' },
  ];
  // 1. Define the Global Owner Navigation
  const ownerNav = [
  { path: '/owner', icon: BarChart3, label: 'Platform Stats' },
  { path: '/owner/universities', icon: Building2, label: 'Manage Tenants' },
  { path: '/owner/library', icon: BookOpen, label: 'Master Library' }, // Ensure this matches App.tsx
  { path: '/admin/upload', icon: Upload, label: 'Content Factory' },
  { path: '/profile', icon: User, label: 'Account' },
];

  const adminNav = [
    { path: '/admin', icon: LayoutGrid, label: 'Overview' },
    { path: '/exams', icon: BookOpen, label: 'Practice' },
    { path: '/admin/vouchers', icon: Settings, label: 'Vouchers' },
    { path: '/admin/departments', icon: Users, label: 'Faculty' },
    { path: '/admin/upload', icon: Upload, label: 'Import' },
    { path: '/admin/classrooms', icon: SchoolIcon, label: 'Classrooms' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const isAdmin = user?.role === 'ADMIN';

  // The SaaS Owner is usually a Superuser on the root domain
  const isOwner = user?.is_superuser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  let navItems = studentNav;

  if (isOwner) {
      navItems = ownerNav;
  } else if (isAdmin) {
      navItems = adminMode ? adminNav : studentNav;
  }
  console.log("DEBUG: LOGO:", tenantLogo);
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-slate-50">
    
      {/* 1. DESKTOP SIDEBAR (Indigo Theme) */}
      <aside className="hidden md:flex flex-col w-64 bg-primary text-white shadow-2xl z-50">
      {/* Logo Section */}     
        <div className="p-8 pb-10">
          <div className="flex items-center gap-3 group">
            {/* The Logo Container (Canvas) */}
            <div className="p-2 bg-white rounded-2xl shadow-xl shadow-emerald-500/10 shrink-0 flex items-center justify-center w-12 h-12 overflow-hidden transition-transform group-hover:scale-105 duration-300">
              {user?.university_logo ? (
                <img 
                  src={user.university_logo}
                  alt="University Logo" 
                  className="w-full h-full object-contain" 
                  // Error fallback if image fails to load
                  onError={(e) => {
                    e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/8074/8074470.png'; 
                  }}
                />
              ) : (
                <GraduationCap className="text-primary w-6 h-6" strokeWidth={2.5} />
              )}
            </div>

            {/* University Label */}
            <div className="flex flex-col min-w-0 bg-primary px-3 py-2 rounded-xl group-hover:bg-primary transition-colors duration-300">
              <span className="text-sm font-black tracking-tight text-white leading-tight truncate">
                {user?.university_name || 'EXIT EXAMINER'}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                  Official Portal
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                    : 'text-white hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'group-hover:text-white'}`} />
                <span className="font-semibold text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section (Admin Toggle & Profile) */}
        <div className="p-4 border-t border-white/5 space-y-4">
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setAdminMode(!adminMode)}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${
                adminMode 
                ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                : 'border-white/10 text-emerald-300 hover:border-white/20'
              }`}
            >
              <Users size={14} />
              {adminMode ? 'Switch to Student' : 'Switch to Admin'}
            </button>
          )}

          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl">
             <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-black text-emerald-950">
               {user?.full_name?.charAt(0)}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user?.full_name}</p>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter truncate">{user?.department_name || 'Staff'}</p>
             </div>
             <button onClick={logout} className="p-2 hover:text-red-400 transition-colors">
                <LogOut size={18} />
             </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="md:hidden sticky top-0 bg-white/80 backdrop-blur-md border-b p-4 flex items-center justify-between z-40">
           <span className="font-black tracking-tighter text-green-600">EXITPREP</span>
           {user?.role === 'ADMIN' && (
              <button 
                onClick={() => setAdminMode(!adminMode)}
                className="text-[10px] font-black bg-green-600 text-white px-3 py-1 rounded-full uppercase"
              >
                {adminMode ? 'Admin' : 'Student'}
              </button>
           )}
        </header>
        
        <div className="pb-24 md:pb-0">
          <Outlet />
        </div>
      </main>

      {/* 3. MOBILE BOTTOM NAV (Polished Glassmorphism) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-primary backdrop-blur-xl border-t border-slate-100 p-2 z-50">
        <div className="flex justify-around items-center">
          {navItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex-1"
              >
                <div className="flex flex-col items-center justify-center py-2 relative">
                  <motion.div whileTap={{ scale: 0.8 }}>
                    <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-green-600' : 'text-slate-400'}`} />
                  </motion.div>
                  <span className={`text-[10px] font-bold mt-1 uppercase tracking-tighter ${isActive ? 'text-green-600' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="navTab"
                      className="absolute -top-2 w-1 h-1 bg-green-600 rounded-full" 
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}











// import { Outlet, useLocation, Link } from 'react-router';
// import { Home, BookOpen, BarChart3, User, Users, Shield, Upload } from 'lucide-react';
// import { motion } from 'motion/react';
// import { useAuth } from '../contexts/AuthContext';
// import { useAdminMode } from '../contexts/AdminContext';

// export function MobileLayout() {
//   const location = useLocation();
//   const { user } = useAuth();
//   const { adminMode, setAdminMode } = useAdminMode();

//   // student navigation
//   const studentNav = [
//     { path: '/', icon: Home, label: 'Home' },
//     { path: '/exams', icon: BookOpen, label: 'Exams' },
//     { path: '/analytics', icon: BarChart3, label: 'Analytics' },
//     { path: '/profile', icon: User, label: 'Profile' },
//   ];

//   // admin navigation (separate)
//   const adminNav = [
//     { path: '/admin', icon: BarChart3, label: 'Overview' },
//     { path: '/admin/dashboard', icon: Shield, label: 'Areas' },
//     { path: '/admin/vouchers', icon: BookOpen, label: 'Vouchers' },
//     { path: '/admin/departments', icon: Users, label: 'Departments' },
//     { path: '/admin/upload', icon: Upload, label: 'Upload Questions' },
//     { path: '/profile', icon: User, label: 'Profile' },
//   ];

//   const navItems = user?.role === 'ADMIN' ? (adminMode ? adminNav : studentNav) : studentNav;

//   return (
//     // page background changed to cyan, secondary deep purple used for nav/sidebar
//     <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-cyan-50">
//       {/* Main Content */}
//       <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
//         <Outlet />
//       </main>

//       {/* admin toggle pill for mobile (visible only to admins) */}
//       {user?.role === 'ADMIN' && (
//         <div className="fixed left-1/2 -translate-x-1/2 bottom-16 z-50 md:hidden">
//           <button
//             onClick={() => setAdminMode(!adminMode)}
//             aria-pressed={adminMode}
//             className="px-3 py-1 rounded-full bg-purple-800 text-cyan-50 text-sm shadow-md"
//           >
//             {adminMode ? 'Admin Mode' : 'Student Mode'}
//           </button>
//         </div>
//       )}

//       {/* Bottom Navigation - Mobile (deep purplish secondary) */}
//       <nav className="fixed bottom-0 left-0 right-0 bg-purple-900 border-t border-purple-800 md:hidden z-50 safe-area-inset-bottom">
//         <div className="flex justify-around items-center h-16 px-2">
//           {navItems.map((item) => {
//             const isActive = location.pathname === item.path;
//             const Icon = item.icon;
//             return (
//               <Link
//                 key={item.path}
//                 to={item.path}
//                 className="flex flex-col items-center justify-center flex-1 h-full relative"
//               >
//                 <motion.div
//                   className="flex flex-col items-center"
//                   whileTap={{ scale: 0.9 }}
//                 >
//                   <Icon
//                     className={`w-6 h-6 ${
//                       isActive ? 'text-cyan-300' : 'text-white/80'
//                     }`}
//                   />
//                   <span
//                     className={`text-[11px] mt-1 ${
//                       isActive ? 'text-cyan-200 font-medium' : 'text-white/80'
//                     }`}
//                   >
//                     {item.label}
//                   </span>
//                 </motion.div>
//                 {isActive && (
//                   <motion.div
//                     layoutId="activeTab"
//                     className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-cyan-300 rounded-full"
//                     transition={{ type: 'spring', stiffness: 380, damping: 30 }}
//                   />
//                 )}
//               </Link>
//             );
//           })}
//         </div>
//       </nav>

//       {/* Desktop Sidebar (deep purplish secondary) */}
//       <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-purple-900 border-r border-purple-800 text-cyan-50">
//         <div className="p-6">
//           <div className="flex items-center justify-between mb-6">
//             <h1 className="text-2xl font-bold text-cyan-50">Exit Examiner</h1>

//             {/* admin toggle for desktop */}
//             {user?.role === 'ADMIN' && (
//               <button
//                 onClick={() => setAdminMode(!adminMode)}
//                 aria-pressed={adminMode}
//                 className="ml-2 px-2 py-1 rounded bg-purple-800/60 hover:bg-purple-800 text-cyan-50 text-xs"
//                 title="Toggle admin/student nav"
//               >
//                 {adminMode ? 'Admin' : 'Student'}
//               </button>
//             )}
//           </div>

//           <nav className="space-y-2">
//             {navItems.map((item) => {
//               const isActive = location.pathname === item.path;
//               const Icon = item.icon;
//               return (
//                 <Link
//                   key={item.path}
//                   to={item.path}
//                   aria-current={isActive ? 'page' : undefined}
//                   className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
//                     isActive
//                       ? 'bg-purple-800/20 text-cyan-300 font-semibold'
//                       : 'text-cyan-100 hover:bg-purple-800/10 hover:text-cyan-50'
//                   }`}
//                 >
//                   <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-300' : ''}`} />
//                   <span className="font-medium">{item.label}</span>
//                 </Link>
//               );
//             })}
//           </nav>
//         </div>
//       </aside>
//     </div>
//   );
// }


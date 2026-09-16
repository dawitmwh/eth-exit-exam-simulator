/// <reference types="vite/client" />

import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AnimatePresence } from 'motion/react';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { AdminModeProvider } from './contexts/AdminContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import { MobileLayout } from './components/MobileLayout'; // This is your Sidebar Layout

// Pages - Root Domain (Marketing & SaaS Owner)
import { MarketingLandingPage } from './pages/MarketingLandingPage';
import { InstitutionSignup } from './pages/InstitutionSignup';
import { OwnerDashboard } from './pages/admin/OwnerDashboard';

// Pages - Tenant Domain (University Portal)
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import MainAdminDashboard from './pages/admin/MainAdminDashboard';
import { ExamList } from './components/ExamList';
import { ExamSession } from './components/ExamSession';
import { Analytics } from './components/Analytics';
import { Profile } from './components/Profile';
import { AdminVouchers } from './pages/AdminVouchers';
import { AdminQuestionUpload } from './pages/AdminQuestionUpload';
import Departments from './pages/admin/Departments';
import { OwnerTenantManager } from './pages/admin/OwnerTenantManager';
import { TeacherClassrooms } from './pages/TeacherClassrooms';
import {MasterLibrary } from './pages/admin/MasterLibrary';

//APIs
import apiClient from './api/client';

// UI Components
import { SplashScreen } from './components/SplashScreen';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Toaster } from './components/ui/sonner';

// Style 
import '../styles/theme.css'; 
import '../styles/app.css';

export default function App() {
  const [isSplashLoading, setIsSplashLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);

  // 1. Detect Environment
  const isRootDomain = useMemo(() => {
    const hostname = window.location.hostname;
    // return hostname === 'localhost' || hostname === '127.0.0.1';
     return hostname === 'http://ec2-51-20-150-131.eu-north-1.compute.amazonaws.com' || hostname === '127.0.0.1';
  }, []);

  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);
    const timer = setTimeout(() => setIsSplashLoading(false), 1500);
    return () => {
      window.removeEventListener('resize', setVH);
      clearTimeout(timer);
    };
  }, []);
 
  // --- HELPER FUNCTIONS ---

function getBrightness(hex: string): number {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}
const applyBrandColor = (hex: string) => {
  if (!hex) {
    console.error("🛑 Branding Error: No hex code received from API");
    return;
  }
  
  const root = document.documentElement;

  // 1. Convert to RGB numbers
  const rgbValues = hexToRgbString(hex); 
  
  // 2. Inject into the Neural Variable
  root.style.setProperty('--brand-neural-rgb', rgbValues);

  // 3. Handle Foreground
  const brightness = getBrightness(hex);
  const fgColor = brightness > 155 ? '#020617' : '#ffffff';
  root.style.setProperty('--brand-neural-fg', fgColor);
  
  console.log(`🎨 SUCCESS: Applied ${hex} as RGB(${rgbValues}) to the UI.`);
};

useEffect(() => {
  const host = window.location.hostname;
  const isRoot = host === 'localhost' || host === '127.0.0.1';

  console.log("🌐 Current Host:", host);
  console.log("📍 Is Root Domain?", isRoot);

  if (!isRoot) {
    console.log("📡 Fetching University Config...");
    apiClient.get('/core/tenant-config/')
      .then(res => {
        console.log("📥 API Response Data:", res.data);
        const universityColor = res.data.primary_color;
        applyBrandColor(universityColor);
      })
      .catch(err => {
        console.error("❌ API Error:", err.response?.status, err.message);
      });
  }
}, [isRootDomain]);
// Ensure your helper returns space-separated numbers
function hexToRgbString(hex: string): string {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  // MUST return exactly: "12 150 156"
  return `${r} ${g} ${b}`; 
}

  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminModeProvider>
          <div className="min-h-screen bg-background font-sans">
            <Toaster />
            <OfflineIndicator />
            <AnimatePresence mode="wait">
              {isSplashLoading ? (
                <SplashScreen key="splash" />
              ) : (
                <Routes>
                  {/* --- COMMON ROUTES (Available Everywhere) --- */}
                  <Route path="/login" element={<Login />} />

                  {isRootDomain ? (
                    /* --- CASE 1: ROOT DOMAIN (SaaS Sales & Master Admin) --- */
                    <>
                      <Route path="/" element={<MarketingLandingPage />} />
                      <Route path="/signup-institution" element={<InstitutionSignup />} />
                      
                      {/* Master Owner Routes (Wrapped in Sidebar Layout) */}
                      <Route element={<ProtectedRoute><MobileLayout /></ProtectedRoute>}>
                        {/* 2. ALLOW MASTER UPLOADER ON ROOT DOMAIN */}
                        <Route path="/admin/upload" element={<AdminQuestionUpload />} />
                        <Route path="/profile" element={<Profile />} />
                        {/* 3. ALLOW MASTER ADMIN DASHBOARD ON ROOT DOMAIN */}
                        <Route path="/owner/universities" element={<OwnerTenantManager />} />
                        <Route path="/owner" element={<OwnerDashboard />} />
                        <Route path="/owner/library" element={<MasterLibrary />} />
                      </Route>
                      
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </>
                  ) : (
                    /* --- CASE 2: SUBDOMAIN (University Portals) --- */
                    <>
                      <Route path="/register" element={<Register />} />

                      {/* Main Portal Shell (Sidebar + Content) */}
                      <Route element={<ProtectedRoute><MobileLayout /></ProtectedRoute>}>
                        <Route index element={<Dashboard />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="/admin/classrooms" element={<TeacherClassrooms />} />
                        <Route path="exams" element={<ExamList />} />
                        <Route path="analytics" element={<Analytics />} />
                        <Route path="profile" element={<Profile />} />
                        
                        {/* Dean/Teacher Specific Routes */}
                        <Route path="admin/dashboard" element={<MainAdminDashboard />} />
                        <Route path="admin/vouchers" element={<AdminVouchers />} />
                        <Route path="admin/departments" element={<Departments />} />
                        <Route path="admin/upload" element={<AdminQuestionUpload />} />
                      </Route>

                      {/* Full-Screen Exam Mode (No Sidebar) */}
                      <Route path="/exam/:examId" element={<ProtectedRoute><ExamSession /></ProtectedRoute>} />
                      
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </>
                  )}
                </Routes>
              )}
            </AnimatePresence>
          </div>
        </AdminModeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}





// import { useState, useEffect, useMemo } from 'react';
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
// import { AnimatePresence } from 'motion/react';

// // Contexts & Protection
// import { AuthProvider } from './contexts/AuthContext';
// import { ProtectedRoute } from './components/ProtectedRoute';

// // Layouts
// import { DashboardLayout } from './components/DashboardLayout';
// // Pages - Dashboard
 
// // Pages - Marketing
// import { MarketingLandingPage } from './pages/MarketingLandingPage';
// import { InstitutionSignup } from './pages/InstitutionSignup';
// import { AdminDashboard } from './components/AdminDashboard';
// import { OwnerDashboard } from './pages/admin/OwnerDashboard';
// import { ExamList } from './components/ExamList';
// import { ExamSession } from './components/ExamSession';
// import { Analytics } from './components/Analytics';
// import { Profile } from './components/Profile';
// import { AdminVouchers } from './pages/AdminVouchers';
// import { Register } from './pages/Register';
// import { Login } from './pages/Login';

// // UI Components
// import { SplashScreen } from './components/SplashScreen';
// import { OfflineIndicator } from './components/OfflineIndicator';
// import { Toaster } from './components/ui/sonner';
// import { MobileLayout } from './components/MobileLayout';
// import MainAdminDashboard from './pages/admin/MainAdminDashboard';
// import { AdminModeProvider } from './contexts/AdminContext';
// import Departments from './pages/admin/Departments';
// import { AdminQuestionUpload } from './pages/AdminQuestionUpload';

// export default function App() {
//   const [isSplashLoading, setIsSplashLoading] = useState(true);

//   // 1. Detect if we are on Root (localhost) or Subdomain (aau.localhost)
//   const isRootDomain = useMemo(() => {
//     const hostname = window.location.hostname;
//     return hostname === 'localhost' || hostname === '127.0.0.1';
//   }, []);

//   useEffect(() => {
//     // Fix viewport height for mobile browsers
//     const setVH = () => {
//       const vh = window.innerHeight * 0.01;
//       document.documentElement.style.setProperty('--vh', `${vh}px`);
//     };
//     setVH();
//     window.addEventListener('resize', setVH);

//     const timer = setTimeout(() => setIsSplashLoading(false), 1500);
//     return () => {
//       window.removeEventListener('resize', setVH);
//       clearTimeout(timer);
//     };
//   }, []);

//   return (
//     <BrowserRouter>
//       <AuthProvider>
//         <AdminModeProvider>
//         <div className="min-h-screen bg-background">
//           <Toaster />
//           <OfflineIndicator />
//           <AnimatePresence mode="wait">
//             {isSplashLoading ? (
//               <SplashScreen key="splash" />
//             ) : (
//               <Routes key="routes">
                
//                 {/* --- CASE 1: PUBLIC MARKETING SITE --- */}
//                 {isRootDomain ? (
//                   <>
//                     <Route path="/" element={<MarketingLandingPage />} />
//                     <Route path="/signup-institution" element={<InstitutionSignup />} />
//                     <Route path="/owner" element={<ProtectedRoute><OwnerDashboard /></ProtectedRoute>} />
//                     <Route path="*" element={<Navigate to="/" replace />} />
//                   </>
//                 ) : (
                  
//                   /* --- CASE 2: PRIVATE UNIVERSITY PORTAL --- */
//                   <>
//                     {/* Public Portal Pages */}
//                     <Route path="/login" element={<Login />} />
//                     <Route path="/register" element={<Register />} />

//                     {/* All pages inside this block will HAVE the Sidebar (DashboardLayout) */}
//                     <Route element={<ProtectedRoute><MobileLayout /></ProtectedRoute>}>
//                       <Route index element={<AdminDashboard />} />
//                       <Route path="exams" element={<ExamList />} />
//                       <Route path="analytics" element={<Analytics />} />
//                       <Route path="vouchers" element={<AdminVouchers />} />
//                       <Route path="profile" element={<Profile />} />
//                       <Route path="/admin" element={<AdminDashboard />} />
//                       <Route path="/admin/dashboard" element={<MainAdminDashboard />} />
//                       <Route path="/admin/vouchers" element={<AdminVouchers />} />
//                       <Route path="/admin/departments" element={<Departments />} />
//                       <Route path="admin/upload" element={<AdminQuestionUpload />} />
//                     </Route>

//                     {/* Exam Session is usually full-screen (No Sidebar) */}
//                     <Route
//                       path="/exam/:examId"
//                       element={
//                         <ProtectedRoute>
//                           <ExamSession />
//                         </ProtectedRoute>
//                       }
//                     />
                    
//                     <Route path="*" element={<Navigate to="/" replace />} />
//                   </>
//                 )}
//               </Routes>
//             )}
//           </AnimatePresence>
//         </div>
//         </AdminModeProvider>
//       </AuthProvider>
//     </BrowserRouter>
//   );

// }
import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AnimatePresence } from 'motion/react';

// Contexts & Protection
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import { DashboardLayout } from './components/DashboardLayout';
// Pages - Dashboard
 
// Pages - Marketing
import { MarketingLandingPage } from './pages/MarketingLandingPage';
import { InstitutionSignup } from './pages/InstitutionSignup';

// Pages - Portal
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './components/AdminDashboard'; // This handles both Student/Admin logic
import { ExamList } from './components/ExamList';
import { ExamSession } from './components/ExamSession';
import { Analytics } from './components/Analytics';
import { Profile } from './components/Profile';
import { AdminVouchers } from './pages/AdminVouchers';

// UI Components
import { SplashScreen } from './components/SplashScreen';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [isSplashLoading, setIsSplashLoading] = useState(true);

  // 1. Detect if we are on Root (localhost) or Subdomain (aau.localhost)
  const isRootDomain = useMemo(() => {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
  }, []);

  useEffect(() => {
    // Fix viewport height for mobile browsers
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

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Toaster />
          <OfflineIndicator />
          <AnimatePresence mode="wait">
            {isSplashLoading ? (
              <SplashScreen key="splash" />
            ) : (
              <Routes key="routes">
                
                {/* --- CASE 1: PUBLIC MARKETING SITE --- */}
                {isRootDomain ? (
                  <>
                    <Route path="/" element={<MarketingLandingPage />} />
                    <Route path="/signup-institution" element={<InstitutionSignup />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </>
                ) : (
                  
                  /* --- CASE 2: PRIVATE UNIVERSITY PORTAL --- */
                  <>
                    {/* Public Portal Pages */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* All pages inside this block will HAVE the Sidebar (DashboardLayout) */}
                    <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="exams" element={<ExamList />} />
                      <Route path="analytics" element={<Analytics />} />
                      <Route path="profile" element={<Profile />} />
                      
                      {/* Admin Specific Routes */}
                      <Route path="admin/vouchers" element={<AdminVouchers />} />
                      <Route path="admin/departments" element={<div className="p-10">Department Management coming soon</div>} />
                    </Route>

                    {/* Exam Session is usually full-screen (No Sidebar) */}
                    <Route
                      path="/exam/:examId"
                      element={
                        <ProtectedRoute>
                          <ExamSession />
                        </ProtectedRoute>
                      }
                    />
                    
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </>
                )}
              </Routes>
            )}
          </AnimatePresence>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
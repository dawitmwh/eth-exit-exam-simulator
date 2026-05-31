import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AnimatePresence } from 'motion/react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MobileLayout } from './components/MobileLayout';
import { MarketingLandingPage } from './pages/MarketingLandingPage';
import { InstitutionSignup } from './pages/InstitutionSignup';
import { AdminDashboard } from './components/AdminDashboard';
import { ExamList } from './components/ExamList';
import { ExamSession } from './components/ExamSession';
import { Analytics } from './components/Analytics';
import { Profile } from './components/Profile';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { SplashScreen } from './components/SplashScreen';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Toaster } from './components/ui/sonner';
import { AdminVouchers } from './pages/AdminVouchers';

// The main App component sets up routing, authentication context, and global UI elements
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  // 1. On initial load, we set up a splash screen and calculate the --vh CSS variable for mobile viewport height
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    // Initial calculation of --vh on mount
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    // Simulate loading time for the splash screen (e.g., while checking auth state)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    // Cleanup event listeners and timer on unmount
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
      clearTimeout(timer);
    };
  }, []);

  const isRootDomain = useMemo(() => {
    const hostname = window.location.hostname;
    // In production, this would be 'exitexaminer.com'
    // On your machine, it is 'localhost'
    return hostname === 'localhost' || hostname === '127.0.0.1';
  }, []);

  // 2. The App component wraps everything in BrowserRouter for routing and AuthProvider for authentication context
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Toaster />
          <OfflineIndicator />
          <AnimatePresence mode="wait">
            {isLoading ? (
              <SplashScreen key="splash" />
            ) : (
              <Routes key="routes">
                {/* 
                   2. CONDITIONAL ROUTING SWITCH 
                   If on Root -> Show Marketing. If on Subdomain -> Show Portal.
                */}
                {isRootDomain ? (
                  /* --- PUBLIC MARKETING ROUTES (Root Domain Only) --- */
                  <>
                    <Route path="/" element={<MarketingLandingPage />} />
                    <Route path="/signup-institution" element={<InstitutionSignup />} />
                    {/* If a student types /login on the marketing site, redirect them home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </>
                ) : (
                  /* --- PRIVATE PORTAL ROUTES (Subdomains Only) --- */
                  <>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="admin/vouchers" 
                           element={
                              <ProtectedRoute>
                                <AdminVouchers />
                              </ProtectedRoute>
                            } 
                            />

                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <MobileLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<AdminDashboard />} />
                      <Route path="exams" element={<ExamList />} />
                      <Route path="analytics" element={<Analytics />} />
                      <Route path="profile" element={<Profile />} />
                    </Route>

                    <Route
                      path="/exam/:examId"
                      element={
                        <ProtectedRoute>
                          <ExamSession />
                        </ProtectedRoute>
                      }
                    />
                    
                    {/* Safe redirect for subdomains */}
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

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';  
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { GraduationCap, AlertCircle, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenantName, setTenantName] = useState('University');
  
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // SENIOR MOVE: Detect which university portal this is
  useEffect(() => {
    const host = window.location.hostname;
    const slug = host.split('.')[0];
    if (slug !== 'localhost' && slug !== '127') {
      // Capitalize slug for display (e.g. arsi -> Arsi)
      setTenantName(slug.charAt(0).toUpperCase() + slug.slice(1));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);

    try {
      // 1. Perform Login
      await login(email, password);
      
      // 2. DETECT DESTINATION
      const host = window.location.hostname;
      const isRoot = host === 'localhost' || host === '127.0.0.1';

      // We wait for a millisecond to ensure the 'user' state is updated from context
      // or we check the response directly if your login function returns the user.
      
      if (isRoot) {
        // If on Root domain, we assume it's a SaaS Staff/Owner login
        toast.success("Master Portal Access Granted");
        navigate('/owner', { replace: true });
      } else {
        // If on a subdomain (arsi.localhost), go to the Student/Dean dashboard
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError("Invalid Credentials");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary relative overflow-hidden p-4">
      {/* Dynamic Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,primary_0%,transparent_40%)]" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,primary_0%,transparent_40%)]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[440px] relative z-10"
      >
        {/* Portal Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-[24px] backdrop-blur-2xl mb-6 border border-white/10 shadow-2xl">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            {tenantName} Portal
          </h1>
          <p className="text-slate-400 font-medium">National Exit Exam Preparation</p>
        </div>

        {/* Login Form Card */}
        <Card className="p-8 md:p-10 border-slate-800 bg-primary/80 backdrop-blur-xl shadow-2xl rounded-[32px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 font-bold text-xs uppercase tracking-widest ml-1">
                University/College Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@university.edu.et"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 bg-slate-800/40 border-slate-700 text-white placeholder:text-slate-600 focus:ring-emerald-500 rounded-2xl transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="password" className="text-slate-300 font-bold text-xs uppercase tracking-widest">
                  Password
                </Label>
                <Link to="#" className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-tighter">
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-14 bg-slate-800/40 border-slate-700 text-white focus:ring-emerald-500 rounded-2xl transition-all"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 text-sm text-rose-400 bg-rose-400/10 p-4 rounded-2xl border border-rose-400/20"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-medium">{error}</span>
              </motion.div>
            )}

            <Button 
              type="submit" 
              className="w-full h-16 bg-primary hover:bg-emerald-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Enter Portal <ArrowRight size={20} />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-500 font-medium">
              New student?{' '}
              <Link
                to="/register"
                className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors ml-1"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </Card>

        {/* Trust Footer */}
        <div className="mt-10 flex items-center justify-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
           <div className="flex items-center gap-2 text-white">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Secure Session</span>
           </div>
           <div className="w-1 h-1 bg-slate-700 rounded-full" />
           <div className="text-white text-[10px] font-black uppercase tracking-[0.2em]">MoE Standards</div>
        </div>
      </motion.div>
    </div>
  );
}








// import { useState } from 'react';
// import { Link, useNavigate } from 'react-router';  
// import { useAuth } from '../contexts/AuthContext';
// import { Button } from '../components/ui/button';
// import { Input } from '../components/ui/input';
// import { Label } from '../components/ui/label';
// import { Card } from '../components/ui/card';
// import { GraduationCap, AlertCircle, Loader2 } from 'lucide-react';
// import { motion } from 'motion/react';


// export function Login() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (isSubmitting) return;

//     setError('');
//     setIsSubmitting(true);

//     try {
//       const payload = await login(email, password);
//       // success -> payload contains backend data (tokens, user, etc.)
//       navigate('/', { replace: true });
//     } catch (err: any) {
//       // AuthContext rejects with backend error object (e.g. { detail: "..."} or { error: "..." })
//       const message =
//         err?.error ?? err?.detail ?? (typeof err === 'string' ? err : JSON.stringify(err));
//       setError(String(message));
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 p-4">
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="w-full max-w-md"
//       >
//         {/* Header */}
//         <div className="text-center mb-8">
//           <motion.div
//             initial={{ scale: 0 }}
//             animate={{ scale: 1 }}
//             transition={{ delay: 0.2, type: 'spring' }}
//             className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4"
//           >
//             <GraduationCap className="w-8 h-8 text-primary" />
//           </motion.div>
//           <h1 className="text-3xl font-bold text-white mb-2">Exit Examiner</h1>
//           <p className="text-white/80">Sign in to continue your preparation</p>
//         </div>

//         {/* Login Form */}
//         <Card className="p-8">
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="email">Email</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="student@university.edu"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//                 autoComplete="email"
//                 className="w-full"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 placeholder="••••••••"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//                 autoComplete="current-password"
//                 className="w-full"
//               />
//             </div>

//             {error && (
//               <motion.div
//                 initial={{ opacity: 0, y: -10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md"
//               >
//                 <AlertCircle className="w-4 h-4" />
//                 {error}
//               </motion.div>
//             )}

//             <Button type="submit" className="w-full" disabled={isSubmitting}>
//               {isSubmitting ? (
//                 <span className="flex items-center gap-2">
//                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                   Signing in...
//                 </span>
//               ) : (
//                 'Sign In'
//               )}
//             </Button>
//           </form>

//           <div className="mt-6 text-center">
//             <p className="text-sm text-muted-foreground">
//               Don't have an account?{' '}
//               <Link
//                 to="/register"
//                 className="text-primary font-medium hover:underline"
//               >
//                 Sign up
//               </Link>
//             </p>
//           </div>
//         </Card>

//         {/* Demo Credentials */}
//         <div className="mt-6 text-center text-white/60 text-sm">
//           <p className="mb-2 font-medium text-white/80">Demo credentials:</p>
//           <p>Email: student@university.edu</p>
//           <p>Password: password123</p>
//         </div>
//       </motion.div>
//     </div>
//   );
// }

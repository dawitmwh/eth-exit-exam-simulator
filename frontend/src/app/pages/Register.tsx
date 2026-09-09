import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { 
  GraduationCap, 
  AlertCircle, 
  CheckCircle2, 
  Ticket, 
  Loader2, 
  ShieldCheck, 
  ArrowRight,
  User as UserIcon,
  Mail,
  Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [voucherCode, setVoucherCode] = useState('');  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tenantName, setTenantName] = useState('University');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // SENIOR MOVE: Detect which university portal this is
  useEffect(() => {
    const host = window.location.hostname;
    const slug = host.split('.')[0];
    if (slug !== 'localhost' && slug !== '127') {
      setTenantName(slug.charAt(0).toUpperCase() + slug.slice(1));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError('');
    setIsLoading(true);
    
    try {
      await register(name, email, password, voucherCode);
      toast.success("Voucher Redeemed! Welcome to the platform.");
      navigate('/', { replace: true });
    } catch (err: any) {
      const message = err?.error ?? err?.detail ?? "Registration failed. Please verify your voucher.";
      setError(String(message));
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = password.length >= 8;

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary relative overflow-hidden p-4">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%, primary_0%,transparent_40%)]" />
      <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%, primary_0%,transparent_40%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[480px] relative z-10"
      >
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-[24px] backdrop-blur-2xl mb-6 border border-white/10 shadow-2xl">
            <GraduationCap className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Create Account</h1>
          <p className="text-slate-400 font-medium">Join the {tenantName} Exit Preparation Portal</p>
        </div>

        {/* Registration Form Card */}
        <Card className="p-8 md:p-10 border-slate-800 bg-primary backdrop-blur-xl shadow-2xl rounded-[32px]">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* VOUCHER FIELD - Styled as the "Key" */}
            <div className="space-y-2">
              <Label className="text-slate-400 font-white text-[10px] uppercase tracking-[0.2em] ml-1">
                Admission Voucher
              </Label>
              <div className="relative group">
                <Ticket className="absolute left-4 top-4 w-5 h-5 text-emerald-500 transition-colors group-focus-within:text-emerald" />
                <Input
                  placeholder="CODE-XXXX-2026"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  required
                  className="h-14 pl-12 bg-primary border-indigo-500/30 text-emerald-100 placeholder:text-emerald-900/50 focus:ring-emerald rounded-2xl font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <Label className="text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-1">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
                  <Input
                    placeholder="Ephrem ..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-14 pl-12 bg-slate-800/40 border-slate-700 text-white rounded-2xl focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-1">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
                  <Input
                    type="email"
                    placeholder="student@university.edu.et"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 pl-12 bg-slate-800/40 border-slate-700 text-white rounded-2xl focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-1">Create Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-14 pl-12 bg-slate-800/40 border-slate-700 text-white rounded-2xl focus:ring-emerald-500"
                />
              </div>
              {password && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 px-1 mt-2">
                  {passwordStrength ? (
                    <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Secure Strength</span></>
                  ) : (
                    <><AlertCircle className="w-3.5 h-3.5 text-amber-500" /><span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">8+ Characters Required</span></>
                  )}
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-1">Confirm Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-14 bg-slate-800/40 border-slate-700 text-white rounded-2xl focus:ring-indigo-500"
              />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 text-sm text-rose-400 bg-rose-400/10 p-4 rounded-2xl border border-rose-400/20">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-medium">{error}</span>
              </motion.div>
            )}

            <Button 
              type="submit" 
              className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-900/20 transition-all mt-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</span>
              ) : (
                <span className="flex items-center gap-2">Redeem & Start <ArrowRight size={20} /></span>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Member already?{' '}
              <Link to="/login" className="text-emerald-400 font-bold hover:text-emerald-300 ml-1">Sign In</Link>
            </p>
          </div>
        </Card>

        {/* Legal Disclaimer */}
        <p className="mt-8 text-center text-[10px] text-slate-600 font-medium leading-relaxed px-6">
          By redeeming a voucher, you agree to the Institutional Terms of Service and data privacy policies.
        </p>
      </motion.div>
    </div>
  );
}






// import { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router';
// import { useAuth } from '../contexts/AuthContext';
// import { Button } from '../components/ui/button';
// import { Input } from '../components/ui/input';
// import { Label } from '../components/ui/label';
// import { Card } from '../components/ui/card';
// import { GraduationCap, AlertCircle, CheckCircle2, Ticket } from 'lucide-react';
// import { motion } from 'motion/react';

// export function Register() {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [voucherCode, setVoucherCode] = useState('');  
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [error, setError] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [tenantName, setTenantName] = useState('Your University');
//   const { register } = useAuth();
//   const navigate = useNavigate();

//     // Identify the Tenant from the URL
//   useEffect(() => {
//     const host = window.location.hostname; // e.g., "aau.localhost"
//     const slug = host.split('.')[0];
//     if (slug !== 'localhost' && slug !== '127') {
//       setTenantName(slug.toUpperCase());
//     }
//   }, []);

//   const validatePassword = (pwd: string) => {
//     if (pwd.length < 8) {
//       return 'Password must be at least 8 characters';
//     }
//     return '';
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');

//     // Validation
//     if (password !== confirmPassword) {
//       setError('Passwords do not match');
//       return;
//     }

//     const passwordError = validatePassword(password);
//     if (passwordError) {
//       setError(passwordError);
//       return;
//     }

//     setIsLoading(true);
    
//     try {
//       const payload = await register(name, email, password, voucherCode);
//       // registration succeeded — payload contains backend response (message, etc.)
//       // navigate to home or login depending on desired flow
//       navigate('/', { replace: true });
//     } catch (err: any) {
//       // AuthContext.register rejects with backend payload (e.g. { error: "..."} or { detail: "..." })
//       const message =
//         err?.error ?? err?.detail ?? (typeof err === 'string' ? err : JSON.stringify(err));
//       setError(String(message));
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const passwordStrength = password.length >= 8;


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
//           <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
//           <p className="text-white/80">Start your exam preparation journey</p>
//         </div>

//         {/* Registration Form */}
//         <Card className="p-8">
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="voucher">Voucher Code</Label>
//               <div className="relative">
//                 <Ticket className="absolute left-3 top-3 w-4 h-4 text-indigo-400" />
//                 <Input
//                   id="voucher"
//                   placeholder="AAU-XXXX-2026"
//                   value={voucherCode}
//                   onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
//                   required
//                   className="w-full pl-10"
//                 />
//               </div>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="name">Full Name</Label>
//               <Input
//                 id="name"
//                 type="text"
//                 placeholder="John Doe"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 required
//                 autoComplete="name"
//                 className="w-full"
//               />
//             </div>

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
//                 autoComplete="new-password"
//                 className="w-full"
//               />
//               {password && (
//                 <div className="flex items-center gap-2 text-xs mt-1">
//                   {passwordStrength ? (
//                     <>
//                       <CheckCircle2 className="w-3 h-3 text-green-600" />
//                       <span className="text-green-600">Strong password</span>
//                     </>
//                   ) : (
//                     <>
//                       <AlertCircle className="w-3 h-3 text-orange-600" />
//                       <span className="text-orange-600">
//                         At least 8 characters required
//                       </span>
//                     </>
//                   )}
//                 </div>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="confirmPassword">Confirm Password</Label>
//               <Input
//                 id="confirmPassword"
//                 type="password"
//                 placeholder="••••••••"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//                 required
//                 autoComplete="new-password"
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

//             <Button type="submit" className="w-full" disabled={isLoading}>
//               {isLoading ? (
//                 <span className="flex items-center gap-2">
//                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                   Creating account...
//                 </span>
//               ) : (
//                 'Create Account'
//               )}
//             </Button>
//           </form>

//           <div className="mt-6 text-center">
//             <p className="text-sm text-muted-foreground">
//               Already have an account?{' '}
//               <Link
//                 to="/login"
//                 className="text-primary font-medium hover:underline"
//               >
//                 Sign in
//               </Link>
//             </p>
//           </div>
//         </Card>

//         {/* Terms */}
//         <p className="mt-6 text-center text-white/60 text-xs">
//           By creating an account, you agree to our Terms of Service and Privacy
//           Policy
//         </p>
//       </motion.div>
//     </div>
//   );
// }


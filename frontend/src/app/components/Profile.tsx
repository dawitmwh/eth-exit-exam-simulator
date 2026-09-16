import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { useDashboardData } from '../pages/admin/data/DashboardData';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import apiClient from '../api/client';
import { motion } from 'motion/react';

import {
  User, Mail, GraduationCap, Building2, Trophy, Settings, History,
  Bell, Moon, LogOut, ChevronRight, Ticket, Zap, ShieldCheck
} from 'lucide-react';

export function Profile() {
  const { user, logout } = useAuth();
  const { data: stats } = useDashboardData(); // Get live voucher balance/score
  const navigate = useNavigate();

  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success("Signed out successfully");
  };

  // Generate initials from the correct Django field: full_name
  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const handleBuyCredits = async (count: number) => {
    try {
      const res = await apiClient.post('/payments/initialize/', { credits: count });
      window.location.href = res.data.checkout_url;
    } catch (err) {
      toast.error("Billing service unavailable");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* 1. PREMIUM HEADER */}
      <header className="bg-primary text-white pt-8 pb-24 px-6 relative overflow-hidden">
        <div className="container max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Avatar className="w-32 h-32 border-4 border-white/10 shadow-2xl">
              <AvatarFallback className="text-4xl font-black bg-indigo-500 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          
          <div className="text-center md:text-left">
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
               <Badge className="bg-indigo-500/20 text-indigo-300 border-none px-3 py-1 font-bold uppercase text-[10px] tracking-widest">
                 {user?.role}
               </Badge>
               <Badge className="bg-emerald-500/20 text-emerald-400 border-none px-3 py-1 font-bold uppercase text-[10px] tracking-widest">
                 Verified Account
               </Badge>
            </div>
            <h1 className="text-2xl font-black tracking-tight">{user?.full_name}</h1>
            <p className="text-primary font-medium mt-1">{user?.email}</p>
          </div>
        </div>
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl -mr-20 -mt-20" />
      </header>

      <div className="container max-w-5xl mx-auto px-6 mt-20 relative z-20 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 2. IDENTITY CARD */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-[32px] bg-white">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <ShieldCheck className="text-primary" /> Account Identity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoBlock icon={<User />} label="Legal Name" value={user?.full_name} />
                <InfoBlock icon={<Mail />} label="Email Address" value={user?.email} />
                <InfoBlock icon={<GraduationCap />} label="Academic Focus" value={user?.department_name || 'N/A'} />
                <InfoBlock icon={<Building2 />} label="Institution" value={user?.university_name} />
              </div>
              <Button className="w-full mt-10 rounded-2xl h-14 font-bold border-slate-100" variant="outline">
                Update Security Settings
              </Button>
            </Card>

            {/* 3. DYNAMIC BOTTOM SECTION (STUDENT ACHIEVEMENTS OR DEAN RECENT BILLING) */}
            {!isAdmin ? (
               <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-[32px] bg-white">
                  <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Trophy className="text-amber-500" /> Learning Milestones
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Achievement icon="🎯" label="First Exam" status="Earned" />
                    <Achievement icon="⚡" label="Speed Demon" status="Earned" />
                    <Achievement icon="🔥" label="7 Day Streak" status="Active" />
                    <Achievement icon="👑" label="Top Scorer" status="Locked" locked />
                  </div>
               </Card>
            ) : (
               <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-[32px] bg-white">
                  <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <History className="text-primary" /> Billing Snapshot
                  </h2>
                  <p className="text-sm text-slate-500 mb-6">Your most recent institutional purchases.</p>
                  <Button variant="outline" className="w-full rounded-xl py-6" onClick={() => navigate('/admin/vouchers')}>
                    View Full Transaction Ledger <ChevronRight size={16} className="ml-2" />
                  </Button>
               </Card>
            )}
          </div>

          {/* 4. SIDEBAR CARDS (WALLET / SETTINGS) */}
          <div className="space-y-8">
            {/* VOUCHER WALLET (For Deans) */}
            {isAdmin && (
              <Card className="p-8 bg-primary text-white border-none shadow-xl shadow-indigo-200 rounded-[32px] relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                     <div className="p-3 bg-white/10 rounded-2xl"><Ticket size={24}/></div>
                     <Badge className="bg-white/20 border-none text-white px-2">Pro</Badge>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60">Voucher Balance</p>
                  <h3 className="text-4xl font-black mt-1 mb-8"> </h3>
                  <Button 
                    className="w-full bg-white text-primary hover:bg-white/50 font-bold py-6 rounded-xl"
                    onClick={() => handleBuyCredits(100)}
                  >
                    Top Up Credits
                  </Button>
                </div>
                <Zap size={120} className="absolute -right-8 -bottom-8 opacity-10" />
              </Card>
            )}

            {/* PREFERENCES */}
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-[32px] bg-white">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Settings size={18} className="text-slate-400" /> Preferences
              </h2>
              <div className="space-y-6">
                <ToggleRow icon={<Bell />} label="Notification" sub="Exam reminders" />
                <ToggleRow icon={<Moon />} label="Dark Mode" sub="Reduce eye strain" />
              </div>
              <Button 
                variant="ghost" 
                className="w-full mt-10 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold h-14 rounded-2xl gap-2"
                onClick={handleLogout}
              >
                <LogOut size={18} /> Sign Out of Platform
              </Button>
            </Card>
          </div>
        </div>

        <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 py-10">
          Exit Examiner SaaS Engine • Version 1.2.0-Production
        </p>
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function InfoBlock({ icon, label, value }: { icon: any, label: string, value?: string }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
      <div className="p-2.5 bg-white rounded-xl text-slate-400 shadow-sm">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-black text-slate-700 truncate">{value || 'Not set'}</p>
      </div>
    </div>
  );
}

function Achievement({ icon, label, status, locked = false }: { icon: string, label: string, status: string, locked?: boolean }) {
  return (
    <div className={`text-center p-5 rounded-2xl border ${locked ? 'bg-slate-50 border-slate-100 opacity-40' : 'bg-white border-slate-100 shadow-sm'}`}>
      <div className="text-3xl mb-3">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-tighter text-slate-800">{label}</p>
      <p className="text-[9px] font-bold uppercase text-indigo-600 mt-1">{status}</p>
    </div>
  );
}

function ToggleRow({ icon, label, sub }: { icon: any, label: string, sub: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-slate-400">{icon}</div>
        <div>
          <Label className="text-sm font-bold text-slate-700">{label}</Label>
          <p className="text-[10px] text-slate-400 font-medium">{sub}</p>
        </div>
      </div>
      <Switch />
    </div>
  );
}






// import { useAuth } from '../contexts/AuthContext';
// import { useNavigate } from 'react-router';
// import { Card } from './ui/card';
// import { Button } from './ui/button';
// import { Badge } from './ui/badge';
// import { Avatar, AvatarFallback } from './ui/avatar';
// import { Switch } from './ui/switch';
// import { Label } from './ui/label';
// import { toast }  from 'sonner';
// import apiClient from '../api/client';

// import {
//   User,
//   Mail,
//   GraduationCap,
//   Building2,
//   Trophy,
//   Settings,
//   Bell,
//   Moon,
//   LogOut,
//   ChevronRight,
// } from 'lucide-react';

// export function Profile() {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   const initials = user?.name
//     ?.split(' ')
//     .map((n) => n[0])
//     .join('')
//     .toUpperCase()
//     .slice(0, 2) || 'U';

//   const handleBuyCredits = async (requestedCredits: number) => {
//   try {
//     // 1. Call your Django InitializePaymentView
//     const res = await apiClient.post('api/payments/initialize/', {
//       credits: requestedCredits
//     });
    
//     // 2. REDIRECT TO CHAPA
//     // This takes the user away from your site to the secure Chapa page
//     window.location.href = res.data.checkout_url;
//   } catch (err) {
//     toast.error("Could not initialize payment");
//   }
// };

//   return (
//     <div className="min-h-screen md:ml-64">
//       {/* Header */}
//       <header className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
//         <div className="container max-w-7xl mx-auto px-4 py-8">
//           <div className="flex items-center gap-4">
//             <Avatar className="w-20 h-20 border-4 border-primary-foreground/20">
//               <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
//             </Avatar>
//             <div>
//               <h1 className="text-2xl font-bold">{user?.full_name}</h1>
//               <p className="text-primary-foreground/80 mt-1">{user?.email}</p>
//             </div>
//           </div>
//         </div>
//       </header>

//       <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
//         {/* Profile Info */}
//         <Card className="p-6">
//           <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
//           <div className="space-y-4">
//             <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
//               <User className="w-5 h-5 text-muted-foreground" />
//               <div>
//                 <p className="text-sm text-muted-foreground">Full Name</p>
//                 <p className="font-medium">{user?.full_name}</p>
//               </div>
//             </div>

//             <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
//               <Mail className="w-5 h-5 text-muted-foreground" />
//               <div>
//                 <p className="text-sm text-muted-foreground">Email</p>
//                 <p className="font-medium">{user?.email}</p>
//               </div>
//             </div>

//             <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
//               <GraduationCap className="w-5 h-5 text-muted-foreground" />
//               <div>
//                 <p className="text-sm text-muted-foreground">Department</p>
//                 <p className="font-medium">{user?.department_name}</p>
//               </div>
//             </div>

//             <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
//               <Building2 className="w-5 h-5 text-muted-foreground" />
//               <div>
//                 <p className="text-sm text-muted-foreground">University</p>
//                 <p className="font-medium">{user?.university_name}</p>
//               </div>
//             </div>
//           </div>

//           <Button className="w-full mt-6" variant="outline">
//             Edit Profile
//           </Button>
//         </Card>

//         {/* Achievements */}
//         <Card className="p-6">
//           <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
//             <Trophy className="w-5 h-5 text-yellow-500" />
//             Achievements
//           </h2>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//             <div className="text-center p-4 bg-accent/50 rounded-lg">
//               <div className="text-3xl mb-2">🎯</div>
//               <p className="text-sm font-medium">First Exam</p>
//               <p className="text-xs text-muted-foreground mt-1">Completed</p>
//             </div>
//             <div className="text-center p-4 bg-accent/50 rounded-lg">
//               <div className="text-3xl mb-2">⚡</div>
//               <p className="text-sm font-medium">Speed Demon</p>
//               <p className="text-xs text-muted-foreground mt-1">Under 2 min/q</p>
//             </div>
//             <div className="text-center p-4 bg-accent/50 rounded-lg">
//               <div className="text-3xl mb-2">🔥</div>
//               <p className="text-sm font-medium">7 Day Streak</p>
//               <p className="text-xs text-muted-foreground mt-1">Active</p>
//             </div>
//             <div className="text-center p-4 bg-accent/50 rounded-lg opacity-50">
//               <div className="text-3xl mb-2">👑</div>
//               <p className="text-sm font-medium">Top Scorer</p>
//               <p className="text-xs text-muted-foreground mt-1">Locked</p>
//             </div>
//           </div>
//         </Card>

//         {/* Subscription */}
//         <Card className="p-6">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               <h2 className="text-xl font-semibold">Subscription</h2>
//               <p className="text-sm text-muted-foreground mt-1">Premium Plan</p>
//             </div>
//             <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">Pro</Badge>
//           </div>
//           <div className="space-y-3">
//             <div className="flex items-center justify-between text-sm">
//               <span className="text-muted-foreground">Status</span>
//               <span className="font-medium text-green-600 dark:text-green-400">Active</span>
//             </div>
//             <div className="flex items-center justify-between text-sm">
//               <span className="text-muted-foreground">Next billing</span>
//               <span className="font-medium">June 12, 2026</span>
//             </div>
//             <div className="flex items-center justify-between text-sm">
//               <span className="text-muted-foreground">Plan</span>
//               <span className="font-medium">$29.99/month</span>
//             </div>
//           </div>
//           <Button className="w-full mt-6" variant="outline">
//             Manage Subscription
//           </Button>
//         </Card> 
//         {/* Settings */}
//         <Card className="p-6">
//           <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
//             <Settings className="w-5 h-5" />
//             Settings
//           </h2>
//           <div className="space-y-4">
//             <div className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
//               <div className="flex items-center gap-3">
//                 <Bell className="w-5 h-5 text-muted-foreground" />
//                 <div>
//                   <Label>Notifications</Label>
//                   <p className="text-xs text-muted-foreground">Receive exam reminders</p>
//                 </div>
//               </div>
//               <Switch defaultChecked />
//             </div>

//             <div className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
//               <div className="flex items-center gap-3">
//                 <Moon className="w-5 h-5 text-muted-foreground" />
//                 <div>
//                   <Label>Dark Mode</Label>
//                   <p className="text-xs text-muted-foreground">Toggle dark theme</p>
//                 </div>
//               </div>
//               <Switch />
//             </div>

//             <button className="flex items-center justify-between w-full p-3 bg-accent/30 rounded-lg hover:bg-accent transition-colors">
//               <div className="flex items-center gap-3">
//                 <Settings className="w-5 h-5 text-muted-foreground" />
//                 <div className="text-left">
//                   <Label>Preferences</Label>
//                   <p className="text-xs text-muted-foreground">Exam settings & more</p>
//                 </div>
//               </div>
//               <ChevronRight className="w-5 h-5 text-muted-foreground" />
//             </button>
//           </div>
//         </Card>

//         {/* Logout */}
//         <Button
//           variant="destructive"
//           className="w-full gap-2"
//           size="lg"
//           onClick={handleLogout}
//         >
//           <LogOut className="w-5 h-5" />
//           Sign Out
//         </Button>

//         {/* App Version */}
//         <p className="text-center text-sm text-muted-foreground py-4">
//           Exit Examiner v1.0.0
//         </p>
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useDashboardData } from '../pages/admin/data/DashboardData';
import { 
  Ticket, Plus, Check, Loader2, Badge,
  Search, CreditCard, History, Zap, AlertCircle, TrendingUp 
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { VoucherTable } from './VoucherTable'; // Ensure these paths are correct
import { BillingTable } from './BillingTable';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router';
// canvas-confetti does not ship with TypeScript declarations.
// @ts-expect-error Missing declaration file for the JavaScript module.
import confetti from 'canvas-confetti';

// --- TYPES ---
interface Voucher {
  id: number;
  code: string;
  department_name: string;
  is_redeemed: boolean;
  redeemed_by_email: string | null;
  created_at: string;
}

interface Transaction {
  tx_ref: string;
  amount: string;
  credits_purchased: number;
  status: string;
  date: string;
}

interface Department {
  id: number;
  name: string;
}

export function AdminVouchers() {
  // Global dashboard refresh logic
  const { refreshData: refreshGlobalDashboard } = useDashboardData();
  const [searchParams] = useSearchParams();
  // Data States
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vouchers' | 'billing'>('vouchers');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [batchCount, setBatchCount] = useState(10);
  const [selectedDept, setSelectedDept] = useState('');
  const selectedPackage = searchParams.get('package'); 

  useEffect(() => {
    fetchData();
  }, []);


  useEffect(() => {
    // 1. Check if the URL has ?status=success
    if (searchParams.get('status') === 'success') {
      toast.success("Transaction Confirmed! Credits added to your account.");
      // 2. Fire confetti for a premium feel
      // confetti({
      //   particleCount: 150,
      //   spread: 70,
      //   origin: { y: 0.6 },
      //   colors: ['#4f46e5', '#10b981', '#f59e0b']
      // });
      // 3. Clear the URL so the toast doesn't show again on refresh
      window.history.replaceState({}, '', window.location.pathname);
    }
    fetchData();
  }, [searchParams]);
  

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('status') === 'success') {
    toast.success("Payment Verified! Your credits have been updated.");
    // This calls your /vouchers/analytics/ which now returns the 390!
    fetchData(); 
  }
}, []);


  const fetchData = async () => {
    try {
      const [vRes, dRes, sRes, tRes] = await Promise.all([
        apiClient.get('/vouchers/'),
        apiClient.get('/departments/'),
        apiClient.get('/vouchers/analytics/'),
        apiClient.get('/billing/history/')  
      ]);

      setVouchers(vRes.data);
      setDepartments(dRes.data);
      setStats(sRes.data);
      setTransactions(tRes.data);
    } catch (err) {
      toast.error("Cloud synchronization failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCredits = async (count: number) => {

    console.log("selectedPackage:", selectedPackage);
    console.log("count:", count);

    try {
        const res = await apiClient.post(
            '/payments/initialize/',
            {
                
                credits: count
            }
        );

        toast.info("Redirecting to Chapa Gateway...");
        window.location.href = res.data.checkout_url;

    } catch (e) {
        console.error("Payment initialization error:", e);
        toast.error("Billing service unavailable");
    }
};

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return toast.error("Please select a department");
    
    setIsGenerating(true);
    try {
      const res = await apiClient.post('/vouchers/generate/', {
        count: batchCount,
        department_id: selectedDept
      });
      toast.success(res.data.message || "Batch generated successfully!");
      
      // Refresh local data and global credits
      fetchData(); 
      refreshGlobalDashboard();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Generation failed";
      toast.error(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.info("Voucher copied to clipboard");
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
    </div>
  );

  return (
    <div className="p-4 md:p-10 space-y-8 bg-slate-50 min-h-screen">
      
      {/* HEADER & WALLET SECTION */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Institutional Enrollment</h1>
          <p className="text-slate-500 font-medium mt-1">Manage student seats and license distribution.</p>
        </div>
        
        {/* Real-time Wallet Card */}
        <div className="bg-primary text-white p-6 rounded-[28px] shadow-xl shadow-indigo-900/20 flex items-center gap-6 border border-white/10">
            <div className="p-4 bg-white/10 rounded-2xl">
                <Ticket size={32} className="text-emerald-300" />
            </div>
            <div>
                <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-1">Available Credits</p>
                <p className="text-4xl font-black">{stats?.voucher_balance || 0}</p>
            </div>
        </div>
      </header>

      {/* ACTION GRID: TOP UP & GENERATE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 1. PURCHASE CREDITS (The Money Side) */}
        <Card className="p-8 border-none shadow-sm bg-white rounded-[32px] flex flex-col justify-between">
           <div>
             <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-2">
                <CreditCard className="text-primary" size={20} /> Purchase Seats
             </h2>
             <p className="text-sm text-slate-500 mb-8 font-medium">Add capacity to your university portal via Chapa.</p>
             
             <div className="space-y-3">
                <PricingButton amount={50} price="1,000" onClick={() => handleBuyCredits(50)} />
                <PricingButton amount={250} price="4,500" onClick={() => handleBuyCredits(250)} />
             </div>
           </div>
           
           <p className="text-[10px] text-primary font-bold uppercase tracking-widest text-center mt-6">
             Secure payment via Telebirr / CBE Birr
           </p>
        </Card>

        {/* 2. GENERATE VOUCHERS (The Distribution Side) */}
        <Card className="lg:col-span-2 p-8 border-none shadow-sm bg-white rounded-[32px]">
           <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-indigo-50 rounded-2xl text-primary"><Plus size={24}/></div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Generate Access Codes</h2>
                <p className="text-sm text-slate-500 font-medium">Convert credits into unique student vouchers.</p>
              </div>
           </div>

           <form onSubmit={handleGenerate} className="grid md:grid-cols-2 gap-8 items-end">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Select Department</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 ring-primary/50 transition-all"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  required
                >
                  <option value="">Choose Faculty...</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Quantity</label>
                  <span className="text-sm font-black text-primary bg-indigo-50 px-3 py-1 rounded-lg">{batchCount} Seats</span>
                </div>
                <input 
                  type="range" min="1" max="50" 
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  value={batchCount}
                  onChange={(e) => setBatchCount(parseInt(e.target.value))}
                />
              </div>

              <div className="md:col-span-2">
                <Button 
                  type="submit"
                  disabled={isGenerating || (stats?.voucher_balance < batchCount)}
                  className="w-full h-16 bg-primary/85 hover:bg-primary text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-100 transition-all"
                >
                  {isGenerating ? <Loader2 className="animate-spin" /> : `Create ${batchCount} Vouchers`}
                </Button>
                {stats?.voucher_balance < batchCount && (
                  <p className="text-rose-500 text-xs font-bold text-center mt-3 uppercase tracking-tighter">
                    Insufficient Balance. Please top up above.
                  </p>
                )}
              </div>
           </form>
        </Card>
      </div>

      {/* THE DATA LEDGER: TABS FOR INVENTORY & BILLING */}
      <section className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex p-2 bg-slate-50/50">
            <button 
              onClick={() => setActiveTab('vouchers')}
              className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'vouchers' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Voucher Inventory
            </button>
            <button 
              onClick={() => setActiveTab('billing')}
              className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'billing' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Billing History
            </button>
        </div>

        <div className="p-6 md:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'vouchers' ? (
                   <VoucherTable 
                    vouchers={vouchers} 
                    copiedCode={copiedCode} 
                    copyToClipboard={copyToClipboard} 
                   />
                ) : (
                   <BillingTable transactions={transactions} />
                )}
              </motion.div>
            </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function PricingButton({ amount, price, onClick }: { amount: number, price: string, onClick: () => void }) {
    return (
        <button 
          onClick={onClick}
          className="w-full flex items-center justify-between p-5 rounded-2xl border-2 border-slate-50 hover:border-emerald-600 hover:bg-indigo-50/50 transition-all group"
        >
            <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-100 group-hover:scale-110 transition-all">
                    <Zap size={16} className="text-amber-500 fill-current" />
                </div>
                <div className="text-left">
                    <p className="text-lg font-black text-primary leading-none">{amount} Seats</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Institutional Pack</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-black text-primary">{price} ETB</p>
            </div>
        </button>
    );
}












// import { useState, useEffect } from 'react';
// import apiClient from '../api/client';
// import { 
//   Ticket, Plus, Check, Loader2, 
//   Search, CreditCard, History, Zap, AlertCircle 
// } from 'lucide-react';
// import { VoucherTable } from './VoucherTable'
// import {BillingTable } from './BillingTable'
// import { motion, AnimatePresence } from 'motion/react';
// import { toast } from 'sonner';

// // --- TYPES ---
// interface Voucher {
//   id: number;
//   code: string;
//   department_name: string;
//   is_redeemed: boolean;
//   redeemed_by_email: string | null;
//   created_at: string;
//   voucher_balance: number;
// }

// interface Transaction {
//   tx_ref: string;
//   amount: string;
//   credits_purchased: number;
//   status: string;
//   date: string;
// }

// interface Department {
//   id: number;
//   name: string;
// }

// export function AdminVouchers() {
//   const [vouchers, setVouchers] = useState<Voucher[]>([]);
//   const [transactions, setTransactions] = useState<Transaction[]>([]);
//   const [departments, setDepartments] = useState<Department[]>([]);
//   const [stats, setStats] = useState<any>(null);
  
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState<'vouchers' | 'billing'>('vouchers');
//   const [isGenerating, setIsSubmitting] = useState(false);
//   const [copiedCode, setCopiedCode] = useState<string | null>(null);

//   // Form State
//   const [batchCount, setBatchCount] = useState(10);
//   const [selectedDept, setSelectedDept] = useState('');

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       const [vRes, dRes, sRes, tRes] = await Promise.all([
//         apiClient.get('/vouchers/'),
//         apiClient.get('/departments/'),
//         apiClient.get('/vouchers/analytics/'),
//         apiClient.get('/billing/history/')  
//       ]);

//       setVouchers(vRes.data);
//       setDepartments(dRes.data);
//       setStats(sRes.data);
//       setTransactions(tRes.data);
//     } catch (err) {
//       toast.error("Failed to load management data");
//     } finally {
//       setLoading(false);
//     }
//   };


//   const handleBuyCredits = async (count: number) => {
//     try {
//       const res = await apiClient.post('/payments/initialize/', { credits: count });
//       toast.info("Redirecting to secure payment...");
//       window.location.href = res.data.checkout_url;
//     } catch (e) {
//       toast.error("Payment initialization failed");
//     }
//   };

//   const handleGenerate = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedDept) return toast.error("Please select a department");
    
//     setIsSubmitting(true);
//     try {
//       const res = await apiClient.post('/vouchers/generate/', {
//         count: batchCount,
//         department_id: selectedDept
//       });
//       toast.success(`Generated ${batchCount} new vouchers!`);
//       fetchData(); 
//     } catch (err: any) {
//       toast.error(err.response?.data?.error || "Generation failed");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const copyToClipboard = (code: string) => {
//     navigator.clipboard.writeText(code);
//     setCopiedCode(code);
//     setTimeout(() => setCopiedCode(null), 2000);
//     toast.info("Code copied to clipboard");
//   };

//   if (loading) return <div className="flex h-screen items-center justify-center md:ml-64"><Loader2 className="animate-spin text-indigo-600" /></div>;

//   return (
//     <div className="min-h-screen md:ml-64 bg-slate-50 p-6 md:p-10 space-y-8">
//       <header>
//         <h1 className="text-3xl font-bold text-slate-900">Enrollment Hub</h1>
//         <p className="text-slate-500">Manage student seats, billing, and access codes.</p>
//       </header>

//       {/* BALANCE & QUICK PURCHASE ROW */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Wallet Balance */}
//         <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl flex items-center justify-between">
//             <div>
//                 <p className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Voucher Balance</p>
//                 <p className="text-4xl font-black">{stats?.voucher_balance || 0}</p>
//                 <p className="text-[10px] mt-2 opacity-50 italic">Available student seats</p>
//             </div>
//             <div className="p-4 bg-white/10 rounded-2xl">
//                 <Ticket size={32} />
//             </div>
//         </div>

//         {/* Purchase Options */}
//         <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 flex flex-col justify-center">
//             <div className="flex items-center gap-2 mb-4">
//                 <CreditCard size={18} className="text-indigo-600" />
//                 <h3 className="font-bold text-slate-800">Top Up Credits</h3>
//             </div>
//             <div className="grid grid-cols-2 gap-4">
//                 <button onClick={() => handleBuyCredits(50)} className="p-4 rounded-2xl border-2 border-slate-50 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left">
//                     <p className="text-lg font-black text-slate-900">50 Seats</p>
//                     <p className="text-xs font-bold text-slate-500">1,000 ETB</p>
//                 </button>
//                 <button onClick={() => handleBuyCredits(100)} className="p-4 rounded-2xl border-2 border-slate-50 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left">
//                     <p className="text-lg font-black text-slate-900">100 Seats</p>
//                     <p className="text-xs font-bold text-slate-500">2,000 ETB</p>
//                 </button>
//             </div>
//         </div>
//       </div>

//       {/* ANALYTICS ROW */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <QuickStat label="Active Codes" value={stats?.available_to_redeem || 0} icon={<Zap />} color="text-amber-600" />
//         <QuickStat label="Total Redeemed" value={stats?.redeemed || 0} icon={<Check />} color="text-green-600" />
//         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
//             <div className="flex justify-between items-center mb-2">
//                 <span className="text-sm font-bold text-slate-500 uppercase tracking-tighter">Usage Rate</span>
//                 <span className="text-lg font-black text-indigo-600">{stats?.usage_rate.toFixed(1)}%</span>
//             </div>
//             <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
//                 <motion.div initial={{ width: 0 }} animate={{ width: `${stats?.usage_rate}%` }} className="h-full bg-indigo-600" />
//             </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* GENERATOR FORM */}
//         <section className="lg:col-span-1">
//           <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 sticky top-24">
//             <div className="flex items-center gap-3 mb-6">
//               <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Plus size={20}/></div>
//               <h2 className="text-xl font-bold">Generate Vouchers</h2>
//             </div>
//             <form onSubmit={handleGenerate} className="space-y-6">
//               <div>
//                 <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
//                 <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} required>
//                   <option value="">Select Department...</option>
//                   {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-bold text-slate-700 mb-2">Quantity ({batchCount})</label>
//                 <input type="range" min="1" max="50" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" value={batchCount} onChange={(e) => setBatchCount(parseInt(e.target.value))} />
//               </div>
//               <button type="submit" disabled={isGenerating} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2">
//                 {isGenerating ? <Loader2 className="animate-spin" size={20}/> : <Ticket size={20}/>}
//                 Generate Vouchers
//               </button>
//             </form>
//           </div>
//         </section>

//         {/* TABBED LISTS (Vouchers vs Billing) */}
//         <section className="lg:col-span-2">
//           <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
//             <div className="flex border-b border-slate-100">
//                 <button 
//                   onClick={() => setActiveTab('vouchers')}
//                   className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'vouchers' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
//                 >
//                     Voucher Inventory
//                 </button>
//                 <button 
//                   onClick={() => setActiveTab('billing')}
//                   className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'billing' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
//                 >
//                     Billing History
//                 </button>
//             </div>

//             <div className="p-4">
//                 {activeTab === 'vouchers' ? (
//                    <VoucherTable vouchers={vouchers} copiedCode={copiedCode} copyToClipboard={copyToClipboard} />
//                 ) : (
//                    <BillingTable transactions={transactions} />
//                 )}
//             </div>
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }


// function QuickStat({ label, value, icon, color }: any) {
//   return (
//       <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
//           <div className={`p-4 rounded-2xl bg-slate-50 ${color}`}>{icon}</div>
//           <div>
//               <p className="text-2xl font-black text-slate-900">{value || 0}</p>
//               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
//           </div>
//       </div>
//   );
// }






// import { useState, useEffect } from 'react';
// import apiClient from '../api/client';
// import { Ticket, Plus, Copy, Check, Download, Loader2, Search, Filter } from 'lucide-react';
// import { motion, AnimatePresence } from 'motion/react';
// import { toast } from 'sonner';
 

// interface Voucher {
//   id: number;
//   code: string;
//   department_name: string;
//   is_redeemed: boolean;
//   redeemed_by_email: string | null;
//   voucher_balance: number;
//   created_at: string;

// }

// interface Department {
//   id: number;
//   name: string;
// }

// export function AdminVouchers() {
//   const [vouchers, setVouchers] = useState<Voucher[]>([]);
//   const [departments, setDepartments] = useState<Department[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [isGenerating, setIsSubmitting] = useState(false);
//   const [copiedCode, setCopiedCode] = useState<string | null>(null);
   

//   // Form State
//   const [batchCount, setBatchCount] = useState(10);
//   const [selectedDept, setSelectedDept] = useState('');
//   const [stats, setStats] = useState<any>(null);

//   useEffect(() => {
//     fetchData();
//   }, []);

  // const fetchData = async () => {
  //   try {
  //     const [vRes, dRes, sRes] = await Promise.all([
        
  //       apiClient.get('/vouchers/'),
  //       apiClient.get('/departments/'),
  //       apiClient.get('/vouchers/analytics/')
  //     ]);

  //     setVouchers(vRes.data);
  //     setDepartments(dRes.data);
  //     setStats(sRes.data);
  //     console.log("Voucher stats:", dRes.data);

  //   } catch (err) {
  //     toast.error("Failed to load voucher data");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

//   const handleGenerate = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedDept) return toast.error("Please select a department");
    
//     setIsSubmitting(true);
//     try {
//       await apiClient.post('/vouchers/generate/', {
//         count: batchCount,
//         department_id: selectedDept
//       });
//       toast.success(`Generated ${batchCount} new vouchers!`);
//       fetchData(); 
     
//     } catch (err) {
//       toast.error("Generation failed");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const copyToClipboard = (code: string) => {
//     navigator.clipboard.writeText(code);
//     setCopiedCode(code);
//     setTimeout(() => setCopiedCode(null), 2000);
//     toast.info("Code copied to clipboard");
//   };

//   if (loading) return <div className="flex h-screen items-center justify-center md:ml-64"><Loader2 className="animate-spin text-indigo-600" /></div>;

//   return (
//     <div className="min-h-screen md:ml-64 bg-slate-50 p-6 md:p-10">
//       <header className="mb-10">
//         <h1 className="text-3xl font-bold text-slate-900">Voucher Management</h1>
//         <p className="text-slate-500">Generate and track access codes for your students.</p>
//       </header>

//       <div className="bg-indigo-900 text-white mb-4 p-6 rounded-3xl shadow-xl flex items-center justify-between">
//           <div>
//               <p className="text-xs font-bold opacity-70 uppercase tracking-widest">Vouchr Balance</p>
//               <p className="text-3xl font-black"> {stats?.voucher_balance || 0}</p>
//           </div>
//           <div className="p-3 bg-white/10 rounded-2xl">
//               <Ticket size={24} />
//           </div>
//       </div>

//       {/* 1. ANALYTICS ROW */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
//         <QuickStat label="Available Licenses" value={stats?.available_to_redeem|| 0} icon={<Ticket />} color="text-blue-600" />
//         <QuickStat label="Students Joined" value={stats?.redeemed} color="text-green-600" />
//         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
//             <div className="flex justify-between items-center mb-2">
//                 <span className="text-sm font-bold text-slate-500">USAGE RATE</span>
//                 <span className="text-lg font-black text-indigo-600">{stats?.usage_rate.toFixed(1)}%</span>
//             </div>
//             <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
//                 <motion.div 
//                     initial={{ width: 0 }} animate={{ width: `${stats?.usage_rate}%` }}
//                     className="h-full bg-indigo-600" 
//                 />
//             </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
//         {/* 1. GENERATOR FORM */}
//         <section className="lg:col-span-1">
//           <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 sticky top-24">
//             <div className="flex items-center gap-3 mb-6">
//               <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Plus size={20}/></div>
//               <h2 className="text-xl font-bold">Generate Batch</h2>
//             </div>

//             <form onSubmit={handleGenerate} className="space-y-6">
//               <div>
//                 <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
//                 <select 
//                   className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none"
//                   value={selectedDept}
//                   onChange={(e) => setSelectedDept(e.target.value)}
//                   required
//                 >
//                   <option value="">Select Department...</option>
//                   {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-bold text-slate-700 mb-2">Number of Vouchers ({batchCount})</label>
//                 <input 
//                   type="range" min="1" max="50" 
//                   className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
//                   value={batchCount}
//                   onChange={(e) => setBatchCount(parseInt(e.target.value))}
//                 />
//                 <div className="flex justify-between text-xs text-slate-400 mt-2">
//                   <span>1</span><span>25</span><span>50</span>
//                 </div>
//               </div>

//               <button 
//                 type="submit"
//                 disabled={isGenerating}
//                 className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
//               >
//                 {isGenerating ? <Loader2 className="animate-spin" size={20}/> : <Ticket size={20}/>}
//                 Generate Codes
//               </button>
//             </form>
//           </div>
//         </section>

//         {/* 2. VOUCHER LIST */}
//         <section className="lg:col-span-2">
//           <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
//             <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
//               <div className="relative flex-1 max-w-xs">
//                 <Search className="absolute left-3 top-3 text-slate-400" size={18} />
//                 <input 
//                   placeholder="Search code..." 
//                   className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl w-full text-sm outline-none focus:ring-2 ring-indigo-100"
//                 />
//               </div>
//               <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-500"><Download size={20}/></button>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="w-full text-left border-collapse">
//                 <thead>
//                   <tr className="bg-slate-50/50">
//                     <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Code</th>
//                     <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Department</th>
//                     <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
//                     <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-50">
//                   {vouchers.map((v) => (
//                     <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group">
//                       <td className="p-4 font-mono font-bold text-slate-700">{v.code}</td>
//                       <td className="p-4 text-sm text-slate-600">{v.department_name}</td>
//                       <td className="p-4">
//                         {v.is_redeemed ? (
//                           <div className="flex flex-col">
//                             <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
//                               <Check size={12} /> REDEEMED
//                             </span>
//                             <span className="text-[10px] text-slate-400">{v.redeemed_by_email}</span>
//                           </div>
//                         ) : (
//                           <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
//                             AVAILABLE
//                           </span>
//                         )}
//                       </td>
//                       <td className="p-4 text-right">
//                         {!v.is_redeemed && (
//                           <button 
//                             onClick={() => copyToClipboard(v.code)}
//                             className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
//                           >
//                             {copiedCode === v.code ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
//                           </button>
//                         )}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//               {vouchers.length === 0 && (
//                 <div className="p-20 text-center text-slate-400">
//                   <Ticket size={48} className="mx-auto mb-4 opacity-20" />
//                   <p>No vouchers generated yet.</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </section>
//       </div>
//     </div>
//   );

//   function QuickStat({ label, value, icon, color }: any) {
//     return (
//         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
//             <div className={`p-4 rounded-2xl bg-slate-50 ${color}`}>{icon}</div>
//             <div>
//                 <p className="text-2xl font-black text-slate-900">{value || 0}</p>
//                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
//             </div>
//         </div>
//     );
// }

// }
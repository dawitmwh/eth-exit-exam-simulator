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
import { motion, AnimatePresence } from 'motion/react';
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

 
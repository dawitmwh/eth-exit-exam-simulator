import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Ticket, Plus, Copy, Check, Download, Loader2, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Voucher {
  id: number;
  code: string;
  department_name: string;
  is_redeemed: boolean;
  redeemed_by_email: string | null;
  created_at: string;
}

interface Department {
  id: number;
  name: string;
}

export function AdminVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [batchCount, setBatchCount] = useState(10);
  const [selectedDept, setSelectedDept] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vRes, dRes, sRes] = await Promise.all([
        apiClient.get('/core/vouchers/'),
        apiClient.get('/core/departments/'),
        apiClient.get('/core/vouchers/analytics/')
      ]);

      setVouchers(vRes.data);
      setDepartments(dRes.data);
      setStats(sRes.data);

    } catch (err) {
      toast.error("Failed to load voucher data");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return toast.error("Please select a department");
    
    setIsSubmitting(true);
    try {
      await apiClient.post('/core/vouchers/generate/', {
        count: batchCount,
        department_id: selectedDept
      });
      toast.success(`Generated ${batchCount} new vouchers!`);
      fetchData(); // Refresh list
    } catch (err) {
      toast.error("Generation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.info("Code copied to clipboard");
  };

  if (loading) return <div className="flex h-screen items-center justify-center md:ml-64"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen md:ml-64 bg-slate-50 p-6 md:p-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Voucher Management</h1>
        <p className="text-slate-500">Generate and track access codes for your students.</p>
      </header>

      {/* 1. ANALYTICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickStat label="Total Licenses" value={stats?.total} icon={<Ticket />} color="text-blue-600" />
        <QuickStat label="Students Joined" value={stats?.redeemed} color="text-green-600" />
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-slate-500">USAGE RATE</span>
                <span className="text-lg font-black text-indigo-600">{stats?.usage_rate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${stats?.usage_rate}%` }}
                    className="h-full bg-indigo-600" 
                />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 1. GENERATOR FORM */}
        <section className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 sticky top-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Plus size={20}/></div>
              <h2 className="text-xl font-bold">Generate Batch</h2>
            </div>

            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  required
                >
                  <option value="">Select Department...</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Number of Vouchers ({batchCount})</label>
                <input 
                  type="range" min="1" max="50" 
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  value={batchCount}
                  onChange={(e) => setBatchCount(parseInt(e.target.value))}
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>1</span><span>25</span><span>50</span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isGenerating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20}/> : <Ticket size={20}/>}
                Generate Codes
              </button>
            </form>
          </div>
        </section>

        {/* 2. VOUCHER LIST */}
        <section className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  placeholder="Search code..." 
                  className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl w-full text-sm outline-none focus:ring-2 ring-indigo-100"
                />
              </div>
              <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-500"><Download size={20}/></button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Code</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Department</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {vouchers.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 font-mono font-bold text-slate-700">{v.code}</td>
                      <td className="p-4 text-sm text-slate-600">{v.department_name}</td>
                      <td className="p-4">
                        {v.is_redeemed ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
                              <Check size={12} /> REDEEMED
                            </span>
                            <span className="text-[10px] text-slate-400">{v.redeemed_by_email}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                            AVAILABLE
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {!v.is_redeemed && (
                          <button 
                            onClick={() => copyToClipboard(v.code)}
                            className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                          >
                            {copiedCode === v.code ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {vouchers.length === 0 && (
                <div className="p-20 text-center text-slate-400">
                  <Ticket size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No vouchers generated yet.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  function QuickStat({ label, value, icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-4 rounded-2xl bg-slate-50 ${color}`}>{icon}</div>
            <div>
                <p className="text-2xl font-black text-slate-900">{value || 0}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
            </div>
        </div>
    );
}

}
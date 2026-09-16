import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import apiClient from '../../api/client';
import { 
  BarChart3, Building2, Users, CreditCard, 
  ShieldCheck, ArrowUpRight, Loader2, Power, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

export function OwnerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();

  // Form State for New University
  const [formData, setFormData] = useState({
    name: '', slug: '', admin_email: '', admin_password: '', admin_name: '', admin_password_confirm: ''
  });

  const fetchData = async () => {
    try {
      const res = await apiClient.get('/owner/dashboard/');
      setData(res.data);
    } catch (error) {
      toast.error("Owner Session Expired");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- 1. TOGGLE STATUS LOGIC ---
  const handleToggleStatus = async (id: number) => {
    try {
      await apiClient.post(`/owner/institutions/${id}/toggle-status/`);
      toast.success("Institutional access modified");
      fetchData(); // Refresh list to show new status
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleAddUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/core/owner/register-university/', formData);
      toast.success("University and Admin Provisioned!");
      setIsAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Registration failed");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-emerald-200 p-6 md:p-12 space-y-10">
      
      {/* HEADER */}
      <header className="flex justify-between items-end">
        <div>
           <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest mb-2">
              <ShieldCheck size={14} /> Master Administrator
           </div>
           <h1 className="text-4xl font-black text-slate-900">Platform <span className="text-emerald-600">Overview.</span></h1>
        </div>
        <div className="text-right">
           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Global Revenue</p>
           <p className="text-4xl font-black text-slate-900">{data.platform_stats.total_revenue.toLocaleString()} ETB</p>
        </div>
      </header>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <OwnerStat label="Institutions" value={data.platform_stats.total_institutions} icon={<Building2 />} color="bg-blue-500" />
        <OwnerStat label="Total Scholars" value={data.platform_stats.total_students} icon={<Users />} color="bg-emerald-500" />
        <OwnerStat label="Vouchers Active" value={data.platform_stats.active_vouchers} icon={<CreditCard />} color="bg-amber-500" />
      </div>

      {/* INSTITUTIONAL LEDGER */}
      <section className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-primary/5">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Tenant Directory</h2>
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
            >
                <Plus size={18} /> Add University
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] bg-slate-50/50">
                <th className="p-8">University Identity</th>
                <th className="p-8">Credit Bank</th>
                <th className="p-8">Active Users</th>
                <th className="p-8">Gate Status</th>
                <th className="p-8 text-right">Kill Switch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.institutions.map((uni: any) => (
                <tr key={uni.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="p-8">
                    <p className="font-bold text-slate-900 text-lg">{uni.name}</p>
                    <p className="text-xs font-mono text-slate-400">{uni.slug}.exitexam.com</p>
                  </td>
                  <td className="p-8 font-black text-indigo-600 text-xl">{uni.voucher_balance}</td>
                  <td className="p-8 font-bold text-slate-600">{uni.student_count} Students</td>
                  <td className="p-8">
                     <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest ${uni.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                        {uni.is_active ? 'SYSTEM ONLINE' : 'PORTAL LOCKED'}
                     </span>
                  </td>
                  <td className="p-8 text-right">
                    <button 
                      onClick={() => handleToggleStatus(uni.id)}
                      className={`p-4 rounded-2xl transition-all ${uni.is_active ? 'bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white' : 'bg-emerald-500 text-white'}`}
                      title={uni.is_active ? "Suspend Access" : "Restore Access"}
                    >
                      <Power size={20}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- ADD UNIVERSITY MODAL --- */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl rounded-[40px] p-10 border-none bg-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-slate-900 mb-6">Onboard New Tenant</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUniversity} className="grid grid-cols-2 gap-6">
            <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">University Name</label>
                <input required className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Subdomain Slug</label>
                <input required className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase()})} />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Admin Display Name</label>
                <input required className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" onChange={e => setFormData({...formData, admin_name: e.target.value})} />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Admin Email</label>
                <input type="email" required className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" onChange={e => setFormData({...formData, admin_email: e.target.value})} />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Root Password</label>
                <input type="password" required className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" onChange={e => setFormData({...formData, admin_password: e.target.value})} />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Confirm Root Password</label>
                <input type="password" required className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" onChange={e => setFormData({...formData, admin_password_confirm: e.target.value})} />
            </div>
            <div className="col-span-2 pt-6">
                <Button className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg">
                    Provision Infrastructure
                </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OwnerStat({ label, value, icon, color }: any) {
    return (
        <Card className="p-8 border-none shadow-xl shadow-emerald-900/5 rounded-[40px] bg-white group hover:scale-[1.02] transition-all">
            <div className={`w-14 h-14 rounded-2xl ${color} text-white flex items-center justify-center mb-6 shadow-lg shadow-current/20 group-hover:rotate-6 transition-transform`}>
                {icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <h3 className="text-4xl font-black text-slate-900 mt-1">{value}</h3>
        </Card>
    );
}
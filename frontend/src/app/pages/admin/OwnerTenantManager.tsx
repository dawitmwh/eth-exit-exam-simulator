import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { 
  Building2, Users, Ticket, Power, 
  ExternalLink, Search, Loader2, Plus, 
  ShieldAlert, TrendingUp, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export function OwnerTenantManager() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchTenants(); }, []);

  const fetchTenants = async () => {
    try {
      const res = await apiClient.get('/owner/institutions/');
      setTenants(res.data);
    } catch (err) {
      toast.error("Failed to fetch institutional directory");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      await apiClient.post(`/owner/institutions/${id}/toggle-status/`);
      toast.success("Institutional status updated");
      fetchTenants();
    } catch (err) { toast.error("Update failed"); }
  };

  const handleAddCredits = async (id: number) => {
    const amount = window.prompt("Enter credit amount to add:");
    if (!amount) return;
    try {
      await apiClient.post(`/owner/institutions/${id}/add_credits/`, { amount });
      toast.success("Credits injected successfully");
      fetchTenants();
    } catch (err) { toast.error("Credit injection failed"); }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-violet-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-primary p-6 md:p-12 space-y-10">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <p className="text-[10px] font-black text-violet-600 uppercase tracking-[0.3em] mb-2">Registry Division</p>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight">Institutional <span className="text-violet-600">Tenants.</span></h1>
           <p className="text-slate-500 font-medium mt-2">Oversee university workspaces and license distribution.</p>
        </div>
        
        <div className="relative w-full md:max-w-xs">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <input 
             placeholder="Search university..." 
             className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 ring-violet-500/20 font-bold text-slate-700"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </header>

      {/* TABLE */}
      <section className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-indigo-900/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="p-8">University & Portal</th>
                <th className="p-8">Seat Balance</th>
                <th className="p-8">Usage</th>
                <th className="p-8">Status</th>
                <th className="p-8 text-right">Operation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTenants.map((uni) => (
                <tr key={uni.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black">
                          {uni.name.charAt(0)}
                       </div>
                       <div>
                          <p className="font-black text-slate-900 leading-none mb-1">{uni.name}</p>
                          <a href={`http://${uni.slug}.localhost:5173`} target="_blank" className="text-xs font-bold text-violet-500 flex items-center gap-1 hover:underline">
                             {uni.slug}.exitexam.com <ExternalLink size={10} />
                          </a>
                       </div>
                    </div>
                  </td>
                  
                  <td className="p-8">
                     <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-slate-900">{uni.voucher_balance}</span>
                        <button 
                            onClick={() => handleAddCredits(uni.id)}
                            className="p-1.5 bg-slate-100 rounded-lg text-slate-400 hover:bg-violet-600 hover:text-white transition-all"
                        >
                            <Plus size={14} />
                        </button>
                     </div>
                  </td>

                  <td className="p-8">
                     <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                        <Users size={16} className="text-slate-300" />
                        {uni.student_count} Students
                     </div>
                  </td>

                  <td className="p-8">
                     <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest ${uni.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                        {uni.is_active ? 'ACTIVE' : 'SUSPENDED'}
                     </span>
                  </td>

                  <td className="p-8 text-right">
                    <button 
                        onClick={() => toggleStatus(uni.id)}
                        className={`p-3 rounded-2xl transition-all ${uni.is_active ? 'bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white' : 'bg-emerald-50 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}
                        title={uni.is_active ? "Suspend University" : "Activate University"}
                    >
                        <Power size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTenants.length === 0 && (
             <div className="p-20 text-center text-slate-400 font-medium italic">No matching institutions found.</div>
          )}
        </div>
      </section>
    </div>
  );
}
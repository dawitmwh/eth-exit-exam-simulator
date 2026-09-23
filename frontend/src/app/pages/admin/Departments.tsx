import { useEffect, useState, useMemo } from 'react';
import apiClient from '../../api/client';
import { 
  Plus, Trash2, Edit2, Tag, ChevronRight, Check, X, 
  Layers, LayoutGrid, Loader2, Info, BookOpen, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
//import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';

// --- TYPES ---
type Dept = {
  id: number;
  name: string;
  category: string;
  competencies_count?: number;
};

type Competency = {
  id: number;
  name: string;
  question_count?: number;
};

// Must match your Django Category.choices exactly
const SYSTEM_CATEGORIES = [
  { id: 'MMGMT', label: 'Marketing Management' },
    
];

export function DepartmentsManager() {
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loadingCompetencies, setLoadingCompetencies] = useState(false);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Dept | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');

  const selectedDept = useMemo(
    () => departments.find((d) => d.id === selectedId) ?? null,
    [departments, selectedId]
  );

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedId !== null) fetchCompetencies(selectedId);
  }, [selectedId]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/departments/');
      // Expect array of { id, name, description, competencies_count? }
       
      setDepartments(res.data);
      console.log("DEP:", res.data)
      if (res.data.length > 0 && selectedId === null) setSelectedId(res.data[0].id);
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetencies = async (deptId: number) => {
    setLoadingCompetencies(true);
    try {
      const res = await apiClient.get(`/departments/${deptId}/competency-areas/`);
      setCompetencies(res.data);
    } catch (err) {
      toast.error('Failed to sync subject library');
    } finally {
      setLoadingCompetencies(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCategory) return toast.error('Required fields missing');

    const payload = { name: formName.trim(), category: formCategory };

    try {
      if (editingDept) {
        await apiClient.put(`/departments/${editingDept.id}/`, payload);
        toast.success('Faculty settings updated');
      } else {
        const res = await apiClient.post('/departments/', payload);
        setSelectedId(res.data.id);
        toast.success('New Faculty added to portal');
      }
      setIsFormOpen(false);
      fetchDepartments();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Check your department constraints";
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure? This will remove student access to this department.")) return;
    try {
      await apiClient.delete(`/departments/${id}/`);
      toast.success("Department removed");
      fetchDepartments();
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      toast.error("Deletion failed");
    }
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center md:ml-64"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 space-y-8">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Faculty Architecture</h1>
          <p className="text-slate-500 font-medium">Manage institutional departments and curriculum mappings.</p>
        </div>
        <Button 
          onClick={() => { setEditingDept(null); setFormName(''); setFormCategory(''); setIsFormOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-8 h-14 font-black shadow-lg shadow-indigo-100"
        >
          <Plus size={20} className="mr-2" /> Add Faculty
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: FACULTY LIST */}
        <section className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                   <LayoutGrid size={18} className="text-indigo-600" /> Active Faculties
                </h3>
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">{departments.length}</Badge>
             </div>
             <div className="divide-y divide-slate-50">
                {departments.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    className={`w-full text-left p-6 transition-all flex items-center justify-between group ${selectedId === d.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-xl transition-colors ${selectedId === d.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                          <Layers size={18} />
                       </div>
                       <div>
                          <p className={`font-bold ${selectedId === d.id ? 'text-indigo-900' : 'text-slate-700'}`}>{d.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.category}</p>
                       </div>
                    </div>
                    <ChevronRight size={16} className={`${selectedId === d.id ? 'text-indigo-400' : 'text-slate-200'} group-hover:translate-x-1 transition-transform`} />
                  </button>
                ))}
                {departments.length === 0 && (
                  <div className="p-10 text-center text-slate-400 italic text-sm">No departments created yet.</div>
                )}
             </div>
          </div>
        </section>

        {/* RIGHT: CURRICULUM WORKSPACE */}
        <section className="lg:col-span-2">
           <AnimatePresence mode="wait">
              {selectedDept ? (
                <motion.div 
                    key={selectedId} 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 md:p-10"
                >
                   {/* Workspace Header */}
                   <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                           <Badge className="bg-emerald-50 text-emerald-700 border-none px-3 font-bold text-[10px] uppercase tracking-widest">
                               Active Faculty
                           </Badge>
                           <Badge className="bg-indigo-50 text-indigo-600 border-none px-3 font-bold text-[10px] uppercase tracking-widest">
                               {selectedDept.category} Curriculum
                           </Badge>
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">{selectedDept.name}</h2>
                      </div>
                      
                      <div className="flex gap-2">
                         <button 
                            onClick={() => { setEditingDept(selectedDept); setFormName(selectedDept.name); setFormCategory(selectedDept.category); setIsFormOpen(true); }}
                            className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                            title="Edit Faculty"
                         >
                            <Edit2 size={20}/>
                         </button>
                         <button 
                            onClick={() => handleDelete(selectedDept.id)}
                            className="p-4 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                            title="Delete Faculty"
                         >
                            <Trash2 size={20}/>
                         </button>
                      </div>
                   </div>

                   {/* Subject Inventory (Unlocked by Category) */}
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Unlocked Competency Library</h4>
                         <span className="text-xs font-bold text-slate-400">{competencies.length} Modules</span>
                      </div>

                      {loadingCompetencies ? (
                        <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-200" size={40} /></div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {competencies.map(c => (
                             <div key={c.id} className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-indigo-900/5 transition-all cursor-default">
                                <div className="flex items-center gap-4">
                                   <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600"><BookOpen size={18}/></div>
                                   <span className="font-bold text-slate-700">{c.name}</span>
                                </div>
                                <Badge variant="outline" className="bg-white border-slate-200 text-slate-400 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                                    {c.question_count ?? 0} Qs
                                </Badge>
                             </div>
                           ))}
                        </div>
                      )}
                      
                      {!loadingCompetencies && competencies.length === 0 && (
                        <div className="p-12 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 text-center">
                           <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                              <AlertCircle className="text-slate-300" size={32} />
                           </div>
                           <p className="text-slate-900 font-bold">No Curriculum Mapping Found</p>
                           <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">There are no global exam books currently mapped to the <span className="text-indigo-600 font-bold">{selectedDept.category}</span> category.</p>
                        </div>
                      )}
                   </div>
                </motion.div>
              ) : (
                <div className="h-96 bg-white rounded-[32px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <Info size={48} className="mb-4 opacity-20" />
                    <p className="font-medium italic">Select a faculty from the list to manage curriculum</p>
                </div>
              )}
           </AnimatePresence>
        </section>
      </div>

      {/* --- SLIDE-UP MODAL FORM --- */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-indigo-950/30">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 w-full max-w-lg border border-white/20"
            >
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {editingDept ? 'Refine Faculty' : 'Establish New Faculty'}
                    </h3>
                    <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Faculty Name</label>
                        <input 
                            value={formName} 
                            onChange={e => setFormName(e.target.value)}
                            placeholder="e.g. Faculty of Clinical Medicine"
                            className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700"
                            required
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Master Curriculum Category</label>
                        <select 
                            value={formCategory}
                            onChange={e => setFormCategory(e.target.value)}
                            className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 appearance-none"
                            required
                        >
                            <option value="">Choose global category...</option>
                            {SYSTEM_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                        </select>
                        <p className="text-[10px] text-indigo-500 font-bold mt-2 ml-1 italic">
                           * This mapping determines which standardized exam books are unlocked for your students.
                        </p>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} className="flex-1 h-16 rounded-2xl font-bold">Abort</Button>
                        <Button type="submit" className="flex-1 h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100">
                           {editingDept ? 'Update Details' : 'Finalize Faculty'}
                        </Button>
                    </div>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- STANDARD UI ATOM ---
function Button({ children, className, variant = 'primary', ...props }: any) {
  const base = "inline-flex items-center justify-center transition-all active:scale-95 disabled:opacity-50";
  const variants: any = {
    primary: "bg-indigo-600 text-white",
    ghost: "bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100",
    outline: "border-2 border-slate-100 text-slate-600 hover:border-indigo-600 hover:text-indigo-600"
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
}

export default DepartmentsManager;
 
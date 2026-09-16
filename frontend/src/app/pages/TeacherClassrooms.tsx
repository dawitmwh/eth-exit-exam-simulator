import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { 
  Users, Plus, Copy, Check, School, 
  ChevronRight, Loader2, Search, Target, 
  Trophy, AlertCircle, Trash2, ArrowUpRight, Star 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';


// --- TYPES ---
interface Classroom {
  id: number;
  name: string;
  code: string;
  student_count: number;
  created_at: string;
}

interface StudentPerformance {
  student_name: string;
  email: string;
  avg_score: number;
  exams_completed: number;
}

export function TeacherClassrooms() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [performance, setPerformance] = useState<StudentPerformance[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
 
  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const res = await apiClient.get('/teacher/classrooms/');
      setClassrooms(res.data);
      if (res.data.length > 0 && !selectedClass) handleSelectClass(res.data[0]);
    } catch (err) {
      toast.error("Failed to load your classrooms");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClass = async (cls: Classroom) => {
    setSelectedClass(cls);
    setLoadingDetails(true);
    try {
      //const res = await apiClient.get(`/teacher/classrooms/${cls.id}/student_performance/`);
      const [perfRes, analRes] = await Promise.all([
      apiClient.get(`/teacher/classrooms/${cls.id}/student_performance/`),
      apiClient.get(`/curriculum-analysis/${cls.id}/curriculum_analysis/`)
    ]);

    setPerformance(perfRes.data);
    setAnalysis(analRes.data);

    } catch (err) {
      toast.error("Failed to load student data");
    } finally {
      setLoadingDetails(false);
    }
  };


const handleCreateClass = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const res = await apiClient.post('/teacher/classrooms/', { name: newClassName });
    toast.success(`Classroom '${newClassName}' is now live!`);
    
    // mmediately show the new code to the teacher
    alert(`Success! Share this code with your students: ${res.data.code}`);
    
    setIsCreateModalOpen(false);
    setNewClassName('');
    fetchClassrooms(); // Refresh the list
  } catch (err) {
    toast.error("Failed to create classroom.");
  }
};

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.info("Invite code copied to clipboard");
  };

  if (loading) return <div className="h-screen flex items-center justify-center md:ml-64"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;
  
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-10 space-y-8 font-sans">
      
      {/* 1. HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
              <School size={14} /> Faculty Mentorship
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight">Your <span className="text-indigo-600">Classrooms.</span></h1>
        </div>
        <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-8 font-black shadow-lg shadow-indigo-100"
        >
          <Plus size={20} className="mr-2" /> Create New Class
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. CLASSROOM LIST (Left Rail) */}
        <section className="lg:col-span-1 space-y-4">
           {classrooms.map((cls) => (
             <motion.div 
               key={cls.id}
               whileHover={{ x: 5 }}
               onClick={() => handleSelectClass(cls)}
               className={`p-6 rounded-[32px] cursor-pointer border-2 transition-all ${
                 selectedClass?.id === cls.id 
                 ? 'bg-white border-indigo-600 shadow-xl shadow-indigo-900/5' 
                 : 'bg-white border-transparent shadow-sm hover:border-slate-200'
               }`}
             >
                <div className="flex justify-between items-start mb-4">
                   <div className={`p-3 rounded-2xl ${selectedClass?.id === cls.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Users size={20} />
                   </div>
                   <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold">
                      {cls.student_count} Students
                   </Badge>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{cls.name}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   Created {new Date(cls.created_at).toLocaleDateString()}
                </p>

                <div className="mt-6 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Invite Code</span>
                      <span className="font-mono font-bold text-indigo-600">{cls.code}</span>
                   </div>
                   <button 
                     onClick={(e) => { e.stopPropagation(); copyInviteCode(cls.code); }}
                     className="p-2 hover:bg-white rounded-lg transition-all"
                   >
                      {copiedCode === cls.code ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-slate-400" />}
                   </button>
                </div>
             </motion.div>
           ))}
        </section>

        {/* 3. PERFORMANCE WORKSPACE (Right Pane) */}
        <section className="lg:col-span-2">
           <AnimatePresence mode="wait">
              {selectedClass ? (
                <motion.div 
                  key={selectedClass.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 md:p-10"
                >
                   <div className="flex justify-between items-center mb-10">
                      <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedClass.name}</h2>
                        <p className="text-slate-500 font-medium mt-1 text-sm">Detailed student performance audit</p>
                      </div>
                      <div className="flex gap-2">
                         <button className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"><Trash2 size={20}/></button>
                      </div>
                   </div>
                  {/* <section className="mb-12">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Curriculum Trouble-Spots</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {analysis.map((item, idx) => {
                        const isCritical = item.class_avg < 50;
                        return (
                          <motion.div 
                            key={idx}
                            whileHover={{ y: -5 }}
                            className={`p-6 rounded-[24px] border-2 transition-all ${
                              isCritical ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100 shadow-sm'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className={`p-2 rounded-lg ${isCritical ? 'bg-rose-500 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                  {isCritical ? <AlertCircle size={18} /> : <Target size={18} />}
                              </div>
                              <Badge className={isCritical ? 'bg-rose-500 text-white border-none' : 'bg-indigo-50 text-indigo-700'}>
                                  {item.class_avg.toFixed(0)}%
                              </Badge>
                            </div>
                            <p className="font-bold text-slate-900 text-sm leading-tight mb-2">{item.competency_area__name}</p>
                            <p className={`text-[10px] font-black uppercase ${isCritical ? 'text-rose-400' : 'text-slate-400'}`}>
                              {isCritical ? 'Priority Review Required' : 'On Track'}
                            </p>
                          </motion.div>
                        );
                      })}
                      {analysis.length === 0 && !loadingDetails && (
                        <div className="col-span-3 py-10 text-center text-slate-400 italic text-xs">
                            No exam data available for curriculum analysis.
                        </div>
                      )}
                    </div>
                  </section> */}
                   
                  <section className="mb-12 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Classroom Curriculum Health</h3>
                      <Badge className="bg-indigo-50 text-indigo-600 border-none">Live Analysis</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {analysis.map((item, idx) => {
                        const isWeak = item.class_avg < 60;
                        const isFullMock = item.competency_area__name === null;
                        const displayName = isFullMock ? "Comprehensive Exit Mock" : item.competency_area__name;

                        return (
                          <Card key={idx} className={`p-6 border-none shadow-xl shadow-indigo-900/5 rounded-[32px] transition-all hover:scale-[1.02] ${isFullMock ? 'ring-2 ring-amber-400 bg-amber-50/30' : ''} ${isWeak ? 'bg-rose-50/50 ring-1 ring-rose-100' : 'bg-white'}`}>
                             <div className="flex justify-between items-start mb-6">
                              <div className={`p-3 rounded-2xl ${isWeak ? 'bg-rose-500 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                               
                                {/* Use a Star for the Mock, otherwise standard icons */}
                                {isFullMock ? <Star size={20} fill="currentColor" /> : (isWeak ? <AlertCircle size={20} /> : <Target size={20} />)}
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class Avg</p>
                                <h4 className={`text-2xl font-black ${isWeak ? 'text-rose-600' : 'text-slate-900'}`}>{item.class_avg.toFixed(0)}%</h4>
                              </div>
                            </div>
                            {/* DISPLAY THE FIXED NAME HERE */}
                            <p className={`font-bold mb-4 ${isFullMock ? 'text-amber-900' : 'text-slate-800'}`}>
                              {displayName}
                            </p>
                                                  
                            <div className="space-y-2">
                              <Progress value={item.class_avg} className={`h-1.5 ${isWeak ? 'bg-rose-200' : 'bg-slate-100'}`} />
                              <p className={`text-[9px] font-black uppercase tracking-tighter ${isWeak ? 'text-rose-400' : 'text-emerald-500'}`}>
                                 {isFullMock ? 'SIMULATOR READINESS' : (isWeak ? 'Immediate Review' : 'Competency Verified')}
                              </p>
                            </div>
                          </Card>
                        );
                      })}
                      
                      {analysis.length === 0 && (
                        <div className="col-span-3 py-10 text-center bg-white rounded-[32px] border border-dashed border-slate-200 text-slate-400 italic text-sm">
                            Awaiting classroom data to generate curriculum heat map.
                        </div>
                      )}
                    </div>
                  </section>

                   {/* PERFORMANCE TABLE */}
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                           <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                              <th className="pb-6 px-4">Student Identity</th>
                              <th className="pb-6 px-4">Exams Done</th>
                              <th className="pb-6 px-4">Avg Accuracy</th>
                              <th className="pb-6 px-4 text-right">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {loadingDetails ? (
                             <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-200" /></td></tr>
                           ) : performance.map((student, idx) => (
                             <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="py-6 px-4">
                                   <p className="font-bold text-slate-900 leading-none mb-1">{student.student_name}</p>
                                   <p className="text-xs text-slate-400">{student.email}</p>
                                </td>
                                <td className="py-6 px-4">
                                   <div className="flex items-center gap-2">
                                      <span className="font-black text-slate-700">{student.exams_completed}</span>
                                      <div className="w-8 h-1 bg-slate-100 rounded-full overflow-hidden">
                                         <div className="h-full bg-indigo-400" style={{ width: `${(student.exams_completed / 10) * 100}%` }} />
                                      </div>
                                   </div>
                                </td>
                                <td className="py-6 px-4">
                                   <span className={`text-lg font-black ${student.avg_score >= 75 ? 'text-emerald-500' : student.avg_score >= 50 ? 'text-indigo-600' : 'text-rose-500'}`}>
                                      {student.avg_score}%
                                   </span>
                                </td>
                                <td className="py-6 px-4 text-right">
                                   {student.avg_score >= 80 ? (
                                      <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 font-bold text-[9px]">EXAM READY</Badge>
                                   ) : (
                                      <Badge className="bg-slate-50 text-slate-400 border-none px-3 font-bold text-[9px]">PRACTICING</Badge>
                                   )}
                                </td>
                             </tr>
                           ))}
                        </tbody>
                      </table>
                      {!loadingDetails && performance.length === 0 && (
                        <div className="p-20 text-center">
                           <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
                           <p className="text-slate-400 font-bold italic">No students have joined this classroom code yet.</p>
                        </div>
                      )}
                   </div>
                </motion.div>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center text-slate-300 italic bg-white rounded-[40px] border border-dashed border-slate-200">
                    <Users size={48} className="mb-4 opacity-20" />
                    <p>Select a classroom to view performance data</p>
                </div>
              )}
           </AnimatePresence>
        </section>
      </div>

      {/* --- CREATE MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-indigo-950/20">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[40px] shadow-2xl p-10 w-full max-w-md">
                <h3 className="text-2xl font-black text-slate-900 mb-8">Launch New Class</h3>
                <form onSubmit={handleCreateClass} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Classroom Name</label>
                        <input 
                            value={newClassName} 
                            onChange={e => setNewClassName(e.target.value)}
                            placeholder="e.g. Nursing Section A - 2026"
                            className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                            required
                        />
                    </div>
                    <div className="flex gap-4 pt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 rounded-2xl font-bold">Abort</Button>
                        <Button type="submit" className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100">Establish Class</Button>
                    </div>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
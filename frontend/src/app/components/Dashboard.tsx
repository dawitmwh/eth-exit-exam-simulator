import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import { 
  Trophy, Target, Clock, ChevronRight, TrendingUp, 
  Brain, Zap, Loader2, Upload, BookOpen, Activity, 
  ShieldCheck, ArrowUpRight , Star, Download, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { ClassroomWidget } from './ClassroomWidget';
import { toast } from 'sonner';

// --- TYPES ---
interface DashboardData {
  university: string;
  department: string;
  overall: {
    avg_score: number | null; 
    total_exams: number;
    ready_score: number;    // FULL MOCK average
  };
  metrics: {
    avg_score: number;
    total_exams: number;
    peer_count: number;
    total_questions: number;
    coverage_percent: number;
    study_time_minutes: number;
  };
  by_competency: Array<{
    competency_area__name: string;
    average_score: number;
    national_avg: number;
  }>;
  history: Array<{
    id: number;
    end_time: string;
    score: number;
    competency_area__name: string;
    correct_answers: number;
    total_questions: number;
  }>;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN';
  const [isExporting, setIsExporting] = useState(false);
  
 

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiClient.get('/dashboard/');
        setData(response.data);
      } catch (error) {
        console.error("Dashboard Sync Failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleExportResults = async () => {
  setIsExporting(true);
  try {
    // 1. Call the Django Export View
    // We must specify 'blob' as the response type to handle file data
    const response = await apiClient.get('/exams/results/export/', {
      responseType: 'blob', 
    });

    // 2. Create a temporary download link in the browser
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Set file name (University Slug + Timestamp)
    const filename = `${user?.university_name?.replace(/\s+/g, '_')}_Results_${new Date().toLocaleDateString()}.csv`;
    link.setAttribute('download', filename);
    
    // 3. Trigger the click and cleanup
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    toast.success("Report downloaded successfully.");
  } catch (error) {
    console.error("Export Error:", error);
    toast.error("Failed to generate report. Ensure you have admin rights.");
  } finally {
    setIsExporting(false);
  }
};

const handleDownloadReport = async () => {
  try {
    toast.info("Generating professional report...");
    const response = await apiClient.get('/exams/reports/institutional-pdf/', {
      responseType: 'blob', // IMPORTANT: Tells axios this is a file, not JSON
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Institutional_Readiness_Report.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    toast.success("Report Generated!");
  } catch (error) {
    toast.error("Failed to generate PDF report.");
  }
};


  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <div className="relative mb-4">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
          <div className="absolute inset-0 blur-xl bg-emerald-400/20 animate-pulse" />
        </div>
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Neural Sync...</p>
      </div>
    );
  }5173

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans selection:bg-emerald-100"> 
      {/* 1. BRANDED HERO HEADER */}
      <header className="bg-emerald-100 text-white relative overflow-hidden">
        <div className="container max-w-7xl mx-auto px-2 py-2 md:py-2 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-red-300 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
               <ShieldCheck size={30} className="fill-current" /> <h1>Welcome to {data?.university} • Secured Session</h1>
            </div>
            <p className="text-2xl md:text-2xl font-black tracking-tighter mb-3 leading-none">
              Administrator:  &nbsp;<span className="text-blue-400">{user?.full_name?.split(' ')[0]}!</span>
            </p>
            
          </motion.div>
        </div>
        {/* Abstract background art */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -ml-20 -mb-20" />
      </header>

      <div className="container max-w-7xl mx-auto px-6 -mt-12 space-y-8 relative z-20 mt-12">
        <div className="flex gap-3">
         <Button 
            variant="outline" 
            onClick={handleExportResults} 
            disabled={isExporting}
            className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest gap-2"
          >
            {isExporting ? <Loader2 className="animate-spin size-4" /> : <Download size={16} />}
            {isExporting ? "Generating..." : "Export Results"}
          </Button>
          <Button 
  onClick={handleDownloadReport}
  className="bg-primary text-primary-foreground gap-2 rounded-2xl h-12 px-6 font-bold shadow-lg"
>
  <FileText size={18} /> Download Readiness Report
</Button>
        </div>

        
        {/* 2. CORE PERFORMANCE METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            label="Readiness Index" 
            value={`${data?.overall.ready_score || 0}%`} 
            icon={<Star className="text-amber-500 fill-current" />} 
            sub="Exit Mock Average"
            color="bg-amber-50"
          />
          
          <MetricCard 
            label="Syllabus Mastery" 
            value={`${data?.metrics.coverage_percent || 0}%`} 
            icon={<BookOpen className="text-emerald-600" />} 
            sub="Question Bank Coverage"
            color="bg-emerald-50"
          />

          <MetricCard 
            label="Topic Average" 
            value={`${data?.overall.avg_score || 0}%`} 
            icon={<Target className="text-indigo-600" />} 
            sub="Focus Area Performance"
            color="bg-indigo-50"
          />

          <MetricCard 
            label="Study Velocity" 
            value={`${data?.metrics.study_time_minutes || 0}m`} 
            icon={<Clock className="text-violet-600" />} 
            sub="Total Practice Time"
            color="bg-violet-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 3. LEFT COLUMN: CORE ACTIONS & HISTORY */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* ACTION & MASTERY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-8 border-none shadow-xl shadow-emerald-900/5 rounded-[40px] bg-white">
                   <div className="space-y-8">
                      {/* Classroom Widget */}
                      <ClassroomWidget />
                    </div>
                </Card>

                <Card className="p-8 border-none shadow-xl shadow-emerald-900/5 rounded-[40px] bg-emerald-600 text-white relative overflow-hidden">
                   <div className="relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Question Bank Performance</p>
                      <h3 className="text-5xl font-black tracking-tighter">{data?.metrics.coverage_percent}%</h3>
                      <div className="h-1.5 w-full bg-white/20 rounded-full mt-6 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${data?.metrics.coverage_percent}%` }}
                          className="h-full bg-white shadow-[0_0_10px_white]"
                        />
                      </div>
                      <p className="text-[10px] font-bold mt-4 opacity-60 italic">You've seen {data?.metrics.total_questions} unique questions</p>
                   </div>
                   <TrendingUp className="absolute -right-8 -bottom-8 text-white/10 rotate-12" size={160} />
                </Card>
            </div>

            {/* RECENT ACTIVITY LIST (WITH FRACTIONAL SCORING) */}
            <Card className="rounded-[40px] border-none shadow-xl shadow-indigo-900/5 bg-white overflow-hidden">
               <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Recent Sessions</h3>
                  <Badge className="bg-indigo-50 text-emerald-600 border-none px-4 py-1.5 font-black text-[10px]">HISTORY</Badge>
               </div>
               <div className="divide-y divide-slate-50">
                  {data?.history.map((exam) => (
                    <motion.div 
                      key={exam.id} 
                      whileHover={{ x: 10 }}
                      className="p-8 flex items-center justify-between hover:bg-slate-50/80 transition-all cursor-pointer group"
                      onClick={() => navigate(`/exam-review/${exam.id}`)}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`p-4 rounded-[24px] transition-all group-hover:scale-110 ${exam.score >= 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          <Trophy size={24} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{exam.competency_area__name || 'Full Mock'}</p>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">
                            {new Date(exam.end_time).toLocaleDateString(undefined, { month: 'long', day: 'numeric'})}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <div className="flex items-baseline justify-end gap-1 mb-1">
                             <span className="text-4xl font-black text-slate-900 tracking-tighter">{exam.correct_answers}</span>
                             <span className="text-slate-300 text-xl font-light">/</span>
                             <span className="text-lg font-bold text-slate-400">{exam.total_questions}</span>
                          </div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${exam.score >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {exam.score.toFixed(0)}% Accuracy
                          </p>
                        </div>
                        <ChevronRight className="text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-2 transition-all" size={24} />
                      </div>
                    </motion.div>
                  ))}
               </div>
               {data?.history.length === 0 && (
                 <div className="p-20 text-center text-slate-400 font-medium italic">No exam data synced. Ready to start?</div>
               )}
            </Card>
          </div>

          {/* 4. RIGHT COLUMN: FOCUS AREAS & BENCHMARKS */}
          <div className="space-y-8">
            {/* SUBJECT BENCHMARKS */}
            <Card className="p-8 border-none shadow-xl shadow-emerald-900/5 rounded-[40px] bg-white">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Curriculum Benchmarks</h2>
              <div className="space-y-10">
                {data?.by_competency.map((comp) => (
                  <div key={comp.competency_area__name} className="group">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-widest">{comp.competency_area__name}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">National Avg: {comp.national_avg}%</p>
                      </div>
                      <div className={`px-2 py-1 rounded-lg font-black text-xs ${comp.average_score >= comp.national_avg ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {comp.average_score.toFixed(1)}%
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                       <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${comp.average_score}%` }} 
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className={`h-full rounded-full ${comp.average_score >= 75 ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                       />
                    </div>
                    
                  </div>
                ))}
              </div>
            </Card>

            {/* ADIMN UPLOAD SHORTCUT */}
            {isAdmin && (
              <Card className="p-6 bg-slate-900 border-none rounded-[32px] text-white shadow-2xl hover:bg-slate-800 transition-all cursor-pointer group" onClick={() => navigate('/admin/upload')}>
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform">
                       <Upload size={24} className="text-emerald-400" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Admin Control</p>
                       <p className="font-bold text-sm">Bulk Question Import</p>
                    </div>
                 </div>
              </Card>
            )}

            {/* ANALYTICS SHORTCUT */}
            <Card 
               className="p-8 bg-white border-2 border-dashed border-slate-200 rounded-[40px] hover:border-emerald-400 transition-all cursor-pointer group"
               onClick={() => navigate('/analytics')}
            >
                <div className="text-center">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <TrendingUp size={28} />
                    </div>
                    <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Detailed Performance</h4>
                    <p className="text-slate-400 text-[10px] mt-2 font-medium">Deep-dive into your speed and accuracy DNA</p>
                </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- REUSABLE UI ATOMS ---

function MetricCard({ label, value, icon, sub, color }: any) {
  return (
    <motion.div whileHover={{ y: -8 }}>
      <Card className="p-8 border-none shadow-xl shadow-emerald-900/5 rounded-[40px] bg-white group relative overflow-hidden">
        <div className="relative z-10">
            <div className="flex items-start justify-between mb-8">
              <div className={`p-4 ${color} rounded-[24px] transition-transform group-hover:scale-110 duration-500`}>
                {icon}
              </div>
              <ArrowUpRight className="text-slate-200 group-hover:text-indigo-500 transition-colors" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6 border-t border-slate-50 pt-4 flex items-center gap-2 italic">
               {sub}
            </p>
        </div>
      </Card>
    </motion.div>
  );
}

function ActionTile({ title, desc, icon, color, onClick }: any) {
    return (
        <button 
          onClick={onClick}
          className="w-full flex items-center justify-between p-5 rounded-[24px] border-2 border-slate-50 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all group"
        >
            <div className="flex items-center gap-4 text-left">
                <div className={`p-3 rounded-xl ${color} text-white shadow-lg shadow-indigo-900/20`}>{icon}</div>
                <div>
                    <p className="font-black text-slate-900 uppercase text-xs tracking-widest">{title}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">{desc}</p>
                </div>
            </div>
            <ChevronRight size={16} className="text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
        </button>
    );
}




// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router';  
// import { useAuth } from '../contexts/AuthContext';
// import apiClient from '../api/client';  
// import { Card } from './ui/card';
// import { Button } from './ui/button';
// import { Progress } from './ui/progress';
// import { Badge } from './ui/badge';
// import { Trophy, Target, Clock, ChevronRight, TrendingUp, Brain, Zap, Loader2, Upload } from 'lucide-react';
// import { motion } from 'motion/react'; // Using standard framer-motion or motion/react

// // 1. Define the shape of our dashboard data based on what the backend sends  
// interface DashboardData {
//   department: string;
//   overall: {
//     avg_score: number | null;
//     total_exams: number;
//   };
//   by_competency: Array<{
//     competency_area__name: string;
//     average_score: number;
//   }>;
//   history: Array<{
//     id: number;
//     end_time: string;
//     score: number;
//     competency_area__name: string; 
//     correct_answers: number;
//     total_questions: number;
//   }>;
// }
// // 2. The Dashboard component fetches data from the backend and displays it in a user-friendly way
// export function Dashboard() {
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [data, setData] = useState<DashboardData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const isAdmin = user?.role === 'ADMIN';

//   // 2. Fetch data from Django API
//   useEffect(() => {
//     const fetchDashboardData = async () => {
//       try {
//         const response = await apiClient.get('/dashboard/');
//         setData(response.data);
//         console.log("Dashboard data fetched:", response.data.department); // Debug log
//       } catch (error) {
//         console.error("Error fetching dashboard:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchDashboardData();
//   }, []);

//   // 3. Show loading state while fetching
//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center">
//         <Loader2 className="w-10 h-10 animate-spin text-primary" />
//       </div>
//     );
//   }

//   // 4. Define the stats to display in the dashboard cards
//   const stats = [
//     { 
//       label: 'Exams Taken', 
//       value: data?.overall.total_exams.toString() || '0', 
//       icon: Trophy, 
//       color: 'text-yellow-500' 
//     },
//     { 
//       label: 'Avg Score', 
//       value: data?.overall.avg_score ? `${data.overall.avg_score.toFixed(1)}%` : '0%', 
//       icon: Target, 
//       color: 'text-blue-500' 
//     },
//     { 
//       label: 'Department', 
//       value: data?.department || 'N/A', 
//       icon:  Brain, 
//       color: 'text-green-500' 
//     },
//     { 
//       label: 'Mastery', 
//       value: `${data?.by_competency.length || 0} Topics`, 
//       icon: TrendingUp, 
//       color: 'text-purple-500' 
//     },
    
//   ];
//   // 5. Render the dashboard with stats, quick actions, and recent activity 
//   return (
//     <div className="min-h-screen md:ml-64 bg-slate-50/50">
//       {/* Header */}
//       <header className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
//         <div className="container max-w-7xl mx-auto px-4 py-8">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//           >
//             <h1 className="text-3xl md:text-4xl font-bold mb-2">
//               Welcome back, {user?.full_name || 'User'}!
//             </h1>
//             <p className="text-primary-foreground/80">Ready to continue your preparation?</p>
//           </motion.div>
//         </div>
//       </header>

//       <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        
//         {/* Stats Grid */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//           {stats.map((stat, index) => (
//             <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
//               <Card className="p-5 border-none shadow-sm hover:shadow-md transition-shadow">
//                 <div className="flex items-start justify-between">
//                   <div>
//                     <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
//                     <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
//                   </div>
//                   <div className={`p-2 rounded-lg bg-slate-50`}>
//                     <stat.icon className={`w-6 h-6 ${stat.color}`} />
//                   </div>
//                 </div>
//               </Card>
//             </motion.div>
//           ))}
//         </div>

//         {/* Quick Actions */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <Card className="p-6 md:col-span-2">
//             <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
//               <Zap className="w-5 h-5 text-yellow-500" />
//               Quick Actions
//             </h2>
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               <Button size="lg" className="h-20 justify-start px-6" onClick={() => navigate('/exams')}>
//                 <Brain className="w-6 h-6 mr-4" />
//                 <div className="text-left">
//                   <div className="font-bold">Practice Mode</div>
//                   <div className="text-xs opacity-70">Focus on specific topics</div>
//                 </div>
//               </Button>
//               <Button size="lg" variant="outline" className="h-20 justify-start px-6" onClick={() => navigate('/exams')}>
//                 <Trophy className="w-6 h-6 mr-4 text-indigo-600" />
//                 <div className="text-left">
//                   <div className="font-bold text-slate-900">Simulated Exam</div>
//                   <div className="text-xs text-slate-500">Full timer & MoE rules</div>
//                 </div>
//               </Button>
//             </div>
//           </Card>
//           {isAdmin && (
//             <Card className="p-6 border-dashed border-2 border-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer" 
//                   onClick={() => navigate('/admin/upload')}>
//               <div className="flex items-center gap-4">
//                 <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
//                   <Upload size={24} />
//                 </div>
//                 <div>
//                   <h4 className="font-bold text-slate-900">Bulk Import</h4>
//                   <p className="text-xs text-slate-500">Upload questions via CSV</p>
//                 </div>
//               </div>
//             </Card>
//           )}

//           {/* Top Weaknesses (Derived from by_competency) */}
//           <Card className="p-6">
//             <h2 className="text-lg font-bold mb-4">Focus Areas</h2>
//             <div className="space-y-4">
//               {data?.by_competency.slice(0, 3).map((comp) => (
//                 <div key={comp.competency_area__name}>
//                   <div className="flex justify-between text-sm mb-1">
//                     <span className="font-medium text-slate-700">{comp.competency_area__name}</span>
//                     <span className="text-slate-500">{comp.average_score.toFixed(0)}%</span>
//                   </div>
//                   <Progress value={comp.average_score} className="h-1.5" />
//                 </div>
//               ))}
//             </div>
//           </Card>
//         </div>

//         {/* Recent Activity (From History) */}
//         <Card className="p-6">
//           <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
//           <div className="space-y-3">
//             {/* Use data?.history instead of recentExams */}
//             {data?.history.map((exam) => (
//             <div key={exam.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all group">
//               <div className="flex items-center gap-4">
//                 <div className={`p-4 rounded-2xl ${exam.score >= 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
//                   <Trophy size={22} />
//                 </div>
//                 <div>
//                   <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{exam.competency_area__name}</p>
//                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">
//                     {new Date(exam.end_time).toLocaleDateString()}
//                   </p>
//                 </div>
//               </div>

//               {/* --- THE FRACTIONAL SCORE --- */}
//               <div className="flex items-center gap-6">
//                   <div className="text-right">
//                       <div className="flex items-baseline justify-end gap-1">
//                           <span className="text-2xl font-black text-slate-900">{exam.correct_answers}</span>
//                           <span className="text-slate-300 font-bold">/</span>
//                           <span className="text-sm font-bold text-slate-400">{exam.total_questions}</span>
//                       </div>
//                       <p className={`text-[10px] font-black uppercase tracking-tighter ${exam.score >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>
//                           {exam.score.toFixed(0)}% Accuracy
//                       </p>
//                   </div>
//                   <ChevronRight className="text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
//               </div>
//             </div>
//           ))}
//           </div>
//         </Card>
//       </div>
//     </div>
//   );
// }

 
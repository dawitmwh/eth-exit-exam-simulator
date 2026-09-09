import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';

import {
  TrendingUp,
  Target,
  Clock,
  Brain,
  AlertCircle,
  Loader2,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  Award,
  Activity
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';


// --- TYPES ---
interface AnalyticsData {
  metrics: {
    overall_progress: number;
    avg_time_minutes: number;
    mastery_ratio: string;
  };
  progress_data: Array<{ exam: string; score: number; date: string, national_avg: number }>;
  category_performance: Array<{ category: string; score: number; avgTime: number }>;
  weak_areas: Array<{ topic: string; score: number; questions: number }>;
  overall_avg: number;
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[140px] rounded-3xl border border-white/10 bg-white/10 px-6 py-5 text-center backdrop-blur-md">
      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p>
    </div>
  );
}

export function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await apiClient.get('/exams/analytics/student/');
        setData(response.data);
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-white-500 p-4 md:p-10 space-y-10">
      
      {/* 1. HERO HEADER */}
      <header className="relative overflow-hidden bg-primary p-10 md:p-16 rounded-[48px] text-white shadow-2xl shadow-indigo-900/20">
         <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
           <div className="max-w-2xl">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                <Sparkles size={12} className="fill-current" /> Performance Analysis Map
             </div>
             <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none mb-6">
               Precision <br /><span className="text-emerald-400 italic">Insights.</span>
             </h1>
             <p className="text-emerald-100/60 font-medium text-lg leading-relaxed">
               Your last {data.progress_data.length} sessions are processed. Your accuracy is trending <span className="text-emerald-400 font-bold">upward</span> by 12% this week.
             </p>
           </div>
           
          <div className="grid grid-cols-2 gap-4">
               <div className="bg-emerald-950 p-8 rounded-[32px] text-white shadow-2xl flex flex-col items-center justify-center min-w-[200px]">
             <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300 mb-1">Overall Progress</p>
              <h4 className="text-5xl font-black italic">{data.metrics.overall_progress}%</h4>
          </div>
           </div>
         </div>
         {/* Decorative background circle */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
      </header>


      {/* 2. PROGRESSION CHART (Maintain from previous) */}
      <Card className="p-10 border-none shadow-xl rounded-[48px] bg-white">
        <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Growth Velocity</h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.progress_data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              
              {/* X-AXIS: THE TIMELINE */}
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                dy={15}
                label={{ 
                  value: 'EXAM TIMELINE (DATE/MONTH)', 
                  position: 'insideBottom', 
                  offset: -15, 
                  fontSize: 10, 
                  fontWeight: 900, 
                  fill: '#0C969C',
                  letterSpacing: '0.1em'
                }}
              />
              
              {/* Y-AXIS: THE PERFORMANCE */}
              <YAxis 
                domain={[0, 100]} 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                dx={-10}
                tickFormatter={(value) => `${value}%`}
                label={{ 
                  value: 'ACCURACY (%)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  fontSize: 10, 
                  fontWeight: 900, 
                  fill: '#0C969C',
                  letterSpacing: '0.1em'
                }}
              />
              
              <Tooltip 
                formatter={(value: number) => [`${value}%`, "Accuracy"]}
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
              />
              
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#4f46e5" 
                strokeWidth={4} 
                fill="url(#colorScore)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* 3. CATEGORY MASTERY (Maintain logic) */}
        <Card className="p-10 border-none shadow-xl shadow-indigo-900/5 rounded-[48px] bg-white">
        <h2 className="text-2xl font-black text-slate-900 mb-10 tracking-tight">Competency Proficiency</h2>
           <div className="space-y-10">
             {data.category_performance.map((cat:any) => (
               <motion.div 
                 key={cat.category}
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: cat.category * 0.1 }}
                 className="group"
               >
                 <div className="flex items-center justify-between mb-4">
                   <span className="font-black text-slate-700 uppercase text-xs tracking-widest">{cat.category}</span>
                   <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-slate-400">{cat.avgTime} min/avg</span>
                      <div className={`px-3 py-1 rounded-lg font-black text-xs ${cat.score >= 75 ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {cat.score.toFixed(1)}%
                      </div>
                   </div>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-50">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${cat.score}%` }}
                     transition={{ duration: 1.5, ease: "circOut" }}
                     className={`h-full rounded-full ${cat.score >= 75 ? 'bg-emerald-500' : 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]'}`}
                   />
                 </div>
              </motion.div>
           ))}
          </div>
        </Card>
        {/* 4. TIME ANALYSIS BAR CHART (Requested Maintain) */}
        <Card className="p-10 border-none shadow-xl rounded-[48px] bg-white">
          <h2 className="text-2xl font-black text-slate-900 mb-8">Velocity Analysis</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.category_performance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" hide />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                <Bar dataKey="avgTime" radius={[10, 10, 0, 0]} barSize={40}>
                   {data.category_performance.map((entry: any, index: number) => (
                     <Cell key={index} fill={entry.avgTime > 2.5 ? '#f43f5e' : '#6366f1'} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs font-medium text-slate-400 mt-6 uppercase tracking-widest">Minutes spent per question</p>
        </Card>
      </div>

      {/* 5. STRIKE PRIORITY (Weak Areas) */}
      <section className="space-y-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
          <AlertCircle className="text-rose-500" /> Focus Targets
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {data.weak_areas.map((area: any, idx: number) => (
            <motion.div key={idx} whileHover={{ y: -5 }} className="p-8 bg-white border border-slate-100 rounded-[40px] shadow-xl shadow-indigo-900/5">
              <div className="p-4 bg-rose-50 rounded-2xl text-rose-600 w-fit mb-6"><Brain size={24}/></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{area.topic || area.category}</h3>
              <p className="text-4xl font-black text-rose-500">{area.score.toFixed(0)}%</p>
              <p className="text-[10px] font-black uppercase text-slate-300 mt-4 tracking-widest">Recommended for Drill</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}




// export function Analytics() {
//   const [data, setData] = useState<AnalyticsData | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchAnalytics = async () => {
//       try {
//         const response = await apiClient.get('/exams/analytics/student/');
//         setData(response.data);
//       } catch (error) {
//         console.error("Analytics sync failed", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchAnalytics();
//   }, []);

//   if (loading) {
//     return (
//       <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50/50">
//         <div className="relative">
//             <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
//             <div className="absolute inset-0 blur-xl bg-indigo-400/20 animate-pulse" />
//         </div>
//         <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] mt-6">Compiling Intelligence...</p>
//       </div>
//     );
//   }

//   if (!data || data.progress_data.length === 0) {
//     return (
//       <div className="min-h-screen flex items-center justify-center p-10 bg-slate-50">
//         <Card className="p-12 text-center max-w-md rounded-[48px] border-none shadow-2xl bg-white">
//            <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
//               <Activity className="text-indigo-400" size={48} />
//            </div>
//            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Engine Idle.</h2>
//            <p className="text-slate-500 mt-4 font-medium leading-relaxed">
//              Take your first simulated exam to activate the analytics neural engine.
//            </p>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-50/50 p-4 md:p-10 space-y-10 font-sans selection:bg-indigo-100">
      
//       {/* 1. HERO ANALYTICS HEADER */}
//       <header className="relative overflow-hidden bg-indigo-950 p-10 md:p-16 rounded-[48px] text-white shadow-2xl shadow-indigo-900/20">
//         <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
//           <div className="max-w-2xl">
//             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
//                <Sparkles size={12} className="fill-current" /> Performance Analysis Map
//             </div>
//             <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none mb-6">
//               Precision <br /><span className="text-indigo-400 italic">Insights.</span>
//             </h1>
//             <p className="text-indigo-100/60 font-medium text-lg leading-relaxed">
//               Your last {data.progress_data.length} sessions are processed. Your accuracy is trending <span className="text-emerald-400 font-bold">upward</span> by 12% this week.
//             </p>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//              <HeaderStat label="National Rank" value="Top 8%" />
//              <HeaderStat label="Readiness" value="High" />
//           </div>
//         </div>
//         {/* Decorative background circle */}
//         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
//       </header>

//       {/* 2. CORE METRICS STRIP */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//         <MetricCard 
//           label="Cumulative Accuracy" 
//           value={`${data.metrics.overall_progress}%`} 
//           icon={<Target />}
//           desc="Overall Syllabus Coverage"
//           color="indigo"
//         />
//         <MetricCard 
//           label="Average Pace" 
//           value={`${data.metrics.avg_time_minutes}m`} 
//           icon={<Clock />}
//           desc="Response speed per task"
//           color="emerald"
//         />
//         <MetricCard 
//           label="Verification Ratio" 
//           value={data.metrics.mastery_ratio} 
//           icon={<Award />}
//           desc="Competency area Above 75%"
//           color="violet"
//         />
         
//       </div>

//       {/* 3. TREND ARCHITECTURE - AREA CHART */}
//       <Card className="p-10 border-none shadow-xl shadow-indigo-900/5 rounded-[48px] bg-white">
//         <div className="flex items-center justify-between mb-12">
//            <div>
//              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Growth Velocity</h2>
//              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Score progression over time</p>
//            </div>
//            <div className="flex items-center gap-3 bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-2xl font-black text-sm border border-emerald-100">
//               <TrendingUp size={18} /> STABLE GROWTH
//            </div>
//         </div>
//         <div className="h-[400px] w-full">
//           <ResponsiveContainer width="100%" height="100%">
//             <AreaChart data={data.progress_data}>
//               <defs>
//                 <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
//                   <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
//                 </linearGradient>
//               </defs>
//               <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
//               <XAxis dataKey="exam" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 800}} dy={15} />
//               <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 800}} dx={-15} />
//               <Tooltip 
//                 cursor={{ stroke: '#4f46e5', strokeWidth: 2, strokeDasharray: '4 4' }}
//                 contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px' }} 
//               />
//               <Area 
//                 type="monotone" 
//                 dataKey="score" 
//                 stroke="#4f46e5" 
//                 strokeWidth={6} 
//                 fillOpacity={1} 
//                 fill="url(#colorScore)" 
//                 dot={{ r: 6, fill: '#4f46e5', strokeWidth: 4, stroke: '#fff' }}
//                 activeDot={{ r: 10 }}
//               />
//             </AreaChart>
//           </ResponsiveContainer>
//         </div>
//       </Card>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
//         {/* 4. PROFICIENCY BREAKDOWN */}
//         <Card className="p-10 border-none shadow-xl shadow-indigo-900/5 rounded-[48px] bg-white">
//           <h2 className="text-2xl font-black text-slate-900 mb-10 tracking-tight">Competency Depth</h2>
//           <div className="space-y-10">
//             {data.category_performance.map((cat, idx) => (
//               <motion.div 
//                 key={cat.category}
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: idx * 0.1 }}
//                 className="group"
//               >
//                 <div className="flex items-center justify-between mb-4">
//                   <span className="font-black text-slate-700 uppercase text-xs tracking-widest">{cat.category}</span>
//                   <div className="flex items-center gap-4">
//                      <span className="text-[10px] font-bold text-slate-400">{cat.avgTime} min/avg</span>
//                      <div className={`px-3 py-1 rounded-lg font-black text-xs ${cat.score >= 75 ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
//                        {cat.score.toFixed(1)}%
//                      </div>
//                   </div>
//                 </div>
//                 <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-50">
//                   <motion.div 
//                     initial={{ width: 0 }}
//                     animate={{ width: `${cat.score}%` }}
//                     transition={{ duration: 1.5, ease: "circOut" }}
//                     className={`h-full rounded-full ${cat.score >= 75 ? 'bg-emerald-500' : 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]'}`}
//                   />
//                 </div>
//               </motion.div>
//             ))}
//           </div>
//         </Card>

//         {/* 5. VELOCITY ANALYSIS - BAR CHART */}
//         <Card className="p-10 border-none shadow-xl shadow-indigo-900/5 rounded-[48px] bg-white">
//           <h2 className="text-2xl font-black text-slate-900 mb-10 tracking-tight">Velocity Mapping</h2>
//           <div className="h-[300px] w-full">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={data.category_performance}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//                 <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 900}} dy={15} />
//                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
//                 <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none'}} />
//                 <Bar dataKey="avgTime" radius={[12, 12, 0, 0]} barSize={50}>
//                   {data.category_performance.map((entry, index) => (
//                     <Cell 
//                         key={`cell-${index}`} 
//                         fill={entry.avgTime > 2.5 ? '#f43f5e' : '#4f46e5'} 
//                         className="transition-all duration-500 hover:opacity-80"
//                     />
//                   ))}
//                 </Bar>
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//           <div className="mt-12 p-8 bg-slate-900 rounded-[32px] text-white flex items-center gap-6 shadow-2xl">
//              <div className="p-4 bg-white/10 rounded-2xl text-amber-400 backdrop-blur-md">
//                 <Activity size={24}/>
//              </div>
//              <div>
//                 <p className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-1">Efficiency Delta</p>
//                 <p className="text-sm font-medium text-indigo-50 leading-relaxed">
//                   You spend <span className="text-rose-400 font-bold">2.4x</span> more time on <strong>{data.category_performance.sort((a,b) => b.avgTime - a.avgTime)[0]?.category}</strong> than Ethics. 
//                   Focused rapid-fire drills are recommended.
//                 </p>
//              </div>
//           </div>
//         </Card>
//       </div>

//       {/* 6. PRIORITY STRIKE LIST (WEAK AREAS) */}
//       <section className="space-y-8">
//         <div className="flex items-center gap-3">
//           <div className="p-2 bg-rose-50 rounded-lg text-rose-500"><AlertCircle size={24}/></div>
//           <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Strike Priority List</h2>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//           {data.weak_areas.map((area, idx) => (
//             <motion.div 
//               key={area.topic} 
//               whileHover={{ scale: 1.03, y: -5 }}
//               className="p-8 bg-white border border-slate-100 rounded-[40px] shadow-xl shadow-indigo-900/5 group cursor-pointer"
//             >
//               <div className="flex justify-between items-start mb-8">
//                  <div className="p-4 bg-rose-50 rounded-2xl text-rose-600 transition-colors group-hover:bg-rose-600 group-hover:text-white">
//                     <Brain size={28} />
//                  </div>
//                  <Badge className="bg-rose-50 text-rose-600 border-none font-black text-[10px] tracking-widest px-3 py-1">PRIORITY {idx + 1}</Badge>
//               </div>
//               <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">{area.topic}</h3>
//               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">{area.questions} Sessions Analyzed</p>
              
//               <div className="flex items-end justify-between border-t border-slate-50 pt-6">
//                  <div>
//                     <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Current Accuracy</p>
//                     <span className="text-4xl font-black text-rose-500">{area.score.toFixed(0)}%</span>
//                  </div>
//                  <div className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-300 group-hover:border-rose-600 group-hover:text-rose-600 transition-all">
//                     <ArrowUpRight size={20} />
//                  </div>
//               </div>
//             </motion.div>
//           ))}
//         </div>
//       </section>

//       <footer className="pt-20 pb-10 text-center">
//          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-300 mb-2">
//            Institutional Prep Analytics Engine
//          </p>
//          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
//            Secure Data Node • v1.4.0 Final
//          </p>
//       </footer>
//     </div>
//   );
// }

// // --- REUSABLE SUB-COMPONENTS ---

// function HeaderStat({ label, value }: { label: string; value: string }) {
//   return (
//     <div className="min-w-[140px] rounded-3xl border border-white/10 bg-white/10 px-6 py-5 text-center backdrop-blur-md">
//       <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">{label}</p>
//       <p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p>
//     </div>
//   );
// }

// function MetricCard({ label, value, icon, desc, color }: any) {
//   const colors: any = {
//     indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
//     emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
//     violet: "bg-violet-50 text-violet-600 border-violet-100"
//   };

//   return (
//     <motion.div whileHover={{ y: -8, transition: { duration: 0.2 } }}>
//       <Card className="p-10 border-none shadow-xl shadow-indigo-900/5 rounded-[40px] bg-white group relative overflow-hidden">
//         <div className="relative z-10">
//             <div className="flex items-center justify-between mb-8">
//               <div className={`p-4 rounded-[24px] ${colors[color]} transition-transform group-hover:scale-110 duration-500`}>
//                 {icon}
//               </div>
//               <ArrowUpRight className="text-slate-200 group-hover:text-indigo-500 transition-colors" />
//             </div>
//             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
//             <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{value}</h3>
//             <p className="text-xs font-bold text-slate-400 mt-6 border-t border-slate-50 pt-4 flex items-center gap-2">
//                <Activity size={12} className="text-indigo-400" /> {desc}
//             </p>
//         </div>
//         {/* Subtle decorative background text */}
//         <span className="absolute -bottom-4 -right-2 text-9xl font-black text-slate-50 select-none -z-0">
//             {value.toString().charAt(0)}
//         </span>
//       </Card>
//     </motion.div>
//   );
// }




// import { useState, useEffect } from 'react';
// import apiClient from '../api/client';
// import { Card } from '../components/ui/card';
// import { Badge } from '../components/ui/badge';
// import { Progress } from '../components/ui/progress';
// import {
//   TrendingUp,
//   Target,
//   Clock,
//   Brain,
//   AlertCircle,
//   Loader2,
//   Sparkles,
//   ChevronRight,
//   ArrowUpRight
// } from 'lucide-react';
// import { 
//   LineChart, Line, BarChart, Bar, XAxis, YAxis, 
//   CartesianGrid, Tooltip, ResponsiveContainer, Cell 
// } from 'recharts';
// import { motion } from 'framer-motion';

// // --- TYPES ---
// interface AnalyticsData {
//   metrics: {
//     overall_progress: number;
//     avg_time_minutes: number;
//     mastery_ratio: string;
//   };
//   progress_data: Array<{ exam: string; score: number; date: string }>;
//   category_performance: Array<{ category: string; score: number; avgTime: number }>;
//   weak_areas: Array<{ topic: string; score: number; questions: number }>;
// }

// export function Analytics() {
//   const [data, setData] = useState<AnalyticsData | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchAnalytics = async () => {
//       try {
//         const response = await apiClient.get('/exams/analytics/student/');
//         setData(response.data);
//       } catch (error) {
//         console.error("Failed to load analytics data", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchAnalytics();
//   }, []);

//   if (loading) {
//     return (
//       <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
//         <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
//         <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Generating Intelligence...</p>
//       </div>
//     );
//   }

//   if (!data || data.progress_data.length === 0) {
//     return (
//       <div className="min-h-screen flex items-center justify-center p-10 bg-slate-50">
//         <Card className="p-12 text-center max-w-md rounded-[40px] border-none shadow-xl">
//            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
//               <Brain className="text-indigo-300" size={40} />
//            </div>
//            <h2 className="text-2xl font-black text-slate-900">Awaiting Data</h2>
//            <p className="text-slate-500 mt-3 font-medium">Your performance charts will come to life once you complete your first simulated exam.</p>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8 font-sans">
      
//       {/* 1. GLASS HEADER */}
//       <header className="relative overflow-hidden bg-white p-8 md:p-12 rounded-[40px] border border-slate-200 shadow-sm">
//         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
//           <div>
//             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-4">
//                <Sparkles size={12} className="fill-current" /> Performance Intelligence
//             </div>
//             <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
//               Your Competency <span className="text-indigo-600">Progress.</span>
//             </h1>
//             <p className="text-slate-500 mt-4 font-medium max-w-lg text-lg">
//               Here is your recent mock sessions to identify patterns in your learning speed and accuracy.
//             </p>
//           </div>
//           <div className="bg-indigo-950 p-8 rounded-[32px] text-white shadow-2xl flex flex-col items-center justify-center min-w-[200px]">
//              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300 mb-1">Global Standing</p>
//              <h4 className="text-5xl font-black italic">Top 12%</h4>
//           </div>
//         </div>
//       </header>

//       {/* 2. HIGH-IMPACT METRICS */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <MetricCard 
//           label="Syllabus Mastery" 
//           value={`${data.metrics.overall_progress}%`} 
//           icon={<Target className="text-indigo-600" />}
//           subtext="Overall Accuracy"
//           color="bg-indigo-50"
//         />
//         <MetricCard 
//           label="Response Pace" 
//           value={`${data.metrics.avg_time_minutes}m`} 
//           icon={<Clock className="text-emerald-600" />}
//           subtext="Avg Time Per Question"
//           color="bg-emerald-50"
//         />
//         <MetricCard 
//           label="Mastery Ratio" 
//           value={data.metrics.mastery_ratio} 
//           icon={<Brain className="text-violet-600" />}
//           subtext="Subjects Verified"
//           color="bg-violet-50"
//         />
//       </div>

//       {/* 3. SCORE PROGRESSION - LINE CHART */}
//       <Card className="p-8 md:p-12 border-none shadow-sm rounded-[40px] bg-white">
//         <div className="flex items-center justify-between mb-10">
//            <div>
//              <h2 className="text-2xl font-black text-slate-900">Score Progression</h2>
//              <p className="text-sm text-slate-400 font-medium">Tracking your last {data.progress_data.length} exam cycles</p>
//            </div>
//            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-xl">
//               <TrendingUp size={16} /> +12.5% Growth
//            </div>
//         </div>
//         <div className="h-[350px] w-full">
//           <ResponsiveContainer width="100%" height="100%">
//             <LineChart data={data.progress_data}>
//               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//               <XAxis dataKey="exam" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={15} />
//               <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dx={-15} />
//               <Tooltip 
//                 contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }} 
//               />
//               <Line
//                 type="monotone"
//                 dataKey="score"
//                 stroke="#4f46e5"
//                 strokeWidth={5}
//                 dot={{ r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }}
//                 activeDot={{ r: 10, fill: '#4f46e5', strokeWidth: 4, stroke: '#fff' }}
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </Card>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         {/* 4. COMPETENCY MASTERY */}
//         <Card className="p-8 md:p-10 border-none shadow-sm rounded-[40px] bg-white">
//           <h2 className="text-2xl font-black text-slate-900 mb-8">Subject Proficiency</h2>
//           <div className="space-y-8">
//             {data.category_performance.map((cat) => (
//               <div key={cat.category} className="group">
//                 <div className="flex items-center justify-between mb-3">
//                   <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{cat.category}</span>
//                   <div className="flex items-center gap-3">
//                      <span className="text-xs font-bold text-slate-400">{cat.avgTime}m/q</span>
//                      <Badge className={`rounded-lg border-none px-3 ${cat.score >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
//                        {cat.score}%
//                      </Badge>
//                   </div>
//                 </div>
//                 <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
//                   <motion.div 
//                     initial={{ width: 0 }}
//                     animate={{ width: `${cat.score}%` }}
//                     transition={{ duration: 1 }}
//                     className={`h-full rounded-full ${cat.score >= 75 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
//                   />
//                 </div>
//               </div>
//             ))}
//           </div>
//         </Card>

//         {/* 5. TIME ALLOCATION - BAR CHART */}
//         <Card className="p-8 md:p-10 border-none shadow-sm rounded-[40px] bg-white">
//           <h2 className="text-2xl font-black text-slate-900 mb-8">Time Allocation</h2>
//           <div className="h-[300px] w-full">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={data.category_performance}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//                 <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
//                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
//                 <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
//                 <Bar dataKey="avgTime" radius={[10, 10, 0, 0]} barSize={45}>
//                   {data.category_performance.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={entry.avgTime > 3 ? '#f43f5e' : '#6366f1'} />
//                   ))}
//                 </Bar>
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//           <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
//              <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500"><AlertCircle size={20}/></div>
//              <div>
//                 <p className="text-sm font-bold text-slate-700">Efficiency Insight</p>
//                 <p className="text-xs text-slate-500 mt-1 leading-relaxed">
//                   Your response time in <strong>{data.category_performance.sort((a,b) => b.avgTime - a.avgTime)[0]?.category}</strong> is slower than average. 
//                   Try taking 10-minute rapid-fire practice mocks to improve.
//                 </p>
//              </div>
//           </div>
//         </Card>
//       </div>

//       {/* 6. WEAK AREAS ACTION PLAN */}
//       <Card className="p-8 md:p-12 border-none shadow-xl shadow-indigo-900/5 rounded-[40px] bg-indigo-950 text-white relative overflow-hidden">
//         <div className="relative z-10">
//           <div className="flex items-center gap-3 mb-10">
//             <AlertCircle className="text-rose-400" size={32} />
//             <h2 className="text-3xl font-black tracking-tight">Areas Needing Attention</h2>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             {data.weak_areas.map((area, idx) => (
//               <motion.div 
//                 key={area.topic} 
//                 whileHover={{ scale: 1.02 }}
//                 className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] group cursor-pointer"
//               >
//                 <div className="flex justify-between items-start mb-6">
//                    <div className="p-3 bg-rose-500/20 rounded-2xl text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-all">
//                       <Brain size={24} />
//                    </div>
//                    <Badge className="bg-white/10 text-white border-none">Priority {idx + 1}</Badge>
//                 </div>
//                 <h3 className="text-xl font-bold mb-1">{area.topic}</h3>
//                 <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest mb-6">{area.questions} Attempted</p>
//                 <div className="flex items-end justify-between">
//                    <span className="text-4xl font-black text-rose-400">{area.score}%</span>
//                    <ChevronRight className="text-white/20 group-hover:text-white group-hover:translate-x-2 transition-all" />
//                 </div>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//         {/* Decorative Glow */}
//         <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] -mb-48 -mr-48" />
//       </Card>

//       <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 py-12">
//         Institutional Analytics Framework • 2026 Edition
//       </p>
//     </div>
//   );
// }

// // --- REUSABLE SUB-COMPONENT ---
// function MetricCard({ label, value, icon, subtext, color }: any) {
//   return (
//     <motion.div whileHover={{ y: -5 }}>
//       <Card className="p-8 border-none shadow-sm rounded-[32px] bg-white group transition-all">
//         <div className="flex items-start justify-between mb-6">
//           <div className={`p-4 ${color} rounded-2xl transition-transform group-hover:scale-110`}>
//             {icon}
//           </div>
//           <div className="text-right">
//              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
//              <h3 className="text-4xl font-black text-slate-900 mt-1">{value}</h3>
//           </div>
//         </div>
//         <div className="flex items-center gap-2 text-xs font-bold text-slate-400 border-t border-slate-50 pt-4">
//            <ArrowUpRight size={14} className="text-indigo-500" /> {subtext}
//         </div>
//       </Card>
//     </motion.div>
//   );
// }








// import { Card } from './ui/card';
// import { Badge } from './ui/badge';
// import { Progress } from './ui/progress';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
// import {
//   TrendingUp,
//   TrendingDown,
//   Target,
//   Clock,
//   Brain,
//   AlertCircle,
// } from 'lucide-react';
// import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// export function Analytics() {
//   const progressData = [
//     { exam: 'Exam 1', score: 65 },
//     { exam: 'Exam 2', score: 70 },
//     { exam: 'Exam 3', score: 68 },
//     { exam: 'Exam 4', score: 75 },
//     { exam: 'Exam 5', score: 78 },
//     { exam: 'Exam 6', score: 82 },
//   ];

//   const categoryPerformance = [
//     { category: 'Anatomy', score: 85, avgTime: 2.5 },
//     { category: 'Pharmacology', score: 72, avgTime: 3.2 },
//     { category: 'Pediatrics', score: 78, avgTime: 2.8 },
//     { category: 'Ethics', score: 90, avgTime: 1.5 },
//     { category: 'Clinical', score: 68, avgTime: 3.5 },
//   ];

//   const weakAreas = [
//     { topic: 'Cardiovascular System', score: 62, questions: 45 },
//     { topic: 'Drug Interactions', score: 65, questions: 38 },
//     { topic: 'Pediatric Dosing', score: 58, questions: 32 },
//   ];

//   return (
//     <div className="min-h-screen md:ml-64">
//       {/* Header */}
//       <header className="bg-card border-b border-border sticky top-0 z-10 backdrop-blur-sm bg-card/80">
//         <div className="container max-w-7xl mx-auto px-4 py-4">
//           <h1 className="text-2xl font-bold">Analytics</h1>
//           <p className="text-sm text-muted-foreground mt-1">
//             Track your progress and identify areas for improvement
//           </p>
//         </div>
//       </header>

//       <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
//         {/* Key Metrics */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <Card className="p-6">
//             <div className="flex items-start justify-between mb-4">
//               <div>
//                 <p className="text-sm text-muted-foreground mb-1">Overall Progress</p>
//                 <p className="text-3xl font-bold">78%</p>
//               </div>
//               <div className="p-3 bg-green-500/10 rounded-lg">
//                 <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
//               </div>
//             </div>
//             <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
//               <TrendingUp className="w-4 h-4" />
//               <span>+15% from last month</span>
//             </div>
//           </Card>

//           <Card className="p-6">
//             <div className="flex items-start justify-between mb-4">
//               <div>
//                 <p className="text-sm text-muted-foreground mb-1">Avg Time/Question</p>
//                 <p className="text-3xl font-bold">2.8m</p>
//               </div>
//               <div className="p-3 bg-blue-500/10 rounded-lg">
//                 <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
//               </div>
//             </div>
//             <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
//               <TrendingDown className="w-4 h-4" />
//               <span>-0.5m faster</span>
//             </div>
//           </Card>

//           <Card className="p-6">
//             <div className="flex items-start justify-between mb-4">
//               <div>
//                 <p className="text-sm text-muted-foreground mb-1">Strong Areas</p>
//                 <p className="text-3xl font-bold">4/7</p>
//               </div>
//               <div className="p-3 bg-purple-500/10 rounded-lg">
//                 <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
//               </div>
//             </div>
//             <div className="flex items-center gap-2 text-sm text-muted-foreground">
//               <span>57% mastery rate</span>
//             </div>
//           </Card>
//         </div>

//         {/* Progress Chart */}
//         <Card className="p-6">
//           <h2 className="text-xl font-semibold mb-6">Score Progression</h2>
//           <ResponsiveContainer width="100%" height={300}>
//             <LineChart data={progressData}>
//               <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
//               <XAxis
//                 dataKey="exam"
//                 className="text-xs"
//                 tick={{ fill: 'currentColor' }}
//               />
//               <YAxis
//                 className="text-xs"
//                 tick={{ fill: 'currentColor' }}
//                 domain={[0, 100]}
//               />
//               <Tooltip
//                 contentStyle={{
//                   backgroundColor: 'hsl(var(--card))',
//                   border: '1px solid hsl(var(--border))',
//                   borderRadius: '0.5rem',
//                 }}
//               />
//               <Line
//                 type="monotone"
//                 dataKey="score"
//                 stroke="hsl(var(--primary))"
//                 strokeWidth={3}
//                 dot={{ r: 6 }}
//                 activeDot={{ r: 8 }}
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         </Card>

//         {/* Category Performance */}
//         <Card className="p-6">
//           <h2 className="text-xl font-semibold mb-6">Performance by Category</h2>
//           <div className="space-y-4">
//             {categoryPerformance.map((cat) => (
//               <div key={cat.category}>
//                 <div className="flex items-center justify-between mb-2">
//                   <div className="flex items-center gap-3">
//                     <span className="font-medium">{cat.category}</span>
//                     <Badge variant={cat.score >= 80 ? 'default' : 'secondary'}>
//                       {cat.score}%
//                     </Badge>
//                   </div>
//                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                     <Clock className="w-4 h-4" />
//                     <span>{cat.avgTime}m avg</span>
//                   </div>
//                 </div>
//                 <Progress value={cat.score} className="h-3" />
//               </div>
//             ))}
//           </div>
//         </Card>

//         {/* Weak Areas */}
//         <Card className="p-6">
//           <div className="flex items-center gap-2 mb-6">
//             <AlertCircle className="w-5 h-5 text-orange-500" />
//             <h2 className="text-xl font-semibold">Areas Needing Attention</h2>
//           </div>
//           <p className="text-sm text-muted-foreground mb-6">
//             Focus on these topics to improve your overall score
//           </p>
//           <div className="space-y-4">
//             {weakAreas.map((area) => (
//               <div
//                 key={area.topic}
//                 className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg"
//               >
//                 <div className="flex items-start justify-between mb-3">
//                   <div>
//                     <h3 className="font-semibold flex items-center gap-2">
//                       <Brain className="w-4 h-4" />
//                       {area.topic}
//                     </h3>
//                     <p className="text-sm text-muted-foreground mt-1">
//                       {area.questions} questions attempted
//                     </p>
//                   </div>
//                   <Badge
//                     variant="secondary"
//                     className="bg-orange-500/10 text-orange-600 dark:text-orange-400"
//                   >
//                     {area.score}%
//                   </Badge>
//                 </div>
//                 <Progress value={area.score} className="h-2" />
//                 <p className="text-xs text-muted-foreground mt-2">
//                   Recommended: Complete 20 more practice questions in this area
//                 </p>
//               </div>
//             ))}
//           </div>
//         </Card>

//         {/* Time Analysis */}
//         <Card className="p-6">
//           <h2 className="text-xl font-semibold mb-6">Time Spent Analysis</h2>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={categoryPerformance}>
//               <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
//               <XAxis
//                 dataKey="category"
//                 className="text-xs"
//                 tick={{ fill: 'currentColor' }}
//               />
//               <YAxis
//                 className="text-xs"
//                 tick={{ fill: 'currentColor' }}
//                 label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
//               />
//               <Tooltip
//                 contentStyle={{
//                   backgroundColor: 'hsl(var(--card))',
//                   border: '1px solid hsl(var(--border))',
//                   borderRadius: '0.5rem',
//                 }}
//               />
//               <Bar dataKey="avgTime" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//           <p className="text-sm text-muted-foreground mt-4 text-center">
//             You spend more time on Pharmacology and Clinical questions. Consider focused
//             practice to improve speed.
//           </p>
//         </Card>
//       </div>
//     </div>
//   );
// }

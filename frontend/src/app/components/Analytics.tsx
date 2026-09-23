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
import { motion, AnimatePresence } from 'motion/react';


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

 
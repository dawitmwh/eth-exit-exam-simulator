import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { 
  Trophy, Target, BookOpen, TrendingUp, 
  Users, ChevronRight, Loader2, Zap, Star, 
  Activity, ShieldCheck, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDashboardData } from '../pages/admin/data/DashboardData';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ClassroomWidget } from './ClassroomWidget';

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50/50">
        <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
            <div className="absolute inset-0 blur-xl bg-indigo-400/20 animate-pulse" />
        </div>
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] mt-6">Synchronizing Data Node...</p>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50/30 p-4 md:p-10 space-y-10 font-sans selection:bg-indigo-100">
      
      {/* 1. ULTRA-PREMIUM WELCOME HERO */}
      <section className="relative overflow-hidden bg-indigo-950 p-10 md:p-16 rounded-[48px] text-white shadow-2xl shadow-indigo-900/20">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
               <ShieldCheck size={12} className="fill-current" /> {isAdmin ? "Institutional Authority" : "Active Candidate"}
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none mb-6">
              {isAdmin ? user?.university_name : `Welcome, ${user?.email?.split('@')[0]}!`}
            </h1>
            <p className="text-indigo-100/60 font-medium text-lg leading-relaxed">
              {isAdmin 
                ? "Your university is performing within the top 15% of the national benchmark. 12 new students joined this morning." 
                : "Your neural preparation map is 85% complete. You are trending toward an 'Expert' readiness level."}
            </p>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(isAdmin ? '/admin/vouchers' : '/exams')}
            className="flex items-center gap-3 bg-white text-indigo-950 px-8 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-white/5"
          >
            {isAdmin ? <Users size={20} /> : <Zap size={20} className="fill-current" />}
            <span>{isAdmin ? "Grant Access Vouchers" : "Resume Mock Exam"}</span>
          </motion.button>
        </div>
        
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] -ml-20 -mb-20" />
      </section>

      {/* 2. CORE METRICS - HIGH CONTRAST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          label="Total Sessions" 
          value={data?.overall.total_exams || 0} 
          icon={<BookOpen />} 
          sub="Global Submissions"
          color="indigo"
        />
        <StatCard 
          label="Accuracy Index" 
          value={`${data?.overall.avg_score?.toFixed(0) || 0}%`} 
          icon={<Target />} 
          sub="University Average"
          color="rose"
        />
        {isAdmin ? (
          <StatCard 
            label="Active Scholars" 
            value= "gg"
            icon={<Users />} 
            sub="Registered Peers"
            color="emerald"
          />
        ) : (
          <StatCard 
            label="Topics Mastered" 
            value={data?.by_competency.length || 0} 
            icon={<TrendingUp />} 
            sub="Knowledge Areas"
            color="amber"
          />
        )}
        <StatCard 
          label="Platform Rank" 
          value={1} 
          icon={<Trophy />} 
          sub="Based on Time"
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* 3. COMPETENCY ANALYSIS (LEFT) */}
        <div className="lg:col-span-2 space-y-10">
          <Card className="p-10 border-none shadow-xl shadow-indigo-900/5 rounded-[48px] bg-white">
            <div className="flex items-center justify-between mb-12">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Competency Neural Map</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Live accuracy per focus area</p>
               </div>
               <button className="p-3 bg-slate-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all">
                  <Activity size={20} />
               </button>
            </div>

            <div className="space-y-10">
              {data?.by_competency.map((item, idx) => (
                <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: idx * 0.1 }}
                    className="group"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{item.competency_area__name}</span>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-slate-300">ACCURACY</span>
                        <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{item.average_score.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-50">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.average_score}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className={`h-full rounded-full ${
                        item.average_score >= 75 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 
                        item.average_score >= 50 ? 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 
                        'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      }`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* 4. ACTIVITY LEDGER */}
          <Card className="rounded-[48px] shadow-xl shadow-indigo-900/5 border-none bg-white overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Recent Session History</h3>
              <Badge className="bg-slate-100 text-slate-500 border-none px-4 py-1.5 font-bold rounded-xl">LATEST 5</Badge>
            </div>
            <div className="divide-y divide-slate-50">
              {data?.history.map((exam, idx) => (
                <motion.div 
                    key={exam.id} 
                    whileHover={{ x: 10 }}
                    className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-[20px] transition-all group-hover:scale-110 ${exam.score >= 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      <Trophy size={24} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{exam.competency_area__name}</p>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">{new Date(exam.end_time).toLocaleDateString(undefined, { month: 'long', day: 'numeric'})}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className={`font-black text-3xl tracking-tighter ${exam.score >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>{exam.score.toFixed(0)}%</p>
                    </div>
                    <ChevronRight className="text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-2 transition-all" size={24} />
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* 5. RIGHT SIDEBAR WIDGETS */}
        <div className="space-y-10">
          <Card className="bg-indigo-900 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10 backdrop-blur-md">
                 <Zap size={28} className="text-amber-400 fill-current" />
              </div>
              <h3 className="text-3xl font-black mb-4 leading-tight">Institutional <br />Velocity.</h3>
              <p className="text-indigo-200 text-sm leading-relaxed mb-10 font-medium italic">"Complete 100 new vouchers distribution by Friday to maintain university ranking."</p>
              
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-4">
                 <motion.div initial={{width: 0}} animate={{width: '68%'}} transition={{duration: 2}} className="h-full bg-white shadow-[0_0_15px_white]" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Goal Progress: 68%</p>
            </div>
            <Star className="absolute -right-10 -bottom-10 text-white/5 rotate-12" size={240} />
          </Card>
 <div className="space-y-8">
                      {/* NEW: Classroom Widget */}
                      <ClassroomWidget />

                      <Card className="p-8 border-none shadow-xl ...">
                        {/* Growth Targets... */}
                      </Card>
                  </div>
          <Card className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm relative overflow-hidden">
            <h4 className="font-black text-slate-900 text-sm uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
               <TrendingUp size={20} className="text-indigo-600" /> Platform Delta
            </h4>
            <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 relative group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">National Average</p>
                    <p className="text-4xl font-black text-slate-900 tracking-tighter">72.4%</p>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500 bg-emerald-50 px-3 py-1 rounded-lg text-xs font-black">
                        +4.2
                    </div>
                </div>
                <p className="text-xs font-medium text-slate-500 leading-relaxed px-2">
                    Your institution is currently <span className="text-emerald-600 font-bold">outperforming</span> the regional aggregate in Management MIS.
                </p>
            </div>
          </Card>
        </div>
      </div>

      <footer className="pt-20 pb-10 text-center">
         <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-300">
           Exit Examiner Framework • v1.4.2
         </p>
      </footer>
    </div>
  );
}

// --- REUSABLE STAT CARD COMPONENT ---

function StatCard({ label, value, icon, sub, color = "indigo" }: any) {
  const colorMap: any = {
    indigo: "bg-indigo-50 text-indigo-600",
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600"
  };

  return (
    <motion.div whileHover={{ y: -8, transition: { duration: 0.2 } }}>
      <Card className="p-8 border-none shadow-xl shadow-indigo-900/5 rounded-[40px] bg-white group relative overflow-hidden">
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className={`p-4 rounded-[20px] ${colorMap[color]} transition-transform group-hover:scale-110 duration-500`}>
                {icon}
              </div>
              <ArrowUpRight className="text-slate-100 group-hover:text-indigo-500 transition-colors" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-6 border-t border-slate-50 pt-4 uppercase tracking-tighter italic">
               {sub}
            </p>
        </div>
        {/* Subtle background letter decoration */}
        <span className="absolute -bottom-8 -right-4 text-[140px] font-black text-slate-50/50 select-none -z-0 group-hover:text-indigo-50/50 transition-colors">
            {value.toString().charAt(0)}
        </span>
      </Card>
    </motion.div>
  );
}

 
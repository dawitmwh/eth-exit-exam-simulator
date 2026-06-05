import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { 
  Trophy, Target, BookOpen, TrendingUp, 
  Users, ChevronRight, Loader2, 
  
} from 'lucide-react';
 
import { motion, AnimatePresence  } from 'motion/react'; 

import { useDashboardData } from '../pages/admin/data/DashboardData';


export function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useDashboardData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Syncing your progress...</p>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. SIDEBAR (Desktop) */}
    

      {/* 2. MAIN CONTENT */}
      <main className="flex-1 md:ml-64 min-w-0">
        {/* Top Header */}
        
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
          {/* Welcome Section */}
          <section>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              {isAdmin ? `${user?.university_name}` : `Welcome back, ${user?.email}! 👋`}
            </h2>
            <p className="text-slate-500 mt-1">Here is what's happening with your preparation.</p>
          </section>

          {/* 3. STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard 
              label="Exams Completed" 
              value={data?.overall.total_exams || 0} 
              icon={<BookOpen className="text-blue-600" />} 
              trend="+2 this week"
            />
            <StatCard 
              label="Average Score" 
              value={`${data?.overall.avg_score?.toFixed(0) || 0}%`} 
              icon={<Target className="text-indigo-600" />} 
              color="bg-indigo-50"
            />
            {isAdmin ? (
              <StatCard 
                label="Total Students" 
                value={data?.student_count || 0} 
                icon={<Users className="text-green-600" />} 
              />
            ) : (
              <StatCard 
                label="Topics Mastered" 
                value={data?.by_competency.length || 0} 
                icon={<TrendingUp className="text-orange-600" />} 
              />
            )}
            <StatCard 
              label="Platform Rank" 
              value="#12" 
              icon={<Trophy className="text-yellow-600" />} 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 4. PERFORMANCE BY SUBJECT */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Competency Breakdown</h3>
                <div className="space-y-6">
                  {data?.by_competency.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-700">{item.competency_area__name}</span>
                        <span className="text-sm font-bold text-indigo-600">{item.average_score.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.average_score}%` }}
                          className={`h-2 rounded-full ${item.average_score >= 75 ? 'bg-green-500' : item.average_score >= 50 ? 'bg-indigo-500' : 'bg-rose-500'}`}
                        />
                      </div>
                    </div>
                  ))}
                  {data?.by_competency.length === 0 && <p className="text-slate-400 text-center py-10 italic">No data yet</p>}
                </div>
              </div>

              {/* 5. RECENT ACTIVITY */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900">Recent Exam History</h3>
                  <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All</button>
                </div>
                <div className="divide-y divide-slate-50">
                  {data?.history.map((exam) => (
                    <div key={exam.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${exam.score >= 50 ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                          <Trophy size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{exam.competency_area__name}</p>
                          <p className="text-xs text-slate-500 font-medium">{new Date(exam.end_time).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-black text-lg ${exam.score >= 50 ? 'text-green-600' : 'text-rose-600'}`}>{exam.score.toFixed(0)}%</p>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:translate-x-1 transition-transform" size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 6. RIGHT SIDEBAR (Quick Actions/Status) */}
            <div className="space-y-6">
              <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-2">Ready to test?</h3>
                  <p className="text-indigo-100 text-sm mb-6">Challenge yourself with a full simulated exam under national conditions.</p>
                  <button 
                    onClick={() => navigate('/exams')}
                    className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-bold shadow-lg hover:bg-indigo-50 transition-all active:scale-95"
                  >
                    Start New Exam
                  </button>
                </div>
                <div className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform duration-500">
                  <Trophy size={140} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-4">Study Tip</h4>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-sm text-amber-800 italic">"Focus on Nursing Ethics this week. Students who practice consistently score 15% higher on average."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function NavItem({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-indigo-300 hover:text-white hover:bg-white/5'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon, trend, color = "bg-white" }: { label: string, value: string | number, icon: any, trend?: string, color?: string }) {
  return (
    <div className={`${color} p-6 rounded-[28px] border border-slate-200/60 shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
        {trend && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">{trend}</span>}
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}
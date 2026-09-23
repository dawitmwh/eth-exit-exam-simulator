import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  BookOpen, FileQuestion, BarChart3, Users, 
  LayoutGrid, Plus, PieChart, Info, Trophy,
} from 'lucide-react';
import { motion } from 'motion/react';

// Real Data Hooks
import { useDashboardData } from './data/DashboardData';
import { ExamData } from './data/ExamData';

// Sub-Managers
import CompetencyAreasManager from './CompetencyAreasManager';
import QuestionsManager from './QuestionsManager';

export default function MainAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // FETCHING REAL DATA
  const { data, loading, error } = useDashboardData();
  const { competencies } = ExamData();

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
       <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
       <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Loading Analytics...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8">
      
      {/* 1. SECTION HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Institutional Command</h1>
          <p className="text-slate-500 font-medium">Manage curriculum, questions, and track university performance.</p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="rounded-xl border-slate-200 bg-white" onClick={() => window.location.reload()}>
              Refresh Data
           </Button>
        </div>
      </header>

      {/* 2. NAVIGATION TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-slate-200/50 p-1.5 rounded-2xl h-14">
          <TabsTrigger value="overview" className="px-8 rounded-xl font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <BarChart3 className="size-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="competency" className="px-8 rounded-xl font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <BookOpen className="size-4 mr-2" /> Competency Areas
          </TabsTrigger>
          <TabsTrigger value="questions" className="px-8 rounded-xl font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <FileQuestion className="size-4 mr-2" /> Question Bank
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 mt-0 focus-visible:outline-none">
          
          {/* 3. TOP METRICS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard label="Global Bank" value={data?.metrics.total_questions || 0} sub="Total Questions" icon={<FileQuestion />} />
            <MetricCard label="Curriculum" value={competencies.length} sub="Active Subjects" icon={<BookOpen />} />
            <MetricCard label="Enrollment" value={data?.metrics.peer_count || 0} sub="Registered Students" icon={<Users />} />
            <MetricCard label="Activity" value={data?.overall.total_exams || 0} sub="Exam Attempts" icon={<Trophy />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SUBJECT DISTRIBUTION */}
            <Card className="rounded-[32px] border-none shadow-sm p-8 bg-white">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <PieChart size={20} className="text-indigo-600" /> Subject Distribution
              </h3>
              <div className="space-y-6">
                {competencies.map((exam) => {
                  const total = data?.metrics.total_questions || 1;
                  const percentage = (exam.question_count / total) * 100;
                  return (
                    <div key={exam.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-slate-700">{exam.name}</span>
                        <span className="text-indigo-600 font-black">{exam.question_count} Qs</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{width: 0}} animate={{width: `${percentage}%`}} className="h-full bg-indigo-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* QUICK ACTIONS */}
            <Card className="rounded-[32px] border-none shadow-sm p-8 bg-indigo-900 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-6">Management Shortcuts</h3>
                <div className="grid gap-4">
                  <ActionButton 
                    icon={<Plus />} 
                    title="Add New Question" 
                    desc="Support for LaTeX & Math"
                    onClick={() => setActiveTab('questions')} 
                  />
                  <ActionButton 
                    icon={<LayoutGrid />} 
                    title="Faculty Structure" 
                    desc="Manage departments"
                    onClick={() => navigate('/admin/departments')} 
                  />
                </div>
              </div>
              <LayoutGrid size={180} className="absolute -right-10 -bottom-10 opacity-5" />
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competency" className="mt-0">
          <CompetencyAreasManager />
        </TabsContent>

        <TabsContent value="questions" className="mt-0">
          {/* We pass MathInput here internally inside QuestionsManager */}
          <QuestionsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- REUSABLE UI ATOMS ---

function MetricCard({ label, value, sub, icon }: any) {
  return (
    <Card className="p-6 rounded-[32px] border-none shadow-sm bg-white hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">{icon}</div>
        <Badge variant="outline" className="text-[10px] font-bold border-slate-100 uppercase text-slate-400">Live</Badge>
      </div>
      <p className="text-3xl font-black text-slate-900">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
    </Card>
  );
}

function ActionButton({ icon, title, desc, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all text-left group">
       <div className="p-3 bg-white text-indigo-900 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
       <div>
          <p className="font-bold text-sm">{title}</p>
          <p className="text-xs text-indigo-300">{desc}</p>
       </div>
    </button>
  );
}

 
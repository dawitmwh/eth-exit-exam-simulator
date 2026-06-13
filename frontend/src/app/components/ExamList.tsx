import apiClient from '../api/client';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BookOpen, Clock, Target, Lock, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { ExamData } from '../pages/admin/data/ExamData';


export function ExamList() {
  const navigate = useNavigate();
  const { competencies, loading } = ExamData();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center md:ml-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen md:ml-64 bg-slate-50/50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Available Exams</h1>
        <p className="text-sm text-slate-500">Select a competency area to begin</p>
      </header>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="practice" className="space-y-8">
          <TabsList className="bg-slate-200/50 p-1">
            <TabsTrigger value="practice" className="px-8">Practice Mode</TabsTrigger>
            <TabsTrigger value="simulated" className="px-8">Simulated Exam</TabsTrigger>
          </TabsList>

          {/* Practice Mode Content */}
          <TabsContent value="practice">
            <header className="mb-6">
               <h2 className="text-lg font-semibold text-blue-700">Practice & Learn</h2>
               <p className="text-sm text-slate-500">Feedback provided after every question. No timer.</p>
            </header>
            <ExamGrid competencies={competencies} mode="practice" navigate={navigate} />
          </TabsContent>

          {/* Simulated Mode Content */}
          <TabsContent value="simulated">
            <header className="mb-6">
               <h2 className="text-lg font-semibold text-orange-700">Mock Exam</h2>
               <p className="text-sm text-slate-500">Timed conditions. Results calculated at the end.</p>
            </header>
            <ExamGrid competencies={competencies} mode="simulated" navigate={navigate} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// 3. Updated ExamGrid component to use real data
function ExamGrid({ competencies, mode, navigate }: { competencies: any[], mode: string, navigate: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {competencies.map((exam, index) => (
        <motion.div
          key={exam.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card  className="p-6 hover:shadow-xl transition-all h-full flex flex-col relative overflow-hidden">
            <div className="flex-1">
              {/* Mapping department to a Badge */}
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none px-3 py-1">
                {exam.department_name}
              </Badge>

              <h3 className="font-bold text-xl mt-4 text-slate-900 leading-tight">
                {exam.name}
              </h3>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="p-1.5 bg-slate-100 rounded-md"><BookOpen className="w-4 h-4" /></div>
                  <span className="text-sm font-medium">{exam.question_count} Questions</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="p-1.5 bg-slate-100 rounded-md"><Clock className="w-4 h-4" /></div>
                  <span className="text-sm font-medium">{exam.duration_minutes} Minutes</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="p-1.5 bg-slate-100 rounded-md"><Target className="w-4 h-4" /></div>
                  <span className="text-sm font-medium uppercase tracking-wider text-xs">{mode} Mode</span>
                </div>
              </div>
            </div>

            <Button
              className={`w-full mt-6 py-6 font-bold shadow-lg shadow-indigo-200 transition-all ${
                mode === 'practice' ? 'primary-600 hover:primary-700' : 'bg-orange-600 hover:bg-orange-700'
              }`}
              // Pass the mode as a URL parameter
              onClick={() => navigate(`/exam/${exam.id}?mode=${mode}`)}
            >
              <Play className="w-4 h-4 mr-2 fill-current" />
              Begin Session
            </Button>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}


 
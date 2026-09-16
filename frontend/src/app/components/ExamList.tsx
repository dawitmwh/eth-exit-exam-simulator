import { useNavigate } from 'react-router';
import { 
  BookOpen, Clock, Target, Play, 
  Loader2, Sparkles, Zap, Award 
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ExamData } from '../pages/admin/data/ExamData';

export function ExamList() {
  const navigate = useNavigate();
  const { competencies, loading } = ExamData();

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Curriculm...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8">
      
      {/* 1. SECTION HEADER */}
      <header className="relative overflow-hidden bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm mb-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-4">
               <Sparkles size={12} className="fill-current" /> Exam Catalog
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
              Master Your Competencies
            </h1>
            <p className="text-slate-500 mt-2 font-medium max-w-xl">
              Choose a subject area to begin. Use Practice Mode for learning or Simulated Mode to test your speed and accuracy.
            </p>
          </div>
          <div className="hidden lg:block opacity-20">
             <BookOpen size={100} className="text-indigo-900" />
          </div>
        </div>
      </header>
       <Card 
              className="bg-primary text-white p-8 rounded-[40px] shadow-2xl cursor-pointer"
              onClick={() => navigate('/exam/full-mock?mode=simulated')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <Badge className="bg-white/10 text-emerald-200 border-none mb-3">DEPARTMENT-WIDE</Badge>
                  <h2 className="text-3xl font-black italic">EXIT MOCK SIMULATOR</h2>
                  <p className="opacity-60 text-sm mt-2 font-medium">Covers all focus areas in your curriculum.</p>
                </div>
                <div className="p-5 bg-white/10 rounded-3xl backdrop-blur-xl">
                  <Play size={32} />
                </div>
              </div>
            </Card>

      {/* 2. MODE SELECTION TABS */}
      <Tabs defaultValue="practice" className="space-y-8">
        <div className="flex justify-center md:justify-start">
          <TabsList className="bg-slate-200/50 p-1.5 rounded-2xl h-14">
            <TabsTrigger value="practice" className="px-8 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <Zap size={16} className="mr-2" /> Practice Mode
            </TabsTrigger>
            <TabsTrigger value="simulated" className="px-8 rounded-xl font-bold data-[state=active]:bg-orange-600 data-[state=active]:text-white transition-all">
              <Award size={16} className="mr-2" /> Simulated Exam
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content for Practice Mode */}
        <TabsContent value="practice" className="mt-0 focus-visible:outline-none">
          <div className="mb-8 p-6 bg-indigo-50/50 border border-indigo-100 rounded-3xl">
            <p className="text-sm font-bold text-primary/90 flex items-center gap-2">
              <Sparkles size={16} /> LEARNING TIPS
            </p>
            <p className="text-xs text-primary/95 mt-1">In practice mode, you will see immediate feedback and explanations for every question. No pressure, just progress.</p>
          </div>
          <ExamGrid competencies={competencies} mode="practice" navigate={navigate} />
        </TabsContent>

        {/* Content for Simulated Mode */}
        <TabsContent value="simulated" className="mt-0 focus-visible:outline-none">
          <div className="mb-8 p-6 bg-orange-50/50 border border-orange-100 rounded-3xl">
            <p className="text-sm font-bold text-orange-800 flex items-center gap-2">
              <Target size={16} /> EXAM READINESS
            </p>
            <p className="text-xs text-orange-600 mt-1">Strict MoE conditions apply. Full timer enabled. Final results will be calculated only after submission.</p>
          </div>
          <ExamGrid competencies={competencies} mode="simulated" navigate={navigate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- REUSABLE EXAM GRID ---
function ExamGrid({ competencies, mode, navigate }: { competencies: any[], mode: string, navigate: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {competencies.map((exam, index) => (
        <motion.div
          key={exam.id}
          whileHover={{ y: -8 }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          <Card className="group relative bg-white rounded-[32px] p-8 border-none shadow-sm hover:shadow-2xl hover:shadow-indigo-100 transition-all flex flex-col h-full overflow-hidden">
            
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full transition-transform duration-500 group-hover:scale-150 ${mode === 'practice' ? 'bg-indigo-50' : 'bg-orange-50'}`} />

            <div className="relative z-10 flex-1">
              <Badge className={`px-4 py-1.5 rounded-full border-none font-bold uppercase tracking-widest text-[10px] ${mode === 'practice' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                {exam.department_name}
              </Badge>
               <Badge className={`px-4 py-1.5 rounded-full border-none font-bold uppercase tracking-widest text-[10px] ${mode === 'practice' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                 {exam.book_title}  
               </Badge>

              <h3 className="font-black text-2xl mt-6 text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                {exam.name}
              </h3>

              <div className="mt-8 space-y-4">
                <InfoRow icon={<BookOpen size={16} />} label="Total Bank" value={`${exam.question_count} Questions`} />
                <InfoRow icon={<Clock size={16} />} label="Alloted Time" value={`${exam.duration_minutes} Minutes`} />
                <InfoRow icon={<Target size={16} />} label="Session Type" value={mode === 'practice' ? 'Untimed Practice' : 'MoE Simulation'} />
              </div>
            </div>

            <Button
              className={`w-full mt-10 py-8 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 ${
                mode === 'practice' 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200' 
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200'
              }`}
              onClick={() => navigate(`/exam/${exam.id}?mode=${mode}`)}
            >
              <Play className="w-5 h-5 mr-3 fill-current" />
              Begin {mode === 'practice' ? 'Learning' : 'Exam'}
            </Button>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// --- HELPER COMPONENT ---
function InfoRow({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 text-slate-600 group/row">
      <div className="p-2.5 bg-slate-50 rounded-xl group-hover/row:bg-white group-hover/row:shadow-sm transition-all border border-slate-100">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-black text-slate-700">{value}</span>
      </div>
    </div>
  );
}





// import apiClient from '../api/client';
// import { Loader2 } from 'lucide-react';
// import { useNavigate } from 'react-router';
// import { Card } from './ui/card';
// import { Button } from './ui/button';
// import { Badge } from './ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
// import { BookOpen, Clock, Target, Lock, Play } from 'lucide-react';
// import { motion } from 'motion/react';
// import { ExamData } from '../pages/admin/data/ExamData';


// export function ExamList() {
//   const navigate = useNavigate();
//   const { competencies, loading } = ExamData();

//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center md:ml-64">
//         <Loader2 className="w-8 h-8 animate-spin text-primary" />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen md:ml-64 bg-slate-50/50">
//       <header className="bg-white border-b border-slate-200 sticky top-0 z-10 p-6">
//         <h1 className="text-2xl font-bold text-slate-900">Available Exams</h1>
//         <p className="text-sm text-slate-500">Select a competency area to begin</p>
//       </header>

//       <div className="container max-w-7xl mx-auto px-4 py-8">
//         <Tabs defaultValue="practice" className="space-y-8">
//           <TabsList className="bg-slate-200/50 p-1">
//             <TabsTrigger value="practice" className="px-8">Practice Mode</TabsTrigger>
//             <TabsTrigger value="simulated" className="px-8">Simulated Exam</TabsTrigger>
//           </TabsList>

//           {/* Practice Mode Content */}
//           <TabsContent value="practice">
//             <header className="mb-6">
//                <h2 className="text-lg font-semibold text-blue-700">Practice & Learn</h2>
//                <p className="text-sm text-slate-500">Feedback provided after every question. No timer.</p>
//             </header>
//             <ExamGrid competencies={competencies} mode="practice" navigate={navigate} />
//           </TabsContent>

//           {/* Simulated Mode Content */}
//           <TabsContent value="simulated">
//             <header className="mb-6">
//                <h2 className="text-lg font-semibold text-orange-700">Mock Exam</h2>
//                <p className="text-sm text-slate-500">Timed conditions. Results calculated at the end.</p>
//             </header>
//             <ExamGrid competencies={competencies} mode="simulated" navigate={navigate} />
//           </TabsContent>
//         </Tabs>
//       </div>
//     </div>
//   );
// }

// // 3. Updated ExamGrid component to use real data
// function ExamGrid({ competencies, mode, navigate }: { competencies: any[], mode: string, navigate: any }) {
//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//       {competencies.map((exam, index) => (
//         <motion.div
//           key={exam.id}
//           initial={{ opacity: 0, y: 15 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: index * 0.05 }}
//         >
//           <Card  className="p-6 hover:shadow-xl transition-all h-full flex flex-col relative overflow-hidden">
//             <div className="flex-1">
//               {/* Mapping department to a Badge */}
//               <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none px-3 py-1">
//                 {exam.department_name}
//               </Badge>

//               <h3 className="font-bold text-xl mt-4 text-slate-900 leading-tight">
//                 {exam.name}
//               </h3>

//               <div className="mt-6 space-y-3">
//                 <div className="flex items-center gap-3 text-slate-600">
//                   <div className="p-1.5 bg-slate-100 rounded-md"><BookOpen className="w-4 h-4" /></div>
//                   <span className="text-sm font-medium">{exam.question_count} Questions</span>
//                 </div>
//                 <div className="flex items-center gap-3 text-slate-600">
//                   <div className="p-1.5 bg-slate-100 rounded-md"><Clock className="w-4 h-4" /></div>
//                   <span className="text-sm font-medium">{exam.duration_minutes} Minutes</span>
//                 </div>
//                 <div className="flex items-center gap-3 text-slate-600">
//                   <div className="p-1.5 bg-slate-100 rounded-md"><Target className="w-4 h-4" /></div>
//                   <span className="text-sm font-medium uppercase tracking-wider text-xs">{mode} Mode</span>
//                 </div>
//               </div>
//             </div>

//             <Button
//               className={`w-full mt-6 py-6 font-bold shadow-lg shadow-indigo-200 transition-all ${
//                 mode === 'practice' ? 'primary-600 hover:primary-700' : 'bg-orange-600 hover:bg-orange-700'
//               }`}
//               // Pass the mode as a URL parameter
//               onClick={() => navigate(`/exam/${exam.id}?mode=${mode}`)}
//             >
//               <Play className="w-4 h-4 mr-2 fill-current" />
//               Begin Session
//             </Button>
//           </Card>
//         </motion.div>
//       ))}
//     </div>
//   );
// }


 
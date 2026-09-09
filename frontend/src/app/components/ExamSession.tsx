import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import apiClient from '../api/client';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { ArrowLeft, Clock, Flag, CheckCircle2, Loader2, LayoutGrid, AlertCircle, ChevronRight, BookOpen, Lightbulb} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { haptics } from '../utils/haptics';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

import { SmartMathText } from './MathRender';

// --- SHARED UI COMPONENT: QUESTION NAVIGATOR GRID ---
const QuestionGrid = ({ questions, currentQuestion, selectedAnswers, flaggedQuestions, onJump }: any) => (
  <div className="grid grid-cols-5 gap-2.5">
    {questions.map((q: any, index: number) => {
      const isCurrent = index === currentQuestion;
      const isAnswered = selectedAnswers[q.id] !== undefined;
      const isFlagged = flaggedQuestions.includes(q.id);
      
      return (
        <button
          key={q.id}
          onClick={() => onJump(index)}
          className={`h-11 rounded-xl text-xs font-bold transition-all relative border-2 ${
            isCurrent 
              ? 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-100' 
              : isFlagged
              ? 'bg-amber-50 text-amber-700 border-amber-400'
              : isAnswered 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
              : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'
          }`}
        >
          {index + 1}
          {isFlagged && !isCurrent && (
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white" />
          )}
        </button>
      );
    })}
  </div>
);

export function ExamSession() {
  const { examId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isPracticeMode = searchParams.get('mode') === 'practice';
  
  // Logic States
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [timePerQuestion, setTimePerQuestion] = useState<{ [key: number]: number }>({});
  const [lastTimestamp, setLastTimestamp] = useState(Date.now());
  
  // --- 1. NAVIGATION & GESTURES ---
  const handleNext = useCallback(() => {
    if (currentQuestion < questions.length - 1) setCurrentQuestion((p) => p + 1);
  }, [currentQuestion, questions.length]);

  const handlePrevious = useCallback(() => {
    if (currentQuestion > 0) setCurrentQuestion((p) => p - 1);
  }, [currentQuestion]);

  useSwipeGesture({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrevious,
  });

  // --- 2. SESSION INITIALIZATION ---
  useEffect(() => {
    const initializeSession = async () => {
      if (!examId) { setError('Missing Exam ID'); setLoading(false); return; }

      try {
        setLoading(true);
        const savedSessionKey = `active_session_exam_${examId}`;
        const existingSessionId = localStorage.getItem(savedSessionKey);

        let currentAttemptId: number;

        if (existingSessionId) {
          currentAttemptId = parseInt(existingSessionId);
          // Load Flags and Progress
          const flags = localStorage.getItem(`exam_flags_${currentAttemptId}`);
          if (flags) setFlaggedQuestions(JSON.parse(flags));
          const progress = localStorage.getItem(`exam_progress_${currentAttemptId}`);
          if (progress) setSelectedAnswers(JSON.parse(progress));
        } else {
          const res = await apiClient.post('/exam-attempts/', { competency_area: Number(examId), status: 'STARTED' });
          currentAttemptId = res.data.id;
          localStorage.setItem(savedSessionKey, currentAttemptId.toString());
        }
        setAttemptId(currentAttemptId);

        // Fetch Content
        const resp = await apiClient.get(`/questions/?competency_area=${examId}`);
        const rawData = resp.data?.results ?? resp.data;

        if (!Array.isArray(rawData) || rawData.length === 0) {
          setQuestions([]);
        } else {
          const normalized = rawData.map((q: any) => ({
            id: q.id,
            text: q.text ?? q.question_text ?? q.title,
            explanation: q.explanation ?? null,
            options: q.options ?? q.question_options ?? [],
            duration_minutes: q.duration_minutes ?? 60,
          }));
          setQuestions(normalized);
          

          // Timer Persistence Logic
          const startTimeKey = `exam_start_time_${currentAttemptId}`;
          let startTime = localStorage.getItem(startTimeKey);
          if (!startTime) {
            startTime = new Date().toISOString();
            localStorage.setItem(startTimeKey, startTime);
          }
          const elapsed = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 1000);
          const totalSeconds = normalized[0].duration_minutes * 60;
          setTimeLeft(Math.max(totalSeconds - elapsed, 0));
          setQuestionStartTime(Date.now());
        }
      } catch (err) {
        setError('Connection lost. Please check your internet.');
      } finally {
        setLoading(false);
      }
    };
    initializeSession();
  }, [examId]);

  // Add this new useEffect
useEffect(() => {
  if (questions.length === 0) return;

  // 1. Calculate how long they spent on the PREVIOUS question
  const now = Date.now();
  const secondsSpent = Math.floor((now - lastTimestamp) / 1000);

  // We need to know which question they just CAME from. 
  // But useEffect runs AFTER currentQuestion changes. 
  // So we use a cleanup function to save data for the question we are LEAVING.
  return () => {
    const endTimestamp = Date.now();
    const delta = Math.floor((endTimestamp - now) / 1000);
    const qId = questions[currentQuestion]?.id;

    if (qId) {
      setTimePerQuestion(prev => ({
        ...prev,
        [qId]: (prev[qId] || 0) + delta
      }));
    }
  };
}, [currentQuestion, questions.length]);

// Update the timestamp when the question actually changes
useEffect(() => {
    setLastTimestamp(Date.now());
}, [currentQuestion]);

  // --- 3. TIMER LOOP ---
  useEffect(() => {
    if (timeLeft === null || isPracticeMode || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev && prev <= 1) { clearInterval(timer); handleSubmitExam(); return 0; }
        return prev ? prev - 1 : 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isPracticeMode]);

  // --- 4. ACTION HANDLERS ---
  const handleAnswerSelect = (optionId: number) => {
      haptics.selection?.();
      
      const qId = questions[currentQuestion].id;
      const updatedAnswers = { ...selectedAnswers, [qId]: optionId };
      
      setSelectedAnswers(updatedAnswers);
      
      if (attemptId) {
        localStorage.setItem(`exam_progress_${attemptId}`, JSON.stringify(updatedAnswers));
      }
    };

  const toggleFlag = () => {
    const qId = questions[currentQuestion].id;
    const updatedFlags = flaggedQuestions.includes(qId) 
      ? flaggedQuestions.filter(id => id !== qId) 
      : [...flaggedQuestions, qId];
    setFlaggedQuestions(updatedFlags);
    if (attemptId) localStorage.setItem(`exam_flags_${attemptId}`, JSON.stringify(updatedFlags));
    haptics.selection?.();
  };

  const handleSubmitExam = async () => {
    if (!attemptId || isSubmitting) return;

    const finalNow = Date.now();
    const finalDelta = Math.floor((finalNow - lastTimestamp) / 1000);
    const lastQId = questions[currentQuestion].id;

    const finalTimePerQuestion = {
      ...timePerQuestion,
      [lastQId]: (timePerQuestion[lastQId] || 0) + finalDelta
    };

    
    if (flaggedQuestions.length > 0) {
      const confirm = window.confirm(`Review Alert: You have ${flaggedQuestions.length} flagged questions. Submit anyway?`);
      if (!confirm) return;
    }

    setIsSubmitting(true);
    const answers = Object.entries(selectedAnswers).map(([qId, oId]) => ({
      question_id: Number(qId),
      selected_option_id: oId,
      time_spent: finalTimePerQuestion[Number(qId)] || 0,
    }));

    try {
      const res = await apiClient.post(`/exam-attempts/${attemptId}/submit_exam/`, { answers });
      // Cleanup Storage
      localStorage.removeItem(`active_session_exam_${examId}`);
      localStorage.removeItem(`exam_progress_${attemptId}`);
      localStorage.removeItem(`exam_start_time_${attemptId}`);
      localStorage.removeItem(`exam_flags_${attemptId}`);

      toast.success(`Session Complete! Score: ${res.data.score}%`);
      navigate('/', { state: { examCompleted: true, score: res.data.score }, replace: true });
    } catch (err) {
      toast.error("Submission failed. We've saved your progress locally.");
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600 mb-4" /><p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Constructing Exam...</p></div>;
  if (error || questions.length === 0) return <div className="h-screen flex flex-col items-center justify-center p-10"><AlertCircle className="text-rose-500 mb-4" size={48} /><p className="text-slate-900 font-bold">{error || "No questions configured."}</p><Button onClick={() => navigate(-1)} variant="outline" className="mt-6 rounded-xl">Go Back</Button></div>;

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isCurrentFlagged = flaggedQuestions.includes(question.id);
  const isCurrentAnswered = question ? selectedAnswers[question.id] !== undefined : false;

 

 
  return (
  <div className="h-screen max-h-screen bg-slate-50 flex flex-col overflow-hidden font-sans selection:bg-indigo-100">
    
    {/* 1. ULTRA-COMPACT INSTRUMENT HEADER */}
    <header className="shrink-0 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-2.5 z-50 shadow-sm">
      <div className="container max-w-7xl mx-auto flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowExitDialog(true)} 
          className="h-10 gap-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> 
          <span className="hidden sm:inline font-black uppercase text-[10px] tracking-[0.15em]">End Session</span>
        </Button>

        <div className="flex items-center gap-5">
          {!isPracticeMode && (
            <div className={`flex items-center gap-3 px-4 py-1.5 rounded-2xl border ${timeLeft && timeLeft < 300 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-900'}`}>
              <Clock className="w-4 h-4" /> 
              <span className="font-mono font-black text-lg tracking-tighter">{formatTime(timeLeft)}</span>
            </div>
          )}
          
          <div className="hidden md:flex items-center bg-indigo-50 px-4 py-1.5 rounded-2xl border border-indigo-100">
            <span className="text-indigo-700 font-black text-[10px] uppercase tracking-widest">
              {Object.keys(selectedAnswers).length} / {questions.length} Completed
            </span>
          </div>

          <Button 
            variant="outline" 
            size="icon" 
            className="md:hidden h-10 w-10 border-slate-200 text-indigo-600 rounded-xl bg-white shadow-sm" 
            onClick={() => setIsMobileNavOpen(true)}
          >
            <LayoutGrid size={20} />
          </Button>
        </div>
      </div>
      {/* Precision Progress Bar */}
      <div className="container max-w-7xl mx-auto mt-2 px-1">
        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
          />
        </div>
      </div>
    </header>

    {/* 2. MAIN WORKSPACE (Locked to Viewport) */}
    <div className="flex-1 container max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4 p-4 md:p-6 overflow-hidden">  
        
      {/* LEFT COLUMN: THE QUESTION STAGE */}
      <main className="flex flex-col h-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentQuestion} 
            className="flex-1 overflow-y-auto custom-scrollbar pr-1"
            initial={{ opacity: 0, x: 10 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -10 }} 
            transition={{ duration: 0.2 }}
          >
            <Card className="p-6 md:p-10 border-none shadow-2xl shadow-indigo-900/5 rounded-[40px] bg-white relative ring-1 ring-slate-200/50">
              
              {/* Question Meta Header */}
              <div className="mb-8 flex justify-between items-center">
                <Badge className="bg-slate-900 text-white border-none px-4 py-1 font-black text-[10px] uppercase tracking-[0.2em] rounded-lg">
                  Question {currentQuestion + 1}
                </Badge>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleFlag}
                  className={`h-9 rounded-xl px-4 transition-all border ${isCurrentFlagged ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-sm' : 'text-slate-400 border-transparent'}`}
                >
                  <Flag className={`w-4 h-4 ${isCurrentFlagged ? 'fill-current' : ''}`} />
                  <span className="font-bold uppercase text-[10px] tracking-widest ml-2">{isCurrentFlagged ? 'Flagged' : 'Flag'}</span>
                </Button>
              </div>
              
              {/* --- QUESTION CONTENT (Justified) --- */}
              <div className="mb-10">
                <h2 className="text-xl md:text-3xl font-bold text-slate-900 leading-[1.4] text-justify tracking-tight [hyphens:auto]">
                  <SmartMathText text={question.text} />
                </h2>
              </div>

              {/* --- CHOICE GRID (2x2 on Desktop) --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                {question.options.map((opt: any, idx: number) => {
                  const isSelected = selectedAnswers[question.id] === opt.id;
                  const isAnswered = selectedAnswers[question.id] !== undefined;
                  
                  // PREMIUM STATE LOGIC
                  let stateStyle = "border-slate-100 bg-slate-50/30 text-slate-600";
                  let indicatorStyle = "bg-white border-slate-200 text-slate-400";

                  if (isPracticeMode && isAnswered) {
                    if (opt.is_correct) {
                      stateStyle = "border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20";
                      indicatorStyle = "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200";
                    } else if (isSelected && !opt.is_correct) {
                      stateStyle = "border-rose-400 bg-rose-50 text-rose-900";
                      indicatorStyle = "bg-rose-500 border-rose-500 text-white";
                    }
                  } else if (isSelected) {
                    stateStyle = "border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-4 ring-indigo-50";
                    indicatorStyle = "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200";
                  }

                  return (
                    <motion.button
                      key={opt.id}
                      whileHover={!(isPracticeMode && isAnswered) ? { scale: 1.01 } : {}}
                      whileTap={!(isPracticeMode && isAnswered) ? { scale: 0.98 } : {}}
                      disabled={isPracticeMode && isAnswered}
                      onClick={() => handleAnswerSelect(opt.id)}
                      className={`group text-left p-5 rounded-[24px] border-2 transition-all duration-300 flex items-center gap-4 relative overflow-hidden ${stateStyle}`}
                    >
                      {/* Animated Letter Badge */}
                      <div className={`shrink-0 w-8 h-8 rounded-xl border-2 flex items-center justify-center font-black text-xs transition-all duration-500 ${indicatorStyle}`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      
                      <span className="flex-1 font-bold text-sm md:text-base leading-snug">
                        <SmartMathText text={opt.option_text} />
                      </span>

                      {/* Status Icon */}
                      {isPracticeMode && isAnswered && opt.is_correct && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-600 bg-white rounded-full p-0.5 shadow-sm">
                           <CheckCircle2 size={20} />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* --- PRACTICE MODE COACHING PANEL --- */}
              <AnimatePresence>
                {isPracticeMode && isCurrentAnswered && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                    animate={{ opacity: 1, height: 'auto', marginTop: 32 }} 
                    className="border-t border-slate-100 pt-8"
                  >
                    <div className="p-6 md:p-8 bg-amber-50/40 rounded-[32px] border border-amber-100 relative group overflow-hidden">
                      {/* Decorative background lightbulb */}
                      <Lightbulb className="absolute -right-4 -bottom-4 text-amber-200/30 rotate-12" size={120} />
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                           <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                             <Lightbulb size={16} fill="currentColor" />
                           </div>
                           <span className="font-black text-[10px] uppercase tracking-[0.2em] text-amber-800">Learning Insight</span>
                        </div>
                        
                        <div className="flex items-baseline gap-2 mb-4">
                           <span className="text-xs font-bold text-amber-900/40 uppercase">Correct Answer:</span>
                           <span className="text-xl font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg">
                              {String.fromCharCode(65 + question.options.findIndex((o: any) => o.is_correct))}
                           </span>
                        </div>

                        <p className="text-slate-700 text-sm md:text-base leading-relaxed text-justify font-medium italic">
                          {question.explanation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* --- COMPACT FOOTER NAVIGATION --- */}
        <div className="shrink-0 flex items-center justify-between py-5 bg-slate-50/80 backdrop-blur-sm px-2">
          <Button 
            variant="outline" 
            onClick={handlePrevious} 
            disabled={currentQuestion === 0} 
            className="h-14 px-8 rounded-2xl font-black border-slate-200 text-slate-500 hover:bg-white hover:text-indigo-600 transition-all shadow-sm active:scale-95"
          >
             <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          {currentQuestion === questions.length - 1 ? (
            <Button 
              onClick={handleSubmitExam} 
              disabled={isSubmitting} 
              className="h-14 px-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xl shadow-emerald-200 active:scale-95 transition-all"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : 'Finish & Submit Exam'}
            </Button>
          ) : (
            <Button 
              onClick={handleNext} 
              className="h-14 px-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-200 active:scale-95 transition-all"
            >
              Next Challenge <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </main>

      {/* RIGHT COLUMN: THE STUDIO NAVIGATOR */}
      <aside className="hidden md:block h-full overflow-hidden">
        <Card className="h-full flex flex-col p-7 border-none shadow-2xl shadow-indigo-950/5 rounded-[40px] bg-white ring-1 ring-slate-200/50">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
               <LayoutGrid size={18} /> 
            </div>
            <span className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Exam Map</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
             <QuestionGrid 
                questions={questions} 
                currentQuestion={currentQuestion} 
                selectedAnswers={selectedAnswers} 
                flaggedQuestions={flaggedQuestions}
                onJump={(idx: number) => {
                   setCurrentQuestion(idx);
                   haptics.selection?.();
                }} 
              />
          </div>

          {/* Dynamic Legend */}
          <div className="shrink-0 mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-y-4 gap-x-2">
             <LegendItem color="bg-indigo-600" label="Active" />
             <LegendItem color="bg-emerald-400" label="Done" />
             <LegendItem color="bg-amber-400" label="Flagged" />
             <LegendItem color="bg-slate-100" label="Open" />
          </div>
        </Card>
      </aside>
    </div>
    
    {/* --- MOBILE OVERLAY (Drawer) --- */}
    <AnimatePresence>
      {isMobileNavOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileNavOpen(false)} className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm z-[60] md:hidden" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 inset-x-0 bg-white rounded-t-[48px] p-10 z-[70] md:hidden shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-10" />
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-8">Jump to Task</h3>
            <div className="max-h-[50vh] overflow-y-auto pb-10">
              <QuestionGrid 
                questions={questions} currentQuestion={currentQuestion} selectedAnswers={selectedAnswers} 
                flaggedQuestions={flaggedQuestions} onJump={(idx: number) => { setCurrentQuestion(idx); setIsMobileNavOpen(false); }} 
              />
            </div>
            <Button className="w-full h-16 rounded-3xl bg-indigo-600 text-white font-black text-lg" onClick={() => setIsMobileNavOpen(false)}>Return to Exam</Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>


      {/* 4. EXIT DIALOG */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="rounded-[32px] p-10 border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-slate-900">Abort Session?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium text-lg">
              Your progress is saved on this computer, but the timer will continue to run. Are you sure you want to exit?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-14 rounded-2xl border-slate-200 font-bold">Stay & Finish</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/')} className="h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold">Yes, Exit Exam</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- HELPER ATOMS ---
function LegendItem({ color, label }: { color: string, label: string }) {
    return (
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span>{label}</span>
        </div>
    )
}










// import React, { useCallback, useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router';
// import apiClient from '../api/client';
// import { Button } from './ui/button';
// import { Card } from './ui/card';
// import { Progress } from './ui/progress';
// import { Badge } from './ui/badge';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from './ui/alert-dialog';
// import { ArrowLeft, Clock, Flag, CheckCircle2, Loader2, LayoutGrid } from 'lucide-react';
// import { motion, AnimatePresence } from 'motion/react';
// import { toast } from 'sonner';
// import { haptics } from '../utils/haptics';
// import { useSwipeGesture } from '../hooks/useSwipeGesture';


// export function ExamSession() {
 
  
//   // Existing States
//   const { examId } = useParams();
//   const navigate = useNavigate();
//   const [currentQuestion, setCurrentQuestion] = useState(0);
//   const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
//   const [showExitDialog, setShowExitDialog] = useState(false);
//   const [timeLeft, setTimeLeft] = useState<number | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [questions, setQuestions] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [attemptId, setAttemptId] = useState<number | null>(null);
//   const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
//   const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  
  
//   // --- HELPER COMPONENT (Blueprint for the Grid) ---
// const QuestionGrid = ({ questions, currentQuestion, selectedAnswers, onJump }: any) => (
//   <div className="grid grid-cols-5 gap-2">
//     {questions.map((q: any, index: number) => {
//       const isCurrent = index === currentQuestion;
//       const isAnswered = selectedAnswers[q.id] !== undefined;
//       const isFlagged = flaggedQuestions.includes(q.id); 
      
//       return (
//         <button
//           key={q.id}
//           onClick={() => onJump(index)}
//           className={`h-11 rounded-lg text-xs font-bold transition-all ${
//             isCurrent 
//               ? 'bg-violet-600 text-white ring-2 ring-black-200' 
//               : isFlagged
//               ? 'bg-orange-100 text-orange-700 border-2 border-orange-400'
//               : isAnswered 
//               ? 'bg-green-100 text-green-700 hover:bg-green-200' 
//               : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
//           }`}
//         >
//           {index + 1}
//           {/* Small flag dot indicator */}
//           {isFlagged && !isCurrent && (
//             <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full border border-white" />
//           )}
//         </button>
//       );
//     })}
//   </div>
// );

//   // --- 1. Navigation Logic (Maintaining Swipes) ---
//   const handleNext = useCallback(() => {
//     if (currentQuestion < questions.length - 1) setCurrentQuestion((p) => p + 1);
//   }, [currentQuestion, questions.length]);

//   const handlePrevious = useCallback(() => {
//     if (currentQuestion > 0) setCurrentQuestion((p) => p - 1);
//   }, [currentQuestion]);

//   useSwipeGesture({
//     onSwipeLeft: handleNext,
//     onSwipeRight: handlePrevious,
//   });

//   // --- 2. Session Logic (Exactly as your previous code) ---
//   useEffect(() => {
//     const initializeSession = async () => {
//       if (!examId) { setError('No exam ID'); setLoading(false); return; }

//       try {
//         setLoading(true);
//         const savedSessionKey = `active_session_exam_${examId}`;
//         const existingSessionId = localStorage.getItem(savedSessionKey);

//         let currentAttemptId: number;
//         if (existingSessionId) {
//           currentAttemptId = parseInt(existingSessionId);
//           // Load Flags from LocalStorage
//           const flagsKey = `exam_flags_${currentAttemptId}`;
//           const savedFlags = localStorage.getItem(flagsKey);
//           if (savedFlags) setFlaggedQuestions(JSON.parse(savedFlags));
//         } else {
//           const attemptResp = await apiClient.post('/exam-attempts/', {
//             competency_area: Number(examId),
//             status: 'STARTED'
//           });
//           currentAttemptId = attemptResp.data.id;
//           localStorage.setItem(savedSessionKey, currentAttemptId.toString());
//         }
//         setAttemptId(currentAttemptId);

//         const progressKey = `exam_progress_${currentAttemptId}`;
//         const savedProgress = localStorage.getItem(progressKey);
//         if (savedProgress) setSelectedAnswers(JSON.parse(savedProgress));

//         const resp = await apiClient.get(`/questions/?competency_area=${examId}`);
//         const rawData = resp.data?.results ?? resp.data;

//         if (!Array.isArray(rawData) || rawData.length === 0) {
//           setQuestions([]);
//         } else {
//           const normalized = rawData.map((q: any) => ({
//             id: q.id,
//             text: q.text ?? q.question_text ?? q.title,
//             explanation: q.explanation ?? null,
//             options: q.options ?? q.question_options ?? q.choices ?? [],
//             duration_minutes: q.duration_minutes ?? q.competency_area?.duration_minutes ?? 60,
//           }));
//           setQuestions(normalized);

//           const startTimeKey = `exam_start_time_${currentAttemptId}`;
//           let startTime = localStorage.getItem(startTimeKey);
//           if (!startTime) {
//             startTime = new Date().toISOString();
//             localStorage.setItem(startTimeKey, startTime);
//           }
//           const elapsed = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 1000);
//           const totalSeconds = normalized[0].duration_minutes * 60;
//           setTimeLeft(Math.max(totalSeconds - elapsed, 0));
//         }
//       } catch (err) {
//         setError('Failed to load questions');
//       } finally {
//         setLoading(false);
//       }
//     };
//     initializeSession();
//   }, [examId]);

//   const toggleFlag = () => {
//   const qId = questions[currentQuestion].id;
//   let updatedFlags: number[];

//   if (flaggedQuestions.includes(qId)) {
//     updatedFlags = flaggedQuestions.filter(id => id !== qId);
//   } else {
//     updatedFlags = [...flaggedQuestions, qId];
//   }

//   setFlaggedQuestions(updatedFlags);
//   if (attemptId) {
//     localStorage.setItem(`exam_flags_${attemptId}`, JSON.stringify(updatedFlags));
//   }
//   haptics.selection?.(); // Give a small haptic "click" when flagging
// };

//   // --- 3. Timer Loop ---
//   useEffect(() => {
//     if (timeLeft === null) return;
//     const timer = setInterval(() => {
//       setTimeLeft((prev) => {
//         if (prev === null || prev <= 1) {
//           clearInterval(timer);
//           handleSubmitExam();
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);
//     return () => clearInterval(timer);
//   }, [timeLeft]);

//   const formatTime = (seconds: number | null) => {
//     if (seconds === null) return "--:--";
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
//   };

//   const handleAnswerSelect = (optionId: number) => {
//     haptics.selection?.();
//     const updatedAnswers = {
//       ...selectedAnswers,
//       [questions[currentQuestion].id]: optionId,
//     };
//     setSelectedAnswers(updatedAnswers);
//     if (attemptId) {
//       localStorage.setItem(`exam_progress_${attemptId}`, JSON.stringify(updatedAnswers));
//     }
//   };

//   const handleSubmitExam = async () => {
//     if (!attemptId || isSubmitting) return;
//     setIsSubmitting(true);
//       const flagCount = flaggedQuestions.length;
//     const answers = Object.entries(selectedAnswers).map(([qId, oId]) => ({
//       question_id: Number(qId),
//       selected_option_id: oId,
//       time_spent: 0,
//     }));
//     try {
//       await apiClient.post(`/exam-attempts/${attemptId}/submit_exam/`, { answers });
//       localStorage.removeItem(`active_session_exam_${examId}`);
//       localStorage.removeItem(`exam_progress_${attemptId}`);
//       localStorage.removeItem(`exam_start_time_${attemptId}`);
//         if (flagCount > 0) {
//     const confirmFlags = window.confirm(`You still have ${flagCount} flagged questions. Are you sure you want to submit?`);
//     if (!confirmFlags) return;
//   }
  
//   // Proceed with existing submission logic...
//   // REMEMBER: Clear the flags from localStorage on success
//   localStorage.removeItem(`exam_flags_${attemptId}`);
//       toast.success("Exam Submitted!");
//       navigate('/', { replace: true });
//     } catch (err) {
//       toast.error("Submission failed");
//       setIsSubmitting(false);
//     }
//   };

//   // --- 4. Render Handling ---
//   if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
//   if (error || questions.length === 0) return <div className="p-10 text-center">{error || "No questions found."}</div>;

//   const question = questions[currentQuestion];
//   const progress = ((currentQuestion + 1) / questions.length) * 100;
//   const isCurrentFlagged = flaggedQuestions.includes(question.id);

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header */}
//        <header className="sticky top-0 z-50 bg-white border-b border-slate-200 p-4">
//           <div className="container max-w-7xl mx-auto flex items-center justify-between">
//             <Button variant="ghost" size="sm" onClick={() => setShowExitDialog(true)} className="gap-2">
//               <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Exit</span>
//             </Button>

//             <div className={`flex items-center gap-2 font-mono font-bold ${timeLeft && timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
//               <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
//             </div>

//             <div className="flex items-center gap-2">
//               <Badge variant="outline" className="hidden sm:flex">
//                 {Object.keys(selectedAnswers).length}/{questions.length}
//               </Badge>
              
//               {/* MOBILE NAVIGATOR TRIGGER (Only visible on mobile) */}
//               <Button 
//                 variant="outline" 
//                 size="sm" 
//                 className="md:hidden flex gap-2 border-indigo-100 text-indigo-600"
//                 onClick={() => setIsMobileNavOpen(true)}
//               >
//                 <LayoutGrid className="w-4 h-4" />
//                 <span>Map</span>
//               </Button>
//             </div>
//           </div>
//           <div className="container max-w-7xl mx-auto mt-2">
//             <Progress value={progress} className="h-1.5" />
//           </div>
//         </header>
//       {/* Main Grid: Question (Left) | Navigator (Right) */}
//       <div className="flex-1 container max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 p-4 md:p-8">
        
//         {/* Left Section: Current Question */}
//         <main className="space-y-6">
//             {/* Navigation */}
//             <div className="flex items-center justify-between mt-6 gap-4">
//               <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0} className="flex-1 md:flex-none">
//                 Previous
//               </Button>
    
//               <div className="hidden md:flex items-center gap-2">
//                 {questions.map((_, index) => (
//                   <button
//                     key={index}
//                     onClick={() => setCurrentQuestion(index)}
//                     className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
//                       index === currentQuestion
//                         ? 'bg-primary text-primary-foreground'
//                         : selectedAnswers[questions[index].id] !== undefined
//                         ? 'bg-green-500 text-white'
//                         : 'bg-muted text-muted-foreground hover:bg-muted/80'
//                     }`}
//                   >
//                     {index + 1}
//                   </button>
//                 ))}
//               </div>
    
//               {currentQuestion === questions.length - 1 ? (
//                 <Button onClick={handleSubmitExam} disabled={isSubmitting} className="flex-1 md:flex-none">
//                   {isSubmitting ? 'Submitting...' : 'Submit Exam'}
//                 </Button>
//               ) : (
//                 <Button onClick={handleNext} className="flex-1 md:flex-none">
//                   Next
//                 </Button>
//               )}
//             </div>
//             <AnimatePresence mode="wait">
              
//               <motion.div
//                 key={question.id}
//                 initial={{ opacity: 0, x: 20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 exit={{ opacity: 0, x: -20 }}
//                 transition={{ duration: 0.2 }}
//               >
//                 <Card className="p-6 md:p-8">
//                   <div className="mb-6">
//                     <div className="flex items-center justify-between mb-4">
//                       <Badge variant="outline">Question {currentQuestion + 1}</Badge>
//                      <Button 
//   variant={isCurrentFlagged ? "secondary" : "ghost"} 
//   size="sm" 
//   onClick={toggleFlag}
//   className={`gap-2 transition-colors ${isCurrentFlagged ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'text-slate-400'}`}
// >
//   <Flag className={`w-4 h-4 ${isCurrentFlagged ? 'fill-orange-600' : ''}`} />
//   {isCurrentFlagged ? "Flagged" : "Flag"}
// </Button>
//                     </div>
//                     <h2 className="text-xl font-semibold leading-relaxed">{question.text}</h2>
//                   </div>
    
//                   <div className="space-y-3">
//                     {question.options.map((opt: any, index: number) => {
//                       const optionId = opt.id ?? opt.pk ?? index;
//                       const isSelected = selectedAnswers[question.id] === optionId;
    
//                       const getOptionLabel = (o: any) => {
//                         if (!o) return '';
//                         if (typeof o === 'string') return o;
//                         // common keys observed from backend: option_text, option, text, choice_text, label
//                         return (
//                           o.option_text ??
//                           o.option ??
//                           o.text ??
//                           o.choice_text ??
//                           o.label ??
//                           // fallback to a safe string representation
//                           (o?.display ?? JSON.stringify(o))
//                         );
//                       };
    
//                       return (
//                         <motion.button
//                           key={optionId}
//                           whileTap={{ scale: 0.98 }}
//                           onClick={() => handleAnswerSelect(optionId)}
//                           className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
//                             isSelected
//                               ? 'border-primary bg-primary/5'
//                               : 'border-border hover:border-primary/50 hover:bg-accent'
//                           }`}
//                         >
//                           <div className="flex items-start gap-3">
//                             <div
//                               className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
//                                 isSelected
//                                   ? 'border-primary bg-primary text-primary-foreground'
//                                   : 'border-border'
//                               }`}
//                             >
//                               {isSelected && <CheckCircle2 className="w-4 h-4" />}
//                             </div>
//                             <span className="flex-1">{getOptionLabel(opt)}</span>
//                           </div>
//                         </motion.button>
//                       );
//                     })}
//                   </div>
//                 </Card>
//               </motion.div>
//             </AnimatePresence>        
//         </main>

//         {/* Right Section: The Navigator (Random Access Menu) */}
//          {/* RIGHT COLUMN: Desktop Navigator */}
//           <aside className="hidden lg:block">
//             <Card className="p-6 sticky top-28 border-none shadow-sm h-fit">
//               <div className="flex items-center gap-2 mb-6 font-bold text-slate-800">
//                 <LayoutGrid size={18} className="text-indigo-600" />
//                 <span>Navigator</span>
//               </div>
              
//               {/* WE CALL THE HELPER HERE */}
//               <QuestionGrid 
//                 questions={questions} 
//                 currentQuestion={currentQuestion} 
//                 selectedAnswers={selectedAnswers} 
//                 onJump={(idx: number) => setCurrentQuestion(idx)} 
//               />
//             </Card>
//           </aside>
//           <AnimatePresence>
//             {isMobileNavOpen && (
//               <>
//                 {/* Dark Background Overlay */}
//                 <motion.div 
//                   initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//                   onClick={() => setIsMobileNavOpen(false)}
//                   className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden"
//                 />
//                 {/* The actual sliding sheet */}
//                 <motion.div 
//                   initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
//                   transition={{ type: "spring", damping: 25, stiffness: 200 }}
//                   className="fixed bottom-0 inset-x-0 bg-white rounded-t-[32px] p-8 z-[70] md:hidden shadow-2xl"
//                 >
//                   <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
//                   <h3 className="text-xl font-bold mb-6 text-slate-800">Jump to Question</h3>
                  
//                   <div className="max-h-[50vh] overflow-y-auto">
//                     {/* WE CALL THE HELPER HERE TOO */}
//                     <QuestionGrid 
//                       questions={questions} 
//                       currentQuestion={currentQuestion} 
//                       selectedAnswers={selectedAnswers} 
//                       onJump={(idx: number) => {
//                         setCurrentQuestion(idx);
//                         setIsMobileNavOpen(false); // Auto-close after jumping
//                       }} 
//                     />
//                   </div>
//                   <Button className="w-full mt-8 py-6" onClick={() => setIsMobileNavOpen(false)}>Close</Button>
//                 </motion.div>
//               </>
//             )}
//           </AnimatePresence>

//       </div>

//       <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
//         <AlertDialogContent>
//           <AlertDialogHeader><AlertDialogTitle>Exit Exam?</AlertDialogTitle></AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Resume</AlertDialogCancel>
//             <AlertDialogAction onClick={() => navigate('/')} className="bg-red-600">Exit</AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }
































// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router';
// import apiClient from '../api/client';
// import { Button } from './ui/button';
// import { Card } from './ui/card';
// import { Progress } from './ui/progress';
// import { Badge } from './ui/badge';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from './ui/alert-dialog';
// import { ArrowLeft, Clock, Flag, CheckCircle2, Loader2 } from 'lucide-react';
// import { motion, AnimatePresence } from 'motion/react';
// import { toast } from 'sonner';
// import { haptics } from '../utils/haptics';
// import { useSwipeGesture } from '../hooks/useSwipeGesture';


// export function ExamSession() {
//   const { examId } = useParams();
//   const navigate = useNavigate();
//   const [currentQuestion, setCurrentQuestion] = useState(0);
//   const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
//   const [showExitDialog, setShowExitDialog] = useState(false);
//   const [timeLeft, setTimeLeft] = useState<number | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [questions, setQuestions] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [attemptId, setAttemptId] = useState<number | null>(null);
  

//   // Enable swipe gestures for navigation
//   useSwipeGesture({
//     onSwipeLeft: () => {
//       if (currentQuestion < questions.length - 1) handleNext();
//     },
//     onSwipeRight: () => {
//       if (currentQuestion > 0) handlePrevious();
//     },
//   });

//   useEffect(() => {
//   const initializeSession = async () => {
//     if (!examId) {
//       setError('No exam ID provided');
//       setLoading(false);
//       return;
//     }

//     try {
//       setLoading(true);

//       //  Check if we have an active session in storage for THIS examId
//       const savedSessionKey = `active_session_exam_${examId}`;
//       const existingSessionId = localStorage.getItem(savedSessionKey);

//       let currentAttemptId: number;

//       if (existingSessionId) {
//         // We have a session! Use the existing ID
//         currentAttemptId = parseInt(existingSessionId);
//         setAttemptId(currentAttemptId);
//         console.log("Resuming existing session:", currentAttemptId);
//       } else {
//         // No session found, create a NEW one in Django
//         const attemptResp = await apiClient.post('/exam-attempts/', {
//           competency_area: Number(examId),
//           status: 'STARTED'
//         });
//         currentAttemptId = attemptResp.data.id;
        
//         // Save this ID so if they refresh, we don't create a duplicate
//         setAttemptId(currentAttemptId);
//         localStorage.setItem(savedSessionKey, currentAttemptId.toString());
//         console.log("Started new session:", currentAttemptId);
//       }

//       // 2. Load Progress from LocalStorage (if any)
//       const progressKey = `exam_progress_${currentAttemptId}`;
//       const savedProgress = localStorage.getItem(progressKey);
//       if (savedProgress) {
//         setSelectedAnswers(JSON.parse(savedProgress));
//         toast.info("Resumed your previous progress.");
//       }
//       // 3. Fetch Questions from Django
//     const resp = await apiClient.get(`/questions/?competency_area=${examId}`);
//     const rawData = resp.data?.results ?? resp.data;

//     // Guard: Check if we actually got questions
//     if (!Array.isArray(rawData) || rawData.length === 0) {
//       setQuestions([]);
//       setLoading(false);
//       return; // This will trigger the "No questions" UI state
//     }

//     // 4. Normalize the Data (Always do this first)
//     const normalized = rawData.map((q: any) => ({
//       id: q.id,
//       text: q.text ?? q.question_text ?? q.title,
//       explanation: q.explanation ?? null,
//       options: q.options ?? q.question_options ?? q.choices ?? q.options_list ?? [],
//       // Use the duration from the backend, fallback to 60
//       duration_minutes: q.duration_minutes ?? q.competency_area?.duration_minutes ?? null,
      
//     }));

//     setQuestions(normalized);

//     // 5. Handle the Timer Logic
//     const backendDurationMinutes = normalized[0].duration_minutes;
//     const totalSecondsAllowed = backendDurationMinutes * 60;

//     // Use a unique key for the start time of THIS attempt
//     const startTimeKey = `exam_start_time_${currentAttemptId}`;
//     let startTime = localStorage.getItem(startTimeKey);

//     if (!startTime) {
//       // If this is a brand new attempt, mark the start time now
//       startTime = new Date().toISOString();
//       localStorage.setItem(startTimeKey, startTime);
//     }

//     // 6. Calculate how much time has passed since the exam started
//     const startTimestamp = new Date(startTime).getTime();
//     const nowTimestamp = new Date().getTime();
//     const secondsElapsed = Math.floor((nowTimestamp - startTimestamp) / 1000);

//     const calculatedTimeLeft = totalSecondsAllowed - secondsElapsed;

//     // 7. Update the Timer State
//     if (calculatedTimeLeft <= 0) {
//       setTimeLeft(0);
//       toast.error("Time has expired for this session.");
//       // Logic for auto-submit can go here
//     } else {
//       setTimeLeft(calculatedTimeLeft);
//     }
    
//     } catch (err: any) {
//       console.error('Failed to initialize session:', err);
//       setError('Failed to connect to exam server.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   initializeSession();
// }, [examId]);

//   useEffect(() => {
//     if (timeLeft === null) return;
//     const timer = setInterval(() => {
//     setTimeLeft((prev) => {
//       if (prev === null || prev <= 0) {
//         clearInterval(timer);
//         // Auto-submit happens here when it reaches exactly 0
//         if (prev === 0) handleSubmitExam(); 
//         return 0;
//       }
//       return prev - 1;
//     });
//   }, 1000);

//     return () => clearInterval(timer);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [timeLeft, questions]);

//  const formatTime = (seconds: number | null) => {
//     if (seconds === null) return "--:--"; // Show this while loading
//     if (seconds <= 0) return "0:00";

//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
// };

//   const handleAnswerSelect = (optionId: number) => {
//     haptics.selection?.();
//     const updatedAnswers = {
//       ...selectedAnswers,
//       [questions[currentQuestion].id]: optionId,
//     };
    
//     setSelectedAnswers(updatedAnswers);

//     // SENIOR MOVE: Persist progress locally
//     // Key it by attemptId so it doesn't clash with other exams
//     if (attemptId) {
//       localStorage.setItem(`exam_progress_${attemptId}`, JSON.stringify(updatedAnswers));
//     }
//   };

//   const handleNext = () => {
//     if (currentQuestion < questions.length - 1) setCurrentQuestion((p) => p + 1);
//   };

//   const handlePrevious = () => {
//     if (currentQuestion > 0) setCurrentQuestion((p) => p - 1);
//   };

//   const handleSubmitExam = async () => {
//     if (!examId || questions.length === 0) {
//       toast.error('No questions to submit');
//       return;
//     }

//     setIsSubmitting(true);

//     const answers = Object.entries(selectedAnswers).map(([questionIdStr, optionId]) => ({
//       question_id: Number(questionIdStr),
//       selected_option_id: optionId,
//       time_spent: 0,
//     }));

//     try {
//       const createResp = await apiClient.post('/exam-attempts/', {
//         competency_area: Number(examId),
//         status: 'IN_PROGRESS',
//       });

//       const attemptId = createResp.data?.id;
//       if (!attemptId) throw new Error('Failed to create exam attempt');

//       const submitResp = await apiClient.post(`/exam-attempts/${attemptId}/submit_exam/`, {
//         answers,
//       });

//       const { score } = submitResp.data ?? {};
//       toast.success(`Exam completed! Your score: ${score ?? 'N/A'}%`);
//       navigate('/', { state: { examCompleted: true, score } });
//     } catch (err: any) {
//       console.error('Submit failed:', err?.response?.status, err?.response?.data ?? err);
//       const payload = err?.response?.data ?? { error: 'Submit failed' };
//       const message = payload?.error ?? payload?.detail ?? JSON.stringify(payload);
//       toast.error(String(message));
//     } finally {
//       setIsSubmitting(false);
//     }
//     try {
//         const submitResp = await apiClient.post(`/exam-attempts/${attemptId}/submit_exam/`, { answers });
        
//         // SUCCESS: Remove all session markers from this computer
//         localStorage.removeItem(`active_session_exam_${examId}`);
//         localStorage.removeItem(`exam_progress_${attemptId}`);

//         toast.success(`Exam completed! Score: ${submitResp.data.score}%`);
//         navigate('/', { state: { examCompleted: true, score: submitResp.data.score } });
//     } catch (err) {
//         toast.error("Submission failed. Please try again.");
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center">
//         <Loader2 className="w-8 h-8 animate-spin text-primary" />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Card className="p-6">
//           <h3 className="font-semibold mb-2">Failed to load exam</h3>
//           <p className="text-sm text-muted-foreground">{error}</p>
//           <div className="mt-4">
//             <Button onClick={() => navigate(-1)}>Back</Button>
//           </div>
//         </Card>
//       </div>
//     );
//   }

//   if (questions.length === 0) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Card className="p-6">
//           <h3 className="font-semibold mb-2">No questions</h3>
//           <p className="text-sm text-muted-foreground">This exam has no questions configured.</p>
//           <div className="mt-4">
//             <Button onClick={() => navigate(-1)}>Back</Button>
//           </div>
//         </Card>
//       </div>
//     );
//   }

//   const question = questions[currentQuestion];
//   const progress = ((currentQuestion + 1) / questions.length) * 100;
//   const answeredCount = Object.keys(selectedAnswers).length;

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Fixed Header */}
//       <header className="sticky top-0 z-50 bg-card border-b border-border backdrop-blur-sm bg-card/95">
//         <div className="container max-w-4xl mx-auto px-4 py-3">
//           <div className="flex items-center justify-between">
//             <Button variant="ghost" size="sm" onClick={() => setShowExitDialog(true)} className="gap-2">
//               <ArrowLeft className="w-4 h-4" />
//               Exit
//             </Button>

//             <div className="flex items-center gap-2 text-sm">
//     <Clock className={`w-4 h-4 ${timeLeft && timeLeft < 300 ? 'text-red-500 animate-pulse' : ''}`} />
//     <span className={`font-mono font-bold ${timeLeft && timeLeft < 300 ? 'text-red-500' : ''}`}>
//         {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
//     </span>
// </div>
//           </div>

//           <div className="mt-3">
//             <Progress value={progress} className="h-2" />
//           </div>
//         </div>
//       </header>

//       {/* Question Content */}
//       <div className="container max-w-4xl mx-auto px-4 py-6">
//         <AnimatePresence mode="wait">
//           <motion.div
//             key={question.id}
//             initial={{ opacity: 0, x: 20 }}
//             animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: -20 }}
//             transition={{ duration: 0.2 }}
//           >
//             <Card className="p-6 md:p-8">
//               <div className="mb-6">
//                 <div className="flex items-center justify-between mb-4">
//                   <Badge variant="outline">Question {currentQuestion + 1}</Badge>
//                   <Button variant="ghost" size="sm" className="gap-2">
//                     <Flag className="w-4 h-4" />
//                     Flag
//                   </Button>
//                 </div>
//                 <h2 className="text-xl font-semibold leading-relaxed">{question.text}</h2>
//               </div>

//               <div className="space-y-3">
//                 {question.options.map((opt: any, index: number) => {
//                   const optionId = opt.id ?? opt.pk ?? index;
//                   const isSelected = selectedAnswers[question.id] === optionId;

//                   const getOptionLabel = (o: any) => {
//                     if (!o) return '';
//                     if (typeof o === 'string') return o;
//                     // common keys observed from backend: option_text, option, text, choice_text, label
//                     return (
//                       o.option_text ??
//                       o.option ??
//                       o.text ??
//                       o.choice_text ??
//                       o.label ??
//                       // fallback to a safe string representation
//                       (o?.display ?? JSON.stringify(o))
//                     );
//                   };

//                   return (
//                     <motion.button
//                       key={optionId}
//                       whileTap={{ scale: 0.98 }}
//                       onClick={() => handleAnswerSelect(optionId)}
//                       className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
//                         isSelected
//                           ? 'border-primary bg-primary/5'
//                           : 'border-border hover:border-primary/50 hover:bg-accent'
//                       }`}
//                     >
//                       <div className="flex items-start gap-3">
//                         <div
//                           className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
//                             isSelected
//                               ? 'border-primary bg-primary text-primary-foreground'
//                               : 'border-border'
//                           }`}
//                         >
//                           {isSelected && <CheckCircle2 className="w-4 h-4" />}
//                         </div>
//                         <span className="flex-1">{getOptionLabel(opt)}</span>
//                       </div>
//                     </motion.button>
//                   );
//                 })}
//               </div>
//             </Card>
//           </motion.div>
//         </AnimatePresence>

//         {/* Navigation */}
//         <div className="flex items-center justify-between mt-6 gap-4">
//           <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0} className="flex-1 md:flex-none">
//             Previous
//           </Button>

//           <div className="hidden md:flex items-center gap-2">
//             {questions.map((_, index) => (
//               <button
//                 key={index}
//                 onClick={() => setCurrentQuestion(index)}
//                 className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
//                   index === currentQuestion
//                     ? 'bg-primary text-primary-foreground'
//                     : selectedAnswers[questions[index].id] !== undefined
//                     ? 'bg-green-500 text-white'
//                     : 'bg-muted text-muted-foreground hover:bg-muted/80'
//                 }`}
//               >
//                 {index + 1}
//               </button>
//             ))}
//           </div>

//           {currentQuestion === questions.length - 1 ? (
//             <Button onClick={handleSubmitExam} disabled={isSubmitting} className="flex-1 md:flex-none">
//               {isSubmitting ? 'Submitting...' : 'Submit Exam'}
//             </Button>
//           ) : (
//             <Button onClick={handleNext} className="flex-1 md:flex-none">
//               Next
//             </Button>
//           )}
//         </div>

//         {/* Question Grid - Mobile */}
//         <div className="mt-6 md:hidden">
//           <p className="text-sm text-muted-foreground mb-3">Question navigation:</p>
//           <div className="grid grid-cols-10 gap-2">
//             {questions.map((q, index) => (
//               <button
//                 key={q.id}
//                 onClick={() => setCurrentQuestion(index)}
//                 className={`aspect-square rounded-md text-sm font-medium transition-colors ${
//                   index === currentQuestion
//                     ? 'bg-primary text-primary-foreground'
//                     : selectedAnswers[q.id] !== undefined
//                     ? 'bg-green-500 text-white'
//                     : 'bg-muted text-muted-foreground'
//                 }`}
//               >
//                 {index + 1}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Exit Confirmation Dialog */}
//       <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Exit exam?</AlertDialogTitle>
//             <AlertDialogDescription>
//               Your progress will be saved, but you won't be able to resume this session.
//               Are you sure you want to exit?
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Continue Exam</AlertDialogCancel>
//             <AlertDialogAction onClick={() => navigate('/')}>Exit</AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }

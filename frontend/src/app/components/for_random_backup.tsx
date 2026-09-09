import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
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
import { ArrowLeft, Clock, Flag, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { haptics } from '../utils/haptics';
import { useSwipeGesture } from '../hooks/useSwipeGesture';


export function ExamSession() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  
  
  // Enable swipe gestures for navigation
  useSwipeGesture({
    onSwipeLeft: () => {
      if (currentQuestion < questions.length - 1) handleNext();
    },
    onSwipeRight: () => {
      if (currentQuestion > 0) handlePrevious();
    },
  });

  useEffect(() => {
  const initializeSession = async () => {
    if (!examId) {
      setError('No exam ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      //  Check if we have an active session in storage for THIS examId
      const savedSessionKey = `active_session_exam_${examId}`;
      const existingSessionId = localStorage.getItem(savedSessionKey);

      let currentAttemptId: number;

      if (existingSessionId) {
        // We have a session! Use the existing ID
        currentAttemptId = parseInt(existingSessionId);
        setAttemptId(currentAttemptId);
        console.log("Resuming existing session:", currentAttemptId);
      } else {
        // No session found, create a NEW one in Django
        const attemptResp = await apiClient.post('/exam-attempts/', {
          competency_area: Number(examId),
          status: 'STARTED'
        });
        currentAttemptId = attemptResp.data.id;
        
        // Save this ID so if they refresh, we don't create a duplicate
        setAttemptId(currentAttemptId);
        localStorage.setItem(savedSessionKey, currentAttemptId.toString());
        console.log("Started new session:", currentAttemptId);
      }

      // 2. Load Progress from LocalStorage (if any)
      const progressKey = `exam_progress_${currentAttemptId}`;
      const savedProgress = localStorage.getItem(progressKey);
      if (savedProgress) {
        setSelectedAnswers(JSON.parse(savedProgress));
        toast.info("Resumed your previous progress.");
      }
      // 3. Fetch Questions from Django
    const resp = await apiClient.get(`/questions/?competency_area=${examId}`);
    const rawData = resp.data?.results ?? resp.data;

    // Guard: Check if we actually got questions
    if (!Array.isArray(rawData) || rawData.length === 0) {
      setQuestions([]);
      setLoading(false);
      return; // This will trigger the "No questions" UI state
    }

    // 4. Normalize the Data (Always do this first)
    const normalized = rawData.map((q: any) => ({
      id: q.id,
      text: q.text ?? q.question_text ?? q.title,
      explanation: q.explanation ?? null,
      options: q.options ?? q.question_options ?? q.choices ?? q.options_list ?? [],
      // Use the duration from the backend, fallback to 60
      duration_minutes: q.duration_minutes ?? q.competency_area?.duration_minutes ?? null,
      
    }));

    setQuestions(normalized);

    // 5. Handle the Timer Logic
    const backendDurationMinutes = normalized[0].duration_minutes;
    const totalSecondsAllowed = backendDurationMinutes * 60;

    // Use a unique key for the start time of THIS attempt
    const startTimeKey = `exam_start_time_${currentAttemptId}`;
    let startTime = localStorage.getItem(startTimeKey);

    if (!startTime) {
      // If this is a brand new attempt, mark the start time now
      startTime = new Date().toISOString();
      localStorage.setItem(startTimeKey, startTime);
    }

    // 6. Calculate how much time has passed since the exam started
    const startTimestamp = new Date(startTime).getTime();
    const nowTimestamp = new Date().getTime();
    const secondsElapsed = Math.floor((nowTimestamp - startTimestamp) / 1000);

    const calculatedTimeLeft = totalSecondsAllowed - secondsElapsed;

    // 7. Update the Timer State
    if (calculatedTimeLeft <= 0) {
      setTimeLeft(0);
      toast.error("Time has expired for this session.");
      // Logic for auto-submit can go here
    } else {
      setTimeLeft(calculatedTimeLeft);
    }
    
    } catch (err: any) {
      console.error('Failed to initialize session:', err);
      setError('Failed to connect to exam server.');
    } finally {
      setLoading(false);
    }
  };

  initializeSession();
}, [examId]);

  useEffect(() => {
    if (timeLeft === null) return;
    const timer = setInterval(() => {
    setTimeLeft((prev) => {
      if (prev === null || prev <= 0) {
        clearInterval(timer);
        // Auto-submit happens here when it reaches exactly 0
        if (prev === 0) handleSubmitExam(); 
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, questions]);

 const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--"; // Show this while loading
    if (seconds <= 0) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

  const handleAnswerSelect = (optionId: number) => {
    haptics.selection?.();
    const updatedAnswers = {
      ...selectedAnswers,
      [questions[currentQuestion].id]: optionId,
    };
    
    setSelectedAnswers(updatedAnswers);

    // SENIOR MOVE: Persist progress locally
    // Key it by attemptId so it doesn't clash with other exams
    if (attemptId) {
      localStorage.setItem(`exam_progress_${attemptId}`, JSON.stringify(updatedAnswers));
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) setCurrentQuestion((p) => p + 1);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) setCurrentQuestion((p) => p - 1);
  };

  const handleSubmitExam = async () => {
    if (!examId || questions.length === 0) {
      toast.error('No questions to submit');
      return;
    }

    setIsSubmitting(true);

    const answers = Object.entries(selectedAnswers).map(([questionIdStr, optionId]) => ({
      question_id: Number(questionIdStr),
      selected_option_id: optionId,
      time_spent: 0,
    }));

    try {
      const createResp = await apiClient.post('/exam-attempts/', {
        competency_area: Number(examId),
        status: 'IN_PROGRESS',
      });

      const attemptId = createResp.data?.id;
      if (!attemptId) throw new Error('Failed to create exam attempt');

      const submitResp = await apiClient.post(`/exam-attempts/${attemptId}/submit_exam/`, {
        answers,
      });

      const { score } = submitResp.data ?? {};
      toast.success(`Exam completed! Your score: ${score ?? 'N/A'}%`);
      navigate('/', { state: { examCompleted: true, score } });
    } catch (err: any) {
      console.error('Submit failed:', err?.response?.status, err?.response?.data ?? err);
      const payload = err?.response?.data ?? { error: 'Submit failed' };
      const message = payload?.error ?? payload?.detail ?? JSON.stringify(payload);
      toast.error(String(message));
    } finally {
      setIsSubmitting(false);
    }
    try {
        const submitResp = await apiClient.post(`/exam-attempts/${attemptId}/submit_exam/`, { answers });
        
        // SUCCESS: Remove all session markers from this computer
        localStorage.removeItem(`active_session_exam_${examId}`);
        localStorage.removeItem(`exam_progress_${attemptId}`);

        toast.success(`Exam completed! Score: ${submitResp.data.score}%`);
        navigate('/', { state: { examCompleted: true, score: submitResp.data.score } });
    } catch (err) {
        toast.error("Submission failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Failed to load exam</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="mt-4">
            <Button onClick={() => navigate(-1)}>Back</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <h3 className="font-semibold mb-2">No questions</h3>
          <p className="text-sm text-muted-foreground">This exam has no questions configured.</p>
          <div className="mt-4">
            <Button onClick={() => navigate(-1)}>Back</Button>
          </div>
        </Card>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border backdrop-blur-sm bg-card/95">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setShowExitDialog(true)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Exit
            </Button>

            <div className="flex items-center gap-2 text-sm">
                <Clock className={`w-4 h-4 ${timeLeft && timeLeft < 300 ? 'text-red-500 animate-pulse' : ''}`} />
                    <span className={`font-mono font-bold ${timeLeft && timeLeft < 300 ? 'text-red-500' : ''}`}>
                        {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
                     </span>
               </div>
            </div>

          <div className="mt-3">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      {/* Question Content */}
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-6 md:p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline">Question {currentQuestion + 1}</Badge>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Flag className="w-4 h-4" />
                    Flag
                  </Button>
                </div>
                <h2 className="text-xl font-semibold leading-relaxed">{question.text}</h2>
              </div>

              <div className="space-y-3">
                {question.options.map((opt: any, index: number) => {
                  const optionId = opt.id ?? opt.pk ?? index;
                  const isSelected = selectedAnswers[question.id] === optionId;

                  const getOptionLabel = (o: any) => {
                    if (!o) return '';
                    if (typeof o === 'string') return o;
                    // common keys observed from backend: option_text, option, text, choice_text, label
                    return (
                      o.option_text ??
                      o.option ??
                      o.text ??
                      o.choice_text ??
                      o.label ??
                      // fallback to a safe string representation
                      (o?.display ?? JSON.stringify(o))
                    );
                  };

                  return (
                    <motion.button
                      key={optionId}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswerSelect(optionId)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <span className="flex-1">{getOptionLabel(opt)}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 gap-4">
          <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0} className="flex-1 md:flex-none">
            Previous
          </Button>

          <div className="hidden md:flex items-center gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index === currentQuestion
                    ? 'bg-primary text-primary-foreground'
                    : selectedAnswers[questions[index].id] !== undefined
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestion === questions.length - 1 ? (
            <Button onClick={handleSubmitExam} disabled={isSubmitting} className="flex-1 md:flex-none">
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </Button>
          ) : (
            <Button onClick={handleNext} className="flex-1 md:flex-none">
              Next
            </Button>
          )}
        </div>

        {/* Question Grid - Mobile */}
        <div className="mt-6 md:hidden">
          <p className="text-sm text-muted-foreground mb-3">Question navigation:</p>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(index)}
                className={`aspect-square rounded-md text-sm font-medium transition-colors ${
                  index === currentQuestion
                    ? 'bg-primary text-primary-foreground'
                    : selectedAnswers[q.id] !== undefined
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit exam?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be saved, but you won't be able to resume this session.
              Are you sure you want to exit?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Exam</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/')}>Exit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

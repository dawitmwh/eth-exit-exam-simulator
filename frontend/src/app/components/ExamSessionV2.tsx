import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import apiClient from '../api/client';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Loader2, ChevronLeft, ChevronRight, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Option { id: number; option_text: string; is_correct?: boolean }
interface Question { id: number; text: string; options: Option[]; explanation?: string; duration_minutes: number }

export function ExamSessionV2() {
  const { examId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') === 'practice' ? 'PRACTICE' : 'SIMULATED';
  const isPractice = mode === 'PRACTICE';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        setLoading(true);
        const fullMock = examId === 'full-mock';
        const competencyArea = fullMock ? null : Number(examId);
        const attemptResponse = await apiClient.post('/exams/attempts/start/', {
          competency_area: competencyArea,
          mode,
        });
        if (!active) return;
        setAttemptId(attemptResponse.data.id);

        const params = new URLSearchParams({ mode });
        if (competencyArea) params.set('competency_area', String(competencyArea));
        if (fullMock) params.set('full_mock', 'true');

        const questionResponse = await apiClient.get(`/exams/questions/session/?${params.toString()}`);
        if (!active) return;
        const items = questionResponse.data;
        setQuestions(items);

        if (!isPractice && items.length) {
          setTimeLeft((items[0].duration_minutes || (fullMock ? 120 : 60)) * 60);
        }
      } catch (err: any) {
        setError(err?.response?.data?.error || 'We could not start this exam.');
      } finally {
        if (active) setLoading(false);
      }
    };
    initialize();
    return () => { active = false; };
  }, [examId, mode, isPractice]);

  useEffect(() => {
    if (isPractice || timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const timer = window.setInterval(() => setTimeLeft((value) => value == null ? null : value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [timeLeft, isPractice]);

  const handleSubmit = async (autoSubmit = false) => {
    if (!attemptId || submitting) return;
    if (!autoSubmit && Object.keys(answers).length < questions.length) {
      const confirmed = window.confirm('Some questions are unanswered. Submit anyway?');
      if (!confirmed) return;
    }
    setSubmitting(true);
    const payload = {
      answers: Object.entries(answers).map(([questionId, optionId]) => ({
        question_id: Number(questionId),
        selected_option_id: optionId,
        time_spent: 0,
      })),
    };
    try {
      const response = await apiClient.post(`/exams/attempts/${attemptId}/submit/`, payload);
      toast.success(`Exam complete: ${response.data.score}%`);
      if (isPractice) {
        navigate('/analytics', { replace: true });
      } else {
        navigate(`/exams/attempts/${attemptId}/review`, { replace: true });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (error) return <div className="h-screen flex items-center justify-center p-6"><Card className="p-8 text-center"><AlertCircle className="mx-auto text-rose-500 mb-4" /><p>{error}</p></Card></div>;
  if (!questions.length) return <div className="h-screen flex items-center justify-center p-6"><Card className="p-8 text-center"><p className="font-bold">No questions are available for this exam.</p><Button className="mt-5" onClick={() => navigate('/exams')}>Back to exams</Button></Card></div>;

  const question = questions[current];
  const selected = answers[question.id];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-black uppercase text-indigo-600">{isPractice ? 'Practice mode' : 'Simulated exam'}</p>
            <p className="text-sm text-slate-400 mt-1">Question {current + 1} of {questions.length}</p>
          </div>
          {!isPractice && timeLeft !== null && (
            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm">
              <Clock size={18} className="text-slate-500" />
              <span className="font-mono font-black">{formatTime(timeLeft)}</span>
            </div>
          )}
        </header>

        <Card className="p-6 md:p-10 rounded-3xl border-none shadow-sm">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-relaxed">{question.text}</h1>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((option, index) => {
              const isSelected = selected === option.id;
              const isAnsweredInPractice = isPractice && selected !== undefined;
              const correct = isAnsweredInPractice && option.is_correct;
              const incorrect = isAnsweredInPractice && isSelected && !option.is_correct;
              return (
                <button
                  key={option.id}
                  disabled={isAnsweredInPractice}
                  onClick={() => setAnswers((previous) => ({ ...previous, [question.id]: option.id }))}
                  className={`min-h-16 p-4 rounded-2xl border-2 text-left flex items-center gap-3 transition-all ${
                    correct ? 'border-emerald-500 bg-emerald-50' : incorrect ? 'border-rose-400 bg-rose-50' : isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-white hover:border-indigo-200'
                  }`}
                >
                  <span className="w-8 h-8 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center font-black text-sm">{String.fromCharCode(65 + index)}</span>
                  <span className="font-bold text-slate-700">{option.option_text}</span>
                  {correct && <CheckCircle2 className="ml-auto text-emerald-600" />}
                </button>
              );
            })}
          </div>

          {isPractice && selected !== undefined && (
            <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-100 p-5">
              <p className="text-xs font-black uppercase text-amber-700">Learning explanation</p>
              <p className="mt-2 text-slate-700 leading-relaxed">{question.explanation || 'No explanation has been added for this question.'}</p>
            </div>
          )}
        </Card>

        <div className="flex items-center justify-between mt-6">
          <Button variant="outline" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)}>
            <ChevronLeft size={18} /> Back
          </Button>
          {current === questions.length - 1 ? (
            <Button disabled={submitting} onClick={() => handleSubmit(false)}>
              {submitting ? <Loader2 className="animate-spin mr-2" /> : null} Finish
            </Button>
          ) : (
            <Button onClick={() => setCurrent((value) => value + 1)}>Next <ChevronRight size={18} /></Button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import apiClient from '../api/client';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Loader2, TrendingUp, TrendingDown, Minus, Target, Trophy, Clock, ChevronRight, AlertCircle } from 'lucide-react';

interface Topic {
  id: number;
  name: string;
  score: number;
  attempts: number;
}

interface AnalyticsData {
  summary: {
    average_score: number;
    latest_score: number | null;
    attempt_count: number;
    change_from_previous: number | null;
    mastered_topics: number;
  };
  progress: Array<{ exam: string; score: number; date: string; mode: string }>;
  topics: Topic[];
  practice_next: Topic[];
}

export function AnalyticsV2() {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/exams/analytics/student/')
      .then((response) => setData(response.data))
      .catch(() => setError('We could not load your progress. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div class="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>; 
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center rounded-3xl">
          <AlertCircle className="mx-auto text-rose-500 mb-4" />
          <p className="text-slate-700 font-bold">{error}</p>
          <Button className="mt-6" onClick={() => window.location.reload()}>Try again</Button>
        </Card>
      </div>
    );
  }

  if (!data || data.summary.attempt_count === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <Card className="max-w-lg w-full p-10 text-center rounded-3xl">
          <Target className="mx-auto text-indigo-600 mb-5" size={40} />
          <h1 className="text-2xl font-black text-slate-900">Start your first exam</h1>
          <p className="text-slate-500 mt-3">Your progress and practice suggestions will appear after you complete an exam.</p>
          <Button className="mt-7 h-12 rounded-xl" onClick={() => navigate('/exams')}>Browse practice exams</Button>
        </Card>
      </div>
    );
  }

  const change = data.summary.change_from_previous;
  const ChangeIcon = change == null ? Minus : change >= 0 ? TrendingUp : TrendingDown;
  const changeText = change == null ? 'Complete another exam to compare' : `${change >= 0 ? '+' : ''}${change}% from last exam`;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-6">
      <header>
        <p className="text-xs font-black uppercase tracking-widest text-indigo-600">My progress</p>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-2">How am I doing?</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 rounded-3xl border-none shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">Latest score</p>
          <p className="text-4xl font-black text-slate-900 mt-2">{data.summary.latest_score}%</p>
        </Card>
        <Card className="p-6 rounded-3xl border-none shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">Average score</p>
          <p className="text-4xl font-black text-slate-900 mt-2">{data.summary.average_score}%</p>
        </Card>
        <Card className="p-6 rounded-3xl border-none shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase text-slate-400">Change</p>
            <ChangeIcon className={change != null && change < 0 ? 'text-rose-500' : 'text-emerald-600'} />
          </div>
          <p className="text-lg font-black text-slate-900 mt-4">{changeText}</p>
        </Card>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 md:p-8 rounded-3xl border-none shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Target className="text-indigo-600" />
            <h2 className="text-xl font-black text-slate-900">Practice next</h2>
          </div>
          {data.practice_next.length === 0 ? (
            <p className="text-slate-500">Complete a subject exam to receive topic suggestions.</p>
          ) : data.practice_next.map((topic) => (
            <button
              key={topic.id}
              onClick={() => navigate(`/exam/${topic.id}?mode=practice`)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 mb-3 text-left"
            >
              <div>
                <p className="font-black text-slate-800">{topic.name}</p>
                <p className="text-sm text-slate-500 mt-1">Current average: {topic.score}%</p>
              </div>
              <ChevronRight className="text-slate-400" />
            </button>
          ))}
        </Card>

        <Card className="p-6 md:p-8 rounded-3xl border-none shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="text-amber-500" />
            <h2 class="text-xl font-black text-slate-900">Recent exams</h2>
          </div>
          <div className="space-y-3">
            {data.progress.slice().reverse().map((item) => (
              <div key={item.exam} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="font-black text-slate-800">{item.mode === 'PRACTICE' ? 'Practice' : 'Simulated exam'}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.date}</p>
                </div>
                <p className="text-2xl font-black text-slate-900">{item.score}%</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <details className="rounded-3xl bg-white p-6 shadow-sm">
        <summary className="cursor-pointer font-black text-slate-700">More details</summary>
        <div className="mt-6 space-y-4">
          {data.topics.map((topic) => (
            <div key={topic.id}>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-slate-700">{topic.name}</span>
                <span className="font-black text-slate-900">{topic.score}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${topic.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

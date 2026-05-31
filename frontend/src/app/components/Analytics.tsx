import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Brain,
  AlertCircle,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function Analytics() {
  const progressData = [
    { exam: 'Exam 1', score: 65 },
    { exam: 'Exam 2', score: 70 },
    { exam: 'Exam 3', score: 68 },
    { exam: 'Exam 4', score: 75 },
    { exam: 'Exam 5', score: 78 },
    { exam: 'Exam 6', score: 82 },
  ];

  const categoryPerformance = [
    { category: 'Anatomy', score: 85, avgTime: 2.5 },
    { category: 'Pharmacology', score: 72, avgTime: 3.2 },
    { category: 'Pediatrics', score: 78, avgTime: 2.8 },
    { category: 'Ethics', score: 90, avgTime: 1.5 },
    { category: 'Clinical', score: 68, avgTime: 3.5 },
  ];

  const weakAreas = [
    { topic: 'Cardiovascular System', score: 62, questions: 45 },
    { topic: 'Drug Interactions', score: 65, questions: 38 },
    { topic: 'Pediatric Dosing', score: 58, questions: 32 },
  ];

  return (
    <div className="min-h-screen md:ml-64">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 backdrop-blur-sm bg-card/80">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your progress and identify areas for improvement
          </p>
        </div>
      </header>

      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Overall Progress</p>
                <p className="text-3xl font-bold">78%</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>+15% from last month</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Time/Question</p>
                <p className="text-3xl font-bold">2.8m</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <TrendingDown className="w-4 h-4" />
              <span>-0.5m faster</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Strong Areas</p>
                <p className="text-3xl font-bold">4/7</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>57% mastery rate</span>
            </div>
          </Card>
        </div>

        {/* Progress Chart */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Score Progression</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="exam"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Category Performance */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Performance by Category</h2>
          <div className="space-y-4">
            {categoryPerformance.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{cat.category}</span>
                    <Badge variant={cat.score >= 80 ? 'default' : 'secondary'}>
                      {cat.score}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{cat.avgTime}m avg</span>
                  </div>
                </div>
                <Progress value={cat.score} className="h-3" />
              </div>
            ))}
          </div>
        </Card>

        {/* Weak Areas */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold">Areas Needing Attention</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Focus on these topics to improve your overall score
          </p>
          <div className="space-y-4">
            {weakAreas.map((area) => (
              <div
                key={area.topic}
                className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      {area.topic}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {area.questions} questions attempted
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  >
                    {area.score}%
                  </Badge>
                </div>
                <Progress value={area.score} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Recommended: Complete 20 more practice questions in this area
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Time Analysis */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Time Spent Analysis</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryPerformance}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="category"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
              <Bar dataKey="avgTime" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            You spend more time on Pharmacology and Clinical questions. Consider focused
            practice to improve speed.
          </p>
        </Card>
      </div>
    </div>
  );
}

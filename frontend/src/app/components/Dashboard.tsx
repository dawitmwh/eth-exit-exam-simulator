import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';  
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';  
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Trophy, Target, Clock, TrendingUp, Brain, Zap, Loader2 } from 'lucide-react';
import { motion } from 'motion/react'; // Using standard framer-motion or motion/react

// 1. Define the shape of our dashboard data based on what the backend sends  
interface DashboardData {
  department: string;
  overall: {
    avg_score: number | null;
    total_exams: number;
  };
  by_competency: Array<{
    competency_area__name: string;
    average_score: number;
  }>;
  history: Array<{
    id: number;
    end_time: string;
    score: number;
    competency_area__name: string; 
  }>;
}
// 2. The Dashboard component fetches data from the backend and displays it in a user-friendly way
export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // 2. Fetch data from Django API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiClient.get('/dashboard/');
        setData(response.data);
        console.log("Dashboard data fetched:", response.data.department); // Debug log
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // 3. Show loading state while fetching
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // 4. Define the stats to display in the dashboard cards
  const stats = [
    { 
      label: 'Exams Taken', 
      value: data?.overall.total_exams.toString() || '0', 
      icon: Trophy, 
      color: 'text-yellow-500' 
    },
    { 
      label: 'Avg Score', 
      value: data?.overall.avg_score ? `${data.overall.avg_score.toFixed(1)}%` : '0%', 
      icon: Target, 
      color: 'text-blue-500' 
    },
    { 
      label: 'Department', 
      value: data?.department || 'N/A', 
      icon:  Brain, 
      color: 'text-green-500' 
    },
    { 
      label: 'Mastery', 
      value: `${data?.by_competency.length || 0} Topics`, 
      icon: TrendingUp, 
      color: 'text-purple-500' 
    },
    
  ];
  // 5. Render the dashboard with stats, quick actions, and recent activity 
  return (
    <div className="min-h-screen md:ml-64 bg-slate-50/50">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Welcome back, {user?.full_name || 'User'}!
            </h1>
            <p className="text-primary-foreground/80">Ready to continue your preparation?</p>
          </motion.div>
        </div>
      </header>

      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="p-5 border-none shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-slate-50`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 md:col-span-2">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button size="lg" className="h-20 justify-start px-6" onClick={() => navigate('/exams')}>
                <Brain className="w-6 h-6 mr-4" />
                <div className="text-left">
                  <div className="font-bold">Practice Mode</div>
                  <div className="text-xs opacity-70">Focus on specific topics</div>
                </div>
              </Button>
              <Button size="lg" variant="outline" className="h-20 justify-start px-6" onClick={() => navigate('/exams')}>
                <Trophy className="w-6 h-6 mr-4 text-indigo-600" />
                <div className="text-left">
                  <div className="font-bold text-slate-900">Simulated Exam</div>
                  <div className="text-xs text-slate-500">Full timer & MoE rules</div>
                </div>
              </Button>
            </div>
          </Card>

          {/* Top Weaknesses (Derived from by_competency) */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Focus Areas</h2>
            <div className="space-y-4">
              {data?.by_competency.slice(0, 3).map((comp) => (
                <div key={comp.competency_area__name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{comp.competency_area__name}</span>
                    <span className="text-slate-500">{comp.average_score.toFixed(0)}%</span>
                  </div>
                  <Progress value={comp.average_score} className="h-1.5" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Activity (From History) */}
        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {/* Use data?.history instead of recentExams */}
            {data?.history.map((exam) => (
              <motion.div
                key={exam.id}
                whileTap={{ scale: 0.98 }}
                className="p-4 bg-accent/50 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                onClick={() => navigate(`/exam-review/${exam.id}`)} // Navigate to review
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    {/* competency_area__name is our real 'title' */}
                    <h3 className="font-semibold">{exam.competency_area__name}</h3>
                    
                    {/* Format the ISO date string into a readable date */}
                    <p className="text-sm text-muted-foreground">
                      {new Date(exam.end_time).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <Badge variant={exam.score >= 50 ? 'default' : 'secondary'}>
                    {exam.score.toFixed(0)}%
                  </Badge>
                </div>
                <Progress value={exam.score} className="h-2" />
              </motion.div>
            ))}
            
            {data?.history.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No recent exams found.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

 
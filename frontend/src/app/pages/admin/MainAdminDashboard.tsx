import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { BookOpen, FileQuestion, BarChart3, Users } from 'lucide-react';
import CompetencyAreasManager from './CompetencyAreasManager';
import QuestionsManager from './QuestionsManager';
import examsData from './data/exams.json';
import usersData from './data/users.json';
import analyticsData from './data/analytics.json';
import { ExamData } from './data/ExamData';
import { useDashboardData } from './data/DashboardData';

export default function MainAdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const totalQuestions = examsData.questions.length;
  const totalSubjects = examsData.subjects.length;
  const totalStudents = usersData.users.filter(u => u.role === 'STUDENT').length;
  const totalAttempts = analyticsData.examAttempts.length;
  const { competencies, loading } = ExamData();
  const { data}  = useDashboardData();
  

  return (
    <div className="min-h-screen md:ml-64 bg-slate-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage competency areas, questions, and monitor platform activity
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="size-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="competency">
              <BookOpen className="size-4" />
              Competency Areas
            </TabsTrigger>
            <TabsTrigger value="questions">
              <FileQuestion className="size-4" />
              Questions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
               
                  <CardDescription>Total Questions</CardDescription>
                  <CardTitle className="text-3xl">
                    {competencies.map((exam, index) => (
                      <span key={index}>{exam.question_count}</span>
                    ))}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileQuestion className="size-4" />
                    <span>Across all subjects</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Competency Areas</CardDescription>
                  <CardTitle className="text-3xl"> 
                    {competencies.length}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="size-4" />
                    <span>Active Areas</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Students</CardDescription>
                  <CardTitle className="text-3xl">{data?.student_count}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="size-4" />
                    <span>Registered users</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Exam Attempts</CardDescription>
                  <CardTitle className="text-3xl">{totalAttempts}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BarChart3 className="size-4" />
                    <span>Total submissions</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subject Distribution</CardTitle>
                  <CardDescription>Questions per competency area</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {examsData.subjects.map((subject) => {
                      const count = examsData.questions.filter(q => q.subjectId === subject.id).length;
                      const percentage = totalQuestions > 0 ? (count / totalQuestions) * 100 : 0;
                      return (
                        <div key={subject.id} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{subject.name}</span>
                            <span className="text-muted-foreground">{count} questions</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Difficulty Breakdown</CardTitle>
                  <CardDescription>Question difficulty distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['EASY', 'MEDIUM', 'HARD'].map((difficulty) => {
                      const count = examsData.questions.filter(q => q.difficulty === difficulty).length;
                      const percentage = totalQuestions > 0 ? (count / totalQuestions) * 100 : 0;
                      const color = difficulty === 'EASY' ? 'bg-green-600' :
                                   difficulty === 'HARD' ? 'bg-red-600' : 'bg-blue-600';
                      return (
                        <div key={difficulty} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{difficulty}</span>
                            <span className="text-muted-foreground">
                              {count} questions ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${color}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setActiveTab('competency')} className="justify-start">
                  <BookOpen className="size-4" />
                  Manage Competency Areas
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('questions')} className="justify-start">
                  <FileQuestion className="size-4" />
                  Add New Question
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competency" className="mt-6">
            <CompetencyAreasManager />
          </TabsContent>

          <TabsContent value="questions" className="mt-6">
            <QuestionsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

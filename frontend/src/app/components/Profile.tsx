import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import {
  User,
  Mail,
  GraduationCap,
  Building2,
  Trophy,
  Settings,
  Bell,
  Moon,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="min-h-screen md:ml-64">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 border-4 border-primary-foreground/20">
              <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{user?.full_name}</h1>
              <p className="text-primary-foreground/80 mt-1">{user?.email}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Info */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{user?.full_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
              <GraduationCap className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{user?.department_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">University</p>
                <p className="font-medium">{user?.university_name}</p>
              </div>
            </div>
          </div>

          <Button className="w-full mt-6" variant="outline">
            Edit Profile
          </Button>
        </Card>

        {/* Achievements */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Achievements
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-4 bg-accent/50 rounded-lg">
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-sm font-medium">First Exam</p>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </div>
            <div className="text-center p-4 bg-accent/50 rounded-lg">
              <div className="text-3xl mb-2">⚡</div>
              <p className="text-sm font-medium">Speed Demon</p>
              <p className="text-xs text-muted-foreground mt-1">Under 2 min/q</p>
            </div>
            <div className="text-center p-4 bg-accent/50 rounded-lg">
              <div className="text-3xl mb-2">🔥</div>
              <p className="text-sm font-medium">7 Day Streak</p>
              <p className="text-xs text-muted-foreground mt-1">Active</p>
            </div>
            <div className="text-center p-4 bg-accent/50 rounded-lg opacity-50">
              <div className="text-3xl mb-2">👑</div>
              <p className="text-sm font-medium">Top Scorer</p>
              <p className="text-xs text-muted-foreground mt-1">Locked</p>
            </div>
          </div>
        </Card>

        {/* Subscription */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Subscription</h2>
              <p className="text-sm text-muted-foreground mt-1">Premium Plan</p>
            </div>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">Pro</Badge>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-green-600 dark:text-green-400">Active</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Next billing</span>
              <span className="font-medium">June 12, 2026</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">$29.99/month</span>
            </div>
          </div>
          <Button className="w-full mt-6" variant="outline">
            Manage Subscription
          </Button>
        </Card>

        {/* Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive exam reminders</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Toggle dark theme</p>
                </div>
              </div>
              <Switch />
            </div>

            <button className="flex items-center justify-between w-full p-3 bg-accent/30 rounded-lg hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <Label>Preferences</Label>
                  <p className="text-xs text-muted-foreground">Exam settings & more</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </Card>

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full gap-2"
          size="lg"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </Button>

        {/* App Version */}
        <p className="text-center text-sm text-muted-foreground py-4">
          Exit Examiner v1.0.0
        </p>
      </div>
    </div>
  );
}

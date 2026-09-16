import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardData } from '../pages/admin/data/DashboardData';
import apiClient from '../api/client';
import { 
  Users, Key, Loader2, CheckCircle2, 
  ArrowRight, School, User, XCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card } from './ui/card';

export function JoinClassroom() {
  const { user } = useAuth();
  const { data: dashboardData, refreshData } = useDashboardData();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if student is already in a classroom (assuming 'classroom_name' is in your profile/dashboard API)
  const currentClass = dashboardData?.classroom_name;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return toast.error("Code must be at least 6 characters");

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/join-classroom/', { code: code.toUpperCase() });
      toast.success(response.data.message);
      setCode('');
      refreshData(); // Refresh to show new classroom status
    } catch (err: any) {
      const msg = err.response?.data?.error || "Invalid classroom code";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="overflow-hidden border-none shadow-xl shadow-emerald-900/5 rounded-[40px] bg-white">
      <div className="p-8 md:p-10">
        <AnimatePresence mode="wait">
          {currentClass ? (
            
            <motion.div 
              key="linked"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center mb-6 border border-emerald-100 shadow-sm shadow-emerald-100">
                <School className="text-emerald-600" size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Verified Enrollment</h3>
              <p className="text-slate-500 mt-2 font-medium">You are currently part of the mentor group:</p>
              
              <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 w-full flex items-center gap-4">
                 <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-600">
                    <Users size={20} />
                 </div>
                 <div className="text-left">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Classroom</p>
                    <p className="text-lg font-bold text-slate-900">{currentClass}</p>
                 </div>
              </div>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-8">
                 Locked Session • Contact Admin to switch
              </p>
            </motion.div>
          ) : (
            /* --- STATE 1: JOINING --- */
            <motion.div 
              key="join"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-emerald-50 rounded-[24px] text-emerald-600">
                  <Key size={24} className="rotate-45" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Academic Link</h3>
                  <p className="text-slate-500 font-medium text-sm">Enter your classroom code to connect with your mentor.</p>
                </div>
              </div>

              <form onSubmit={handleJoin} className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ENTER 6-DIGIT CODE"
                    maxLength={8}
                    className="w-full h-20 text-center text-3xl font-black tracking-[0.3em] bg-slate-50 border-2 border-slate-100 rounded-[28px] focus:border-emerald-600 focus:bg-white focus:ring-4 ring-emerald-50 transition-all outline-none placeholder:text-slate-200"
                  />
                  {code.length === 6 && (
                    <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500"
                    >
                      <CheckCircle2 size={28} />
                    </motion.div>
                  )}
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting || code.length < 5}
                  className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-black text-lg shadow-xl shadow-emerald-200 transition-all active:scale-95"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">Sync with Classroom <ArrowRight size={20}/></span>
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
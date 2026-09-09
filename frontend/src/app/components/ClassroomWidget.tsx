import { useState } from 'react';
import { useDashboardData } from '../pages/admin/data/DashboardData';
import { JoinClassroom } from './JoinClassroom';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { School, Users, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export function ClassroomWidget() {
  const { data } = useDashboardData();
  const [isOpen, setIsOpen] = useState(false);
  const hasClassroom = !!data?.classroom_name;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ y: -5 }} className="cursor-pointer group">
          {hasClassroom ? (
            /* LINKED STATE */
            <div className="p-6 rounded-[32px] bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Mentor</p>
                  <h4 className="text-lg font-bold text-slate-900">{data?.mentor_name}</h4>
                  <p className="text-xs text-slate-500 font-medium">{data?.classroom_name}</p>
                </div>
              </div>
            </div>
          ) : (
            /* UNLINKED STATE */
            <div className="p-6 rounded-[32px] bg-emerald-600 text-white shadow-xl shadow-emerald-900/20 flex items-center justify-between relative overflow-hidden">
              <div className="relative z-10 flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <Users size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Join Classroom</h4>
                  <p className="text-xs text-emerald-100/70 font-medium">Link with your Lecturer</p>
                </div>
              </div>
              <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              <School className="absolute -right-4 -bottom-4 text-white/5" size={100} />
            </div>
          )}
        </motion.div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px] p-0 bg-transparent border-none">
        <JoinClassroom />
      </DialogContent>
    </Dialog>
  );
}
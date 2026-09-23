import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { 
  Plus, Edit, Trash2, Check, X, FileQuestion, 
  Search, Loader2, Sparkles, Lightbulb, 
  ChevronRight, AlertCircle, Save
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { MathRenderer } from '../../components/MathInput';

// --- TYPES ---
interface Option {
  id?: number;
  option_text: string;
  is_correct: boolean;
}

interface Question {
  id: number;
  competency_area: number;
  competency_area_name?: string;
  text: string;
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  options: Option[];
}

export default function QuestionsManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Modal & Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    competency_area: '',
    text: '',
    explanation: '',
    difficulty: 'MEDIUM',
    options: [
      { option_text: '', is_correct: true },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
    ]
  });

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sRes, qRes] = await Promise.all([
        apiClient.get('/competency-areas/'),
        apiClient.get('/questions/')
      ]);
      setSubjects(sRes.data);
      setQuestions(qRes.data);
    } catch (err) { toast.error("Sync failed"); }
    finally { setLoading(false); }
  };

  const handleOpenDialog = (q?: Question) => {
    if (q) {
      setEditingQuestion(q);
      setFormData({
        competency_area: String(q.competency_area),
        text: q.text,
        explanation: q.explanation,
        difficulty: q.difficulty,
        options: q.options.map(o => ({ option_text: o.option_text, is_correct: o.is_correct }))
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        competency_area: subjects[0]?.id || '',
        text: '',
        explanation: '',
        difficulty: 'MEDIUM',
        options: [
          { option_text: '', is_correct: true },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
        ]
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this question forever?")) return;
    try {
      await apiClient.delete(`/questions/${id}/`);
      toast.success("Question removed from bank");
      loadAllData();
    } catch (err) { toast.error("Delete failed"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingQuestion) {
        await apiClient.put(`/questions/${editingQuestion.id}/`, formData);
        toast.success("Question updated");
      } else {
        await apiClient.post('/questions/', formData);
        toast.success("New question added to bank");
      }
      setIsDialogOpen(false);
      loadAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Save failed");
    } finally { setSaving(false); }
  };

  const updateOption = (idx: number, text: string) => {
    const newOpts = [...formData.options];
    newOpts[idx].option_text = text;
    setFormData({ ...formData, options: newOpts });
  };

  const setCorrectOption = (idx: number) => {
    const newOpts = formData.options.map((o, i) => ({ ...o, is_correct: i === idx }));
    setFormData({ ...formData, options: newOpts });
  };

  const filteredQuestions = selectedSubject === 'all' 
    ? questions 
    : questions.filter(q => String(q.competency_area) === selectedSubject);

  if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={40} /></div>;

  return (
    <div className="space-y-8">
      {/* TOOLBAR */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 appearance-none focus:ring-2 ring-indigo-500/20"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="all">All Competency Areas</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
         </div>
         <Button onClick={() => handleOpenDialog()} className="h-14 px-8 rounded-2xl bg-indigo-600 text-white font-black shadow-lg shadow-indigo-100">
            <Plus size={20} className="mr-2" /> New Question
         </Button>
      </div>

      {/* LIST */}
      <div className="space-y-6">
        {filteredQuestions.map((q, idx) => (
          <motion.div key={q.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}>
            <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden group">
               <div className="p-8 md:p-10 flex flex-col md:flex-row gap-10">
                  <div className="md:w-64 shrink-0 space-y-4">
                     <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[10px] tracking-widest px-3 py-1 uppercase">ID: {q.id}</Badge>
                     <div className="pt-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Difficulty</p>
                        <span className={`text-xs font-bold ${q.difficulty === 'HARD' ? 'text-rose-600' : 'text-emerald-600'}`}>{q.difficulty} Level</span>
                     </div>
                     <div className="flex gap-2 pt-4">
                        <button onClick={() => handleOpenDialog(q)} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit size={18}/></button>
                        <button onClick={() => handleDelete(q.id)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                     </div>
                  </div>

                  <div className="flex-1">
                     <h3 className="text-xl font-bold text-slate-900 leading-relaxed mb-8"><MathRenderer math={q.text} /></h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {q.options?.map((opt: any, oIdx: number) => (
                           <div key={oIdx} className={`p-4 rounded-2xl border-2 flex items-center gap-4 ${opt.is_correct ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-50 bg-slate-50/50'}`}>
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${opt.is_correct ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{String.fromCharCode(65 + oIdx)}</div>
                              <span className="text-sm font-medium text-slate-700"><MathRenderer math={opt.option_text} /></span>
                           </div>
                        ))}
                     </div>
                     <div className="mt-8 pt-8 border-t border-slate-100 flex gap-4">
                        <div className="p-2 h-fit bg-amber-50 text-amber-600 rounded-lg"><Lightbulb size={16}/></div>
                        <p className="text-sm text-slate-600 italic font-medium">{q.explanation}</p>
                     </div>
                  </div>
               </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* --- CREATE / EDIT DIALOG --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl rounded-[40px] p-0 border-none shadow-2xl overflow-hidden bg-white">
          <div className="p-8 md:p-12">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">
                {editingQuestion ? 'Refine Question' : 'Architect New Question'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Area</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 ring-indigo-500"
                    value={formData.competency_area}
                    onChange={e => setFormData({...formData, competency_area: e.target.value})}
                  >
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Difficulty</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 ring-indigo-500"
                    value={formData.difficulty}
                    onChange={e => setFormData({...formData, difficulty: e.target.value as any})}
                  >
                    <option value="EASY">Entry Level (Easy)</option>
                    <option value="MEDIUM">Standard (Medium)</option>
                    <option value="HARD">Expert (Hard)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Question Content (supports LaTeX)</label>
                <textarea 
                  className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[24px] font-bold text-slate-700 min-h-[120px] outline-none focus:ring-2 ring-indigo-500"
                  value={formData.text}
                  onChange={e => setFormData({...formData, text: e.target.value})}
                  placeholder="e.g. Solve for $x$ in $x^2 = 16$"
                />
              </div>

              {/* OPTIONS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {formData.options.map((opt, i) => (
                   <div key={i} className={`p-4 rounded-[24px] border-2 transition-all flex items-center gap-4 ${opt.is_correct ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-50 bg-slate-50'}`}>
                      <button type="button" onClick={() => setCorrectOption(i)} className={`w-8 h-8 rounded-xl font-bold text-xs ${opt.is_correct ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                        {String.fromCharCode(65 + i)}
                      </button>
                      <input 
                        className="bg-transparent border-none outline-none font-bold text-sm w-full"
                        value={opt.option_text}
                        onChange={e => updateOption(i, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + i)}...`}
                      />
                      {opt.is_correct && <Check size={16} className="text-emerald-500" />}
                   </div>
                 ))}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Learning Explanation</label>
                <textarea 
                  className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[24px] font-medium text-slate-600 min-h-[100px] outline-none"
                  value={formData.explanation}
                  onChange={e => setFormData({...formData, explanation: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                 <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 h-14 rounded-2xl font-bold">Abort</Button>
                 <Button type="submit" disabled={saving} className="flex-1 h-14 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100">
                    {saving ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2"/> Commit Question</>}
                 </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

 
import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { 
  Book, Plus, Database, Loader2, 
  Search, Edit3, Trash2, ArrowRight, X, Check, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';

export function MasterLibrary() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'MGMT', // Default
    description: ''
  });

  useEffect(() => { fetchLibrary(); }, []);

  const fetchLibrary = async () => {
    try {
      const res = await apiClient.get('/owner/books/');
      setBooks(res.data);
    } catch (err) { toast.error("Unauthorized Access"); } 
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/owner/books/', formData);
      toast.success("New Exam Book Published!");
      setIsDialogOpen(false);
      setFormData({ title: '', category: 'MGMT', description: '' });
      fetchLibrary(); // Refresh list
    } catch (err) {
      toast.error("Failed to publish book");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-violet-600" /></div>;

  return (
    <div className="min-h-screen bg-emerald-200 p-6 md:p-12 space-y-10">
      
      {/* 1. HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-2">Content Division</p>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight">Master <span className="text-emerald-600">Library.</span></h1>
        </div>
        
        {/* THE BUTTON IS NOW ACTIVE */}
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-14 px-8 font-black shadow-lg shadow-violet-100 transition-all active:scale-95"
        >
          <Plus size={20} className="mr-2" /> New Publication
        </Button>
      </header>

      {/* 2. BOOKS GRID (Your existing grid code goes here...) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {books.map((book) => (
          <Card key={book.id} className="p-8 border-none shadow-xl shadow-indigo-900/5 rounded-[40px] bg-white group hover:y-[-8px] transition-all">
             <div className="flex justify-between items-start mb-8">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                   <Book size={28} />
                </div>
                <Badge className="bg-slate-100 text-emerald-500 border-none font-bold text-[15px] uppercase">{book.category}</Badge>
             </div>
             <h3 className="text-2xl font-black text-slate-900 mb-2">{book.title}</h3>
             <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-8">{book.description}</p>
             <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">{book.competencies_count} Modules</span>
                <button className="text-blue-600 font-bold text-sm hover:underline">Manage Content</button>
             </div>
          </Card>
        ))}
      </div>

      {/* 3. NEW PUBLICATION DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg rounded-[40px] p-0 border-none shadow-2xl overflow-hidden bg-white">
          <div className="p-10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="text-violet-600" size={24} /> Register New Master Book
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Title</label>
                <input 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. National Nursing Exit Mock 2026"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 ring-violet-500/10 font-bold text-slate-700"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department Mapping</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 ring-violet-500/10 font-bold text-slate-700 appearance-none"
                >
                  <option value="MGMT">Business & Management (MGMT)</option>
                  <option value="NURSING">Nursing & Health (NURSING)</option>
                  <option value="PHARMACY">Pharmacy (PHARMACY)</option>
                  <option value="ENGR">Engineering (ENGR)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Publication Description</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none min-h-[100px] font-medium text-slate-600"
                  placeholder="Summarize the scope of this exam book..."
                />
              </div>

              <div className="flex gap-4 pt-6">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 h-14 rounded-2xl font-bold text-slate-400">Abort</Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black shadow-lg shadow-violet-100"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Publish Book"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { 
  Upload, 
  FileText, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  HelpCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface Competency {
  id: number;
  name: string;
}

export function AdminQuestionUpload() {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // 1. FETCH SUBJECTS: The Admin needs to know WHERE to upload the questions
  useEffect(() => {
    const ca = apiClient.get('/competency-areas/')
    console.log("CAREA", ca);
    apiClient.get('/competency-areas/')

      .then(res => setCompetencies(res.data))
      .catch(() => toast.error("Failed to load competency areas"))
      .finally(() => setLoading(false));
  }, []);

  // 2. TEMPLATE GENERATOR: Creates the exact CSV format Django expects
  const downloadTemplate = () => {
    const headers = "text,option_a,option_b,option_c,option_d,correct_option,explanation\n";
    const sample = '"Which organ filters blood?","Liver","Heart","Kidneys","Lungs","C","The kidneys filter blood to form urine."';
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'exam_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 3. UPLOAD HANDLER
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedCompId) {
      return toast.error("Please select a subject and a CSV file.");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('competency_area_id', selectedCompId);

    setIsUploading(true);
    try {
      const response = await apiClient.post('/exams/questions/upload-csv/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message);
      setFile(null); // Reset
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Import failed. Check CSV format.";
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center md:ml-64"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen md:ml-64 bg-slate-50 p-6 md:p-10">
      <header className="max-w-4xl mx-auto mb-10">
        <h1 className="text-3xl font-black text-slate-900">Content Factory</h1>
        <p className="text-slate-500">Bulk upload questions to your question bank via CSV.</p>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: INSTRUCTIONS */}
        <section className="lg:col-span-1 space-y-6">
          <Card className="p-6 bg-indigo-900 text-white border-none shadow-xl">
             <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="text-indigo-300" size={20} />
                <h2 className="font-bold">Instructions</h2>
             </div>
             <ul className="text-sm space-y-4 opacity-80 list-disc ml-4">
                <li>Use UTF-8 encoded CSV files.</li>
                <li>The "correct_option" must be A, B, C, or D.</li>
                <li>Do not change the header names in the template.</li>
                <li>Each question must have exactly 4 options.</li>
             </ul>
             <Button 
                onClick={downloadTemplate}
                variant="outline" 
                className="w-full mt-8 bg-white/10 border-white/20 hover:bg-white/20 text-white gap-2"
             >
                <Download size={18} /> Download Template
             </Button>
          </Card>
        </section>

        {/* RIGHT: UPLOAD FORM */}
        <section className="lg:col-span-2">
          <Card className="p-8 border-none shadow-sm bg-white">
            <form onSubmit={handleUpload} className="space-y-8">
              
              {/* SUBJECT SELECT */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Target Competency Area</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 ring-indigo-500 transition-all"
                  value={selectedCompId}
                  onChange={(e) => setSelectedCompId(e.target.value)}
                  required
                >
                  <option value="">Choose a subject...</option>
                  {competencies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* FILE DROPZONE */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">CSV File</label>
                <div className={`relative group border-2 border-dashed rounded-[32px] transition-all p-12 text-center ${file ? 'border-green-500 bg-green-50/30' : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50'}`}>
                  <input 
                    type="file" 
                    accept=".csv"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex flex-col items-center">
                    {file ? (
                      <>
                        <CheckCircle2 className="text-green-500 mb-4" size={48} />
                        <p className="font-bold text-slate-900">{file.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-white rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="text-indigo-600" size={32} />
                        </div>
                        <p className="font-bold text-slate-900">Click or drag CSV here</p>
                        <p className="text-xs text-slate-500 mt-1">Limit 2MB per upload</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isUploading}
                className="w-full h-16 rounded-[20px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-100 transition-all"
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin" /> Analyzing & Importing...
                  </span>
                ) : (
                  "Initiate Bulk Import"
                )}
              </Button>
            </form>
          </Card>
        </section>
      </main>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Plus, Edit, Trash2, Check, X, FileQuestion } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import MathInput, { MathRenderer } from '../../components/MathInput';
import apiClient from '../../api/client';
import { toast } from 'sonner';

interface QuestionOption {
  id: string | number;
  text: string;
  mathFormula?: string;
  isCorrect: boolean;
}

interface Question {
  id: number;
  subjectId: string;
  text: string;
  mathFormula?: string;
  imageUrl: string | null;
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  options: QuestionOption[];
  subjectName?: string;
}

interface SubjectItem {
  id: number | string;
  name: string;
}

export default function QuestionsManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | 'all'>('all');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  const [formData, setFormData] = useState({
    subjectId: '',
    text: '',
    mathFormula: '',
    explanation: '',
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    options: [
      { id: '1', text: '', mathFormula: '', isCorrect: false },
      { id: '2', text: '', mathFormula: '', isCorrect: false },
      { id: '3', text: '', mathFormula: '', isCorrect: false },
      { id: '4', text: '', mathFormula: '', isCorrect: false },
    ] as QuestionOption[],
  });

  useEffect(() => {
    loadAll();
  }, []);

  // Replace existing loadAll with a robust loader that:
  // 1) tries the /competency-areas/ list endpoint (paginated or plain)
  // 2) falls back to fetching /departments/ and aggregating /departments/:id/competency-areas/
  // 3) logs errors for easier debugging and shows a toast on failure
  async function loadAll() {
    setLoading(true);
    try {
      // Attempt direct competency-areas endpoint first
      let subListRaw: any[] = [];
      try {
        const subsRes = await apiClient.get('/competency-areas/?page_size=1000');
        subListRaw = Array.isArray(subsRes.data) ? subsRes.data : subsRes.data?.results ?? [];
      } catch (err) {
        // swallow and fallback below
        console.warn('competency-areas list failed, will fallback to per-department fetch', err);
      }

      // Fallback: aggregate per-department competency areas
      if (!subListRaw || subListRaw.length === 0) {
        try {
          const depsRes = await apiClient.get('/departments/');
          const deps: any[] = depsRes.data || [];
          const lists = await Promise.all(
            deps.map((d) =>
              apiClient
                .get(`/departments/${d.id}/competency-areas/`)
                .then((r) =>
                  (r.data || []).map((item: any) => ({
                    ...item,
                    department_name: d.name,
                  }))
                )
                .catch((e) => {
                  console.warn(`failed to load competency areas for dept ${d.id}`, e);
                  return [];
                })
            )
          );
          subListRaw = lists.flat();
        } catch (err) {
          console.error('failed to fetch departments for fallback', err);
          throw err; // will be caught by outer catch
        }
      }

      // normalize into subjects used by this component
      const normalized = (subListRaw || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        department: s.department ?? s.department_id ?? null,
        department_name: s.department_name ?? s.department_name ?? s.department_name,
        question_count: s.question_count ?? s.questions_count ?? 0,
        duration_minutes: s.duration_minutes ?? null,
      }));

      setSubjects(normalized);

      // fetch questions (same as before)
      try {
        const qRes = await apiClient.get('/questions/?page_size=1000');
        const qListRaw = Array.isArray(qRes.data) ? qRes.data : qRes.data?.results ?? [];
        const mapped: Question[] = qListRaw.map((q: any) => ({
          id: q.id,
          subjectId: String(q.competency_area),
          subjectName: q.competency_area_name ?? '',
          text: q.text,
          mathFormula: (q as any).math_formula ?? undefined,
          imageUrl: (q as any).image_url ?? null,
          explanation: q.explanation ?? '',
          difficulty: q.difficulty ?? 'MEDIUM',
          options: (q.options || []).map((opt: any) => ({
            id: opt.id,
            text: opt.option_text,
            mathFormula: (opt as any).math_formula ?? undefined,
            isCorrect: !!opt.is_correct,
          })),
        }));
        setQuestions(mapped);
      } catch (err) {
        console.warn('failed to load questions', err);
        toast.error('Failed to load questions');
      }
    } catch (err) {
      console.error('loadAll error', err);
      toast.error('Failed to load subjects/competency areas');
    } finally {
      setLoading(false);
    }
  }

  const handleOpenDialog = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        subjectId: question.subjectId,
        text: question.text,
        mathFormula: question.mathFormula || '',
        explanation: question.explanation,
        difficulty: question.difficulty,
        options: question.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          mathFormula: opt.mathFormula || '',
          isCorrect: !!opt.isCorrect,
        })),
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        subjectId: '',
        text: '',
        mathFormula: '',
        explanation: '',
        difficulty: 'MEDIUM',
        options: [
          { id: '1', text: '', mathFormula: '', isCorrect: false },
          { id: '2', text: '', mathFormula: '', isCorrect: false },
          { id: '3', text: '', mathFormula: '', isCorrect: false },
          { id: '4', text: '', mathFormula: '', isCorrect: false },
        ],
      });
    }
    setIsDialogOpen(true);
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => String(s.id) === String(subjectId))?.name || 'Unknown';
  };

  const filteredQuestions = selectedSubject === 'all'
    ? questions
    : questions.filter(q => q.subjectId === selectedSubject);

  const toggleCorrectAnswer = (index: number) => {
    const newOptions = formData.options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }));
    setFormData({ ...formData, options: newOptions });
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await apiClient.delete(`/questions/${id}/`);
      toast.success('Question deleted');
      await loadAll();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectId || !formData.text.trim()) {
      toast.error('Please provide subject and question text');
      return;
    }
    if (!formData.options.some(o => o.isCorrect)) {
      toast.error('Please mark at least one option as correct');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        competency_area: Number(formData.subjectId),
        text: formData.text,
        explanation: formData.explanation,
        difficulty: formData.difficulty,
        // options are read-only on the main Question serializer in backend.
        // include them optimistically; backend may ignore them. We reload list after save.
        options: formData.options.map(o => ({ option_text: o.text, is_correct: !!o.isCorrect })),
      };

      if (editingQuestion) {
        await apiClient.put(`/questions/${editingQuestion.id}/`, payload);
        toast.success('Question updated');
      } else {
        await apiClient.post('/questions/', payload);
        toast.success('Question created');
      }

      await loadAll();
      setIsDialogOpen(false);
      setSuccessMessage(editingQuestion ? 'Question updated successfully!' : 'Question created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || (err?.response?.data && JSON.stringify(err.response.data)) || 'Save failed';
      toast.error(String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Questions Bank</h2>
          <p className="text-muted-foreground">Create and manage exam questions with math support</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedSubject} onValueChange={(v: any) => setSelectedSubject(v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={String(subject.id)} value={String(subject.id)}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="size-4" />
            Add Question
          </Button>
        </div>
      </div>

      {successMessage && (
        <Alert className="bg-green-50 dark:bg-green-950/20 border-green-600">
          <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="p-6 text-center text-slate-400">Loading…</div>
        ) : filteredQuestions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Q{index + 1}</Badge>
                    <Badge>{getSubjectName(question.subjectId)}</Badge>
                    <Badge variant={
                      question.difficulty === 'EASY' ? 'secondary' :
                      question.difficulty === 'HARD' ? 'destructive' : 'default'
                    }>
                      {question.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{question.text}</CardTitle>
                  {question.mathFormula && (
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <MathRenderer math={question.mathFormula} />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => handleOpenDialog(question)}>
                    <Edit className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(question.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {question.options.map((option, optIdx) => (
                <div
                  key={String(option.id)}
                  className={`p-3 rounded-lg border-2 ${option.isCorrect ? 'border-green-600 bg-green-50' : 'border-border'}`}
                >
                  <div className="flex items-start gap-2">
                    {option.isCorrect && <Check className="size-5 text-green-600 shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <span className="text-sm font-medium">Option {String.fromCharCode(65 + optIdx)}:</span>
                      <p className="text-sm mt-1">{option.text}</p>
                      {option.mathFormula && (
                        <div className="mt-2">
                          <MathRenderer math={option.mathFormula} inline />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t">
                <p className="text-sm font-medium mb-1">Explanation:</p>
                <p className="text-sm text-muted-foreground">{question.explanation}</p>
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && filteredQuestions.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileQuestion className="size-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {selectedSubject === 'all' ? 'No questions yet' : 'No questions for this subject'}
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="size-4" />
                Create First Question
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Edit' : 'Create'} Question</DialogTitle>
            <DialogDescription>
              {editingQuestion
                ? 'Update the question details below. You can use LaTeX for math equations.'
                : 'Add a new question with multiple choice options. Math equations supported via LaTeX.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList>
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="options">Options</TabsTrigger>
                <TabsTrigger value="explanation">Explanation</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject / Competency Area *
                  </label>
                  <Select
                    value={formData.subjectId}
                    onValueChange={(value: any) => setFormData({ ...formData, subjectId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={String(subject.id)} value={String(subject.id)}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="difficulty" className="text-sm font-medium">
                    Difficulty Level *
                  </label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HARD">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="text" className="text-sm font-medium">
                    Question Text *
                  </label>
                  <Textarea
                    id="text"
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    placeholder="Enter the question text..."
                    required
                    rows={3}
                  />
                </div>

                <MathInput
                  label="Question Math Formula (Optional)"
                  value={formData.mathFormula}
                  onChange={(value) => setFormData({ ...formData, mathFormula: value })}
                  placeholder="Enter LaTeX equation for the question"
                />
              </TabsContent>

              <TabsContent value="options" className="space-y-4 mt-4">
                {formData.options.map((option, index) => (
                  <Card key={String(option.id)}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Option {String.fromCharCode(65 + index)}</CardTitle>
                        <Button
                          type="button"
                          variant={option.isCorrect ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleCorrectAnswer(index)}
                        >
                          {option.isCorrect ? (
                            <>
                              <Check className="size-4" />
                              Correct Answer
                            </>
                          ) : (
                            <>
                              <X className="size-4" />
                              Mark as Correct
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Option Text *</label>
                        <Input
                          value={option.text}
                          onChange={(e) => updateOption(index, 'text', e.target.value)}
                          placeholder={`Enter option ${String.fromCharCode(65 + index)} text`}
                          required
                        />
                      </div>

                      <MathInput
                        label="Option Math Formula (Optional)"
                        value={option.mathFormula || ''}
                        onChange={(value) => updateOption(index, 'mathFormula', value)}
                        placeholder="Enter LaTeX equation for this option"
                      />
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="explanation" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="explanation" className="text-sm font-medium">
                    Explanation *
                  </label>
                  <Textarea
                    id="explanation"
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    placeholder="Provide a detailed explanation of the correct answer..."
                    required
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    This explanation will be shown to students after they answer (in practice mode).
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {editingQuestion ? 'Update' : 'Create'} Question
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

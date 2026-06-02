import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import apiClient from '../../api/client';
import { toast } from 'sonner';

interface Dept {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
  department: number;
  department_name?: string;
  question_count?: number;
  duration_minutes?: number | null;
}

export default function CompetencyAreasManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    departmentId: '',
    duration_minutes: '' as number | '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const depsRes = await apiClient.get('/departments/');
      const deps: Dept[] = depsRes.data || [];
      setDepartments(deps);

      // fetch competency areas per department and combine
      const lists = await Promise.all(
        deps.map((d) =>
          apiClient
            .get(`/departments/${d.id}/competency-areas/`)
            .then((r) =>
              (r.data || []).map((item: any) => ({
                ...item,
                department: d.id,
                department_name: d.name,
              }))
            )
            .catch(() => [])
        )
      );
      const combined = lists.flat();
      setSubjects(combined);
    } catch (err) {
      toast.error('Failed to load competency areas or departments');
    } finally {
      setLoading(false);
    }
  }

  const handleOpenDialog = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name,
        departmentId: String(subject.department),
        duration_minutes: subject.duration_minutes ?? '',
      });
    } else {
      setEditingSubject(null);
      setFormData({ name: '', departmentId: '', duration_minutes: '' });
    }
    setIsDialogOpen(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.departmentId) return toast.error('Name and department required');
    setSaving(true);

    const payload: any = { name: formData.name.trim() };
    if (formData.duration_minutes !== '') payload.duration_minutes = Number(formData.duration_minutes);

    try {
      if (editingSubject) {
        const oldDept = editingSubject.department;
        const newDept = Number(formData.departmentId);

        if (oldDept === newDept) {
          // patch on same department
          const res = await apiClient.patch(`/departments/${oldDept}/competency-areas/`, { id: editingSubject.id, ...payload });
          // update local
          setSubjects((prev) => prev.map((s) => (s.id === res.data.id ? { ...res.data, department: oldDept, department_name: departments.find(d => d.id === oldDept)?.name } : s)));
          toast.success('Competency area updated');
        } else {
          // move: delete from old, create in new
          await apiClient.delete(`/departments/${oldDept}/competency-areas/`, { data: { id: editingSubject.id } });
          const res = await apiClient.post(`/departments/${newDept}/competency-areas/`, payload);
          setSubjects((prev) => prev.map((s) => (s.id === editingSubject.id ? { ...res.data, department: newDept, department_name: departments.find(d => d.id === newDept)?.name } : s)));
          // if id changed on create, refresh list instead to avoid inconsistencies
          if (res.data.id !== editingSubject.id) await loadAll();
          toast.success('Competency area moved/updated');
        }
      } else {
        // create
        const deptId = Number(formData.departmentId);
        const res = await apiClient.post(`/departments/${deptId}/competency-areas/`, payload);
        setSubjects((prev) => [{ ...res.data, department: deptId, department_name: departments.find(d => d.id === deptId)?.name }, ...prev]);
        toast.success('Competency area created');
      }

      setIsDialogOpen(false);
      setFormData({ name: '', departmentId: '', duration_minutes: '' });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || (err?.response?.data && JSON.stringify(err.response.data)) || 'Save failed';
      toast.error(String(msg));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(subject: Subject) {
    if (!confirm('Delete this competency area? This will affect associated questions.')) return;
    try {
      await apiClient.delete(`/departments/${subject.department}/competency-areas/`, { data: { id: subject.id } });
      setSubjects((prev) => prev.filter((s) => s.id !== subject.id));
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Competency Areas</h2>
          <p className="text-muted-foreground">Manage subject areas and topics for examinations</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="size-4" />
          Add Competency Area
        </Button>
      </div>

      {successMessage && (
        <Alert className="bg-green-50 dark:bg-green-950/20 border-green-600">
          <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-6 text-center text-slate-400">Loading…</div>
        ) : subjects.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="size-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No competency areas yet</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="size-4" />
                Create First Competency Area
              </Button>
            </CardContent>
          </Card>
        ) : (
          subjects.map((subject) => (
            <Card key={String(subject.id)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <BookOpen className="size-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <CardDescription>{subject.department_name || 'Unknown'}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-muted-foreground">
                    {subject.question_count ?? 0} questions
                  </div>
                  <Badge variant="outline">ID: {subject.id}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(subject)}
                    className="flex-1"
                  >
                    <Edit className="size-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(subject)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'Edit' : 'Create'} Competency Area</DialogTitle>
            <DialogDescription>
              {editingSubject
                ? 'Update the competency area details below.'
                : 'Add a new subject area for exam questions.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Subject Name *
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Human Anatomy, Pharmacology"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="department" className="text-sm font-medium">
                Department *
              </label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="duration" className="text-sm font-medium">Duration (minutes)</label>
              <Input
                id="duration"
                value={formData.duration_minutes as any}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="Optional"
                type="number"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {editingSubject ? 'Update' : 'Create'} Competency Area
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

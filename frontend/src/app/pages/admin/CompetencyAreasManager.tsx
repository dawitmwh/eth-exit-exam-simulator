import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import usersData from './data/users.json';
import examsData from './data/exams.json';

interface Subject {
  id: string;
  name: string;
  departmentId: string;
  questionCount?: number;
}

export default function CompetencyAreasManager() {
  const [subjects, setSubjects] = useState<Subject[]>(examsData.subjects);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    departmentId: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  const handleOpenDialog = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name,
        departmentId: subject.departmentId,
      });
    } else {
      setEditingSubject(null);
      setFormData({ name: '', departmentId: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSubject) {
      // Update existing
      setSubjects(subjects.map(s =>
        s.id === editingSubject.id
          ? { ...s, name: formData.name, departmentId: formData.departmentId }
          : s
      ));
      setSuccessMessage('Competency area updated successfully!');
    } else {
      // Create new
      const newSubject: Subject = {
        id: String(subjects.length + 1),
        name: formData.name,
        departmentId: formData.departmentId,
        questionCount: 0,
      };
      setSubjects([...subjects, newSubject]);
      setSuccessMessage('Competency area created successfully!');
    }

    setIsDialogOpen(false);
    setFormData({ name: '', departmentId: '' });
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this competency area? This will affect all associated questions.')) {
      setSubjects(subjects.filter(s => s.id !== id));
      setSuccessMessage('Competency area deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const getDepartmentName = (deptId: string) => {
    return usersData.departments.find(d => d.id === deptId)?.name || 'Unknown';
  };

  const getQuestionCount = (subjectId: string) => {
    return examsData.questions.filter(q => q.subjectId === subjectId).length;
  };

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
        {subjects.map((subject) => (
          <Card key={subject.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <BookOpen className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    <CardDescription>{getDepartmentName(subject.departmentId)}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  {getQuestionCount(subject.id)} questions
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
                  onClick={() => handleDelete(subject.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {subjects.length === 0 && (
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
                  {usersData.departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingSubject ? 'Update' : 'Create'} Competency Area
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

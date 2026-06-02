import { useEffect, useState, useMemo } from 'react';
import apiClient from '../../api/client';
import { Plus, Trash2, Edit2, Tag, ChevronRight, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Departments Management (CRUD) with Competency Areas inside each department.
 * - Left: list of departments (create / edit / delete)
 * - Right: selected department detail + competency areas (list / add / remove)
 *
 * API expectations (adapt if your backend endpoints differ):
 * - GET  /departments/                 => list of departments
 * - POST /departments/                 => create { name, description }
 * - PUT  /departments/:id/             => update { name, description }
 * - DELETE /departments/:id/           => delete
 * - GET  /departments/:id/competencies/ => list competency areas for dept
 * - POST /competencies/                => create { name, department: id }
 * - DELETE /competencies/:id/          => delete
 */

type Dept = {
  id: number;
  name: string;
  description?: string | null;
  competencies_count?: number;
};

type Competency = {
  id: number;
  name: string;
};

export default function DepartmentsManager() {
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loadingCompetencies, setLoadingCompetencies] = useState(false);

  // Create / Edit form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Dept | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');

  // Competency form
  const [newCompetency, setNewCompetency] = useState('');
  const [isAddingCompetency, setIsAddingCompetency] = useState(false);

  const selectedDept = useMemo(
    () => departments.find((d) => d.id === selectedId) ?? null,
    [departments, selectedId]
  );

  useEffect(() => {
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId !== null) fetchCompetencies(selectedId);
  }, [selectedId]);

  async function fetchDepartments() {
    setLoading(true);
    try {
      const res = await apiClient.get('/departments/');
      // Expect array of { id, name, description, competencies_count? }
      setDepartments(res.data);
      if (res.data.length > 0 && selectedId === null) setSelectedId(res.data[0].id);
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCompetencies(departmentId: number) {
    setLoadingCompetencies(true);
    try {
      // Use department-scoped endpoint that handles all methods:
      // GET  /departments/:dept_id/competency-areas/
      const res = await apiClient.get(`/departments/${departmentId}/competency-areas/`);
      setCompetencies(res.data);
    } catch (err) {
      // If backend returns competencies nested inside department list, attempt to fallback
      const dept = departments.find((d) => d.id === departmentId) as any;
      if (dept?.competencies) setCompetencies(dept.competencies);
      else toast.error('Failed to load competency areas');
    } finally {
      setLoadingCompetencies(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setFormName('');
    setFormDesc('');
    setIsFormOpen(true);
  }

  function openEdit(d: Dept) {
    setEditing(d);
    setFormName(d.name || '');
    setFormDesc(d.description || '');
    setIsFormOpen(true);
  }

  async function submitForm(e?: React.FormEvent) {
    e?.preventDefault();
    if (!formName.trim()) return toast.error('Name is required');

    try {
      if (editing) {
        const res = await apiClient.put(`/departments/${editing.id}/`, {
          name: formName.trim(),
          description: formDesc.trim(),
        });
        setDepartments((prev) => prev.map((p) => (p.id === editing.id ? res.data : p)));
        toast.success('Department updated');
      } else {
        const res = await apiClient.post('/departments/', {
          name: formName.trim(),
          description: formDesc.trim(),
        });
        setDepartments((prev) => [res.data, ...prev]);
        toast.success('Department created');
        setSelectedId(res.data.id);
      }
      setIsFormOpen(false);
    } catch (err) {
      toast.error('Save failed');
    }
  }

  async function removeDepartment(id: number) {
    if (!confirm('Delete this department and its data?')) return;
    try {
      await apiClient.delete(`/departments/${id}/`);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      toast.success('Department removed');
      if (selectedId === id) setSelectedId(departments.length ? departments[0].id ?? null : null);
    } catch (err) {
      toast.error('Delete failed');
    }
  }

  async function addCompetency(e?: React.FormEvent) {
    e?.preventDefault();
    if (!newCompetency.trim() || !selectedId) return;
    setIsAddingCompetency(true);
    try {
      // create via department-scoped endpoint:
      // POST /departments/:dept_id/competency-areas/  body: { name, ... }
      const res = await apiClient.post(`/departments/${selectedId}/competency-areas/`, {
        name: newCompetency.trim(),
      });
      setCompetencies((prev) => [...prev, res.data]);
      setNewCompetency('');
      toast.success('Competency added');
    } catch (err) {
      toast.error('Add competency failed');
    } finally {
      setIsAddingCompetency(false);
    }
  }

  async function removeCompetency(id: number) {
    if (!confirm('Remove competency?')) return;
    try {
      // delete via single department endpoint: send id in body (endpoint supports DELETE)
      // DELETE /departments/:dept_id/competency-areas/  body: { id }
      await apiClient.delete(`/departments/${selectedId}/competency-areas/`, { data: { id } });
      setCompetencies((prev) => prev.filter((c) => c.id !== id));
      toast.success('Competency removed');
    } catch (err) {
      toast.error('Remove failed');
    }
  }

  // Optional: update competency (PATCH using department endpoint)
  async function updateCompetency(id: number, payload: Partial<{ name: string }>) {
    if (!selectedId) return;
    try {
      const res = await apiClient.patch(`/departments/${selectedId}/competency-areas/`, { id, ...payload });
      setCompetencies((prev) => prev.map((c) => (c.id === id ? res.data : c)));
      toast.success('Competency updated');
    } catch (err) {
      toast.error('Update failed');
    }
  }

  return (
    <div className="min-h-screen md:ml-64 bg-cyan-50/60 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Departments</h1>
            <p className="text-slate-600 mt-1">Create, edit and organize departments and their competency areas.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-purple-900 text-cyan-50 px-4 py-2 rounded-lg shadow hover:brightness-95"
            >
              <Plus size={16} /> New Department
            </button>
            <button
              onClick={fetchDepartments}
              className="inline-flex items-center gap-2 border border-slate-200 px-3 py-2 rounded-lg bg-white"
            >
              Refresh
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Departments list */}
          <section className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold">All Departments</h3>
                <span className="text-xs text-slate-400">{departments.length}</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-slate-400">Loading…</div>
                ) : departments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    No departments yet. Create one.
                  </div>
                ) : (
                  departments.map((d) => {
                    const active = d.id === selectedId;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setSelectedId(d.id)}
                        className={`w-full text-left p-4 flex items-start gap-3 hover:bg-slate-50 ${
                          active ? 'bg-purple-900/10 border-l-4 border-purple-900' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-md bg-purple-50 text-purple-700">
                                <Tag size={16} />
                              </div>
                              <div>
                                <div className={`font-semibold ${active ? 'text-purple-900' : 'text-slate-800'}`}>
                                  {d.name}
                                </div>
                                <div className="text-xs text-slate-400">{d.description || '—'}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                title="Edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(d);
                                }}
                                className="p-2 rounded hover:bg-slate-100"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                title="Delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeDepartment(d.id);
                                }}
                                className="p-2 rounded hover:bg-slate-100 text-rose-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            {typeof d.competencies_count === 'number' ? `${d.competencies_count} competency areas` : '—'}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          {/* RIGHT: Selected department details and competencies */}
          <section className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              {!selectedDept ? (
                <div className="text-center py-24 text-slate-400">Select a department to manage competency areas.</div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedDept.name}</h2>
                      <p className="text-sm text-slate-500 mt-1">{selectedDept.description || 'No description provided.'}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(selectedDept)}
                        className="px-3 py-2 bg-slate-100 rounded-md"
                        title="Edit department"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => removeDepartment(selectedDept.id)}
                        className="px-3 py-2 bg-rose-50 text-rose-600 rounded-md"
                        title="Delete department"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Competency Areas</h3>
                      <div className="flex items-center gap-3">
                        <form onSubmit={addCompetency} className="flex items-center gap-2">
                          <input
                            value={newCompetency}
                            onChange={(e) => setNewCompetency(e.target.value)}
                            placeholder="New competency name"
                            className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 outline-none"
                          />
                          <button
                            type="submit"
                            disabled={isAddingCompetency}
                            className="inline-flex items-center gap-2 bg-purple-900 text-cyan-50 px-3 py-2 rounded-lg"
                          >
                            <Plus size={14} /> Add
                          </button>
                        </form>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {loadingCompetencies ? (
                        <div className="p-6 text-slate-400">Loading competencies…</div>
                      ) : competencies.length === 0 ? (
                        <div className="p-6 text-slate-400">No competency areas yet.</div>
                      ) : (
                        competencies.map((c) => (
                          <motion.div
                            layout
                            key={c.id}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-md bg-cyan-50 text-cyan-700">
                                <ChevronRight size={16} />
                              </div>
                              <div>
                                <div className="font-medium text-slate-800">{c.name}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => removeCompetency(c.id)}
                                className="text-rose-600 p-2 rounded hover:bg-rose-50"
                                title="Remove competency"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsFormOpen(false)} />

            <motion.form
              initial={{ y: 20, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 10, opacity: 0 }}
              onSubmit={submitForm}
              className="relative z-10 w-full max-w-xl bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">{editing ? 'Edit Department' : 'New Department'}</h3>
                  <p className="text-sm text-slate-500">{editing ? 'Update department details' : 'Create a new department'}</p>
                </div>
                <button type="button" onClick={() => setIsFormOpen(false)} className="p-2 rounded-md">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Name</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">Description</label>
                  <textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 outline-none"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-3 justify-end">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 rounded-lg border">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-purple-900 text-cyan-50 flex items-center gap-2">
                    <Check size={16} /> {editing ? 'Save' : 'Create'}
                  </button>
                </div>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
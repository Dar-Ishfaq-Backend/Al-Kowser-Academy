import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, BookOpen, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAllCoursesAdmin, updateCourse, deleteCourse } from '../../services/courseService';
import { LoadingSpinner, Badge, Modal, Button } from '../../components/ui/index.jsx';

export default function AdminCourses() {
  const [courses, setCourses]       = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => { load(); }, []);
  useEffect(() => {
    setFiltered(courses.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, courses]);

  const load = async () => {
    try {
      const data = await fetchAllCoursesAdmin();
      setCourses(data);
    } catch { toast.error('Failed to load courses'); }
    finally { setLoading(false); }
  };

  const togglePublish = async (course) => {
    try {
      const updated = await updateCourse(course.id, { is_published: !course.is_published });
      setCourses(prev => prev.map(c => c.id === course.id ? { ...c, ...updated } : c));
      toast.success(updated.is_published ? 'Course published ✅' : 'Course unpublished');
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCourse(deleteTarget.id);
      setCourses(prev => prev.filter(c => c.id !== deleteTarget.id));
      toast.success('Course deleted');
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); setDeleteTarget(null); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream">Manage Courses</h1>
          <p className="text-slate-muted text-sm mt-1">{courses.length} courses total</p>
        </div>
        <Link to="/admin/courses/create" className="btn-gold flex items-center gap-2 text-sm">
          <Plus size={16} /> New Course
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search courses…" className="input-field pl-9" />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="glass-card text-center py-20">
          <BookOpen size={40} className="text-navy-border mx-auto mb-3" />
          <p className="text-slate-muted mb-4">No courses yet.</p>
          <Link to="/admin/courses/create" className="btn-gold">Create First Course</Link>
        </div>
      ) : (
        <div className="glass-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-navy-border bg-navy-dark/40">
                  {['Course', 'Category', 'Level', 'Lessons', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-[11px] text-slate-muted font-semibold
                      p-4 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id}
                    className={`border-b border-navy-border/40 hover:bg-navy-border/20
                      transition-colors ${i === filtered.length - 1 ? 'border-none' : ''}`}>
                    <td className="p-4 max-w-[200px]">
                      <p className="text-sm font-semibold text-cream line-clamp-1">{c.title}</p>
                      <p className="text-[11px] text-slate-muted mt-0.5">
                        ID: {c.id.slice(0, 8)}…
                      </p>
                    </td>
                    <td className="p-4 text-xs text-slate-muted">{c.category}</td>
                    <td className="p-4">
                      <Badge variant={c.level === 'beginner' ? 'green' : 'gold'}>{c.level}</Badge>
                    </td>
                    <td className="p-4 text-sm text-cream">{c.total_lessons}</td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold ${
                        c.is_published ? 'text-green-light' : 'text-slate-muted'}`}>
                        {c.is_published ? '● Published' : '○ Draft'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => togglePublish(c)}
                          title={c.is_published ? 'Unpublish' : 'Publish'}
                          className="p-1.5 rounded-lg hover:bg-navy-border text-slate-muted
                            hover:text-green-light transition-all">
                          {c.is_published ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <Link to={`/admin/courses/${c.id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-navy-border text-slate-muted
                            hover:text-gold transition-all">
                          <Edit size={15} />
                        </Link>
                        <button onClick={() => setDeleteTarget(c)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-muted
                            hover:text-red-400 transition-all">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        title="Delete Course">
        <div className="space-y-4">
          <p className="text-cream-muted text-sm">
            Are you sure you want to delete{' '}
            <span className="text-cream font-semibold">"{deleteTarget?.title}"</span>?
            This will remove all modules, lessons, and student progress. This cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

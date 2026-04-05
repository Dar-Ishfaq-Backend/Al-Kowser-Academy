import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Globe, Lock, Plus, Save, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import {
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  fetchCourseById,
  importPlaylistAsCourse,
  updateCourse,
  updateLesson,
  updateModule,
  uploadThumbnail,
} from '../../services/courseService';
import PlaylistImporter from '../../components/admin/PlaylistImporter';
import { Button, Card, Input, Select, Textarea } from '../../components/ui/index.jsx';

const CATS = ['Islamic Studies', 'Quran', 'Fiqh', 'Hadith', 'Aqeedah', 'Arabic', 'Seerah', 'Other'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const LANGS = ['English', 'Urdu', 'Arabic', 'Bengali', 'Turkish'];

const sortByOrder = (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0);

function makeLocalId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeLesson(lesson, lessonIndex = 0) {
  return {
    id: lesson.id,
    title: lesson.title || '',
    youtube_id: lesson.youtube_id || '',
    thumbnail_url: lesson.thumbnail_url || '',
    duration_sec: Number(lesson.duration_sec) || 0,
    description: lesson.description || '',
    order: Number.isFinite(Number(lesson.order)) ? Number(lesson.order) : lessonIndex,
  };
}

function normalizeModule(module, moduleIndex = 0) {
  return {
    id: module.id,
    title: module.title || '',
    order: Number.isFinite(Number(module.order)) ? Number(module.order) : moduleIndex,
    lessons: (module.lessons || [])
      .sort(sortByOrder)
      .map((lesson, lessonIndex) => normalizeLesson(lesson, lessonIndex)),
  };
}

function makeNewLesson(lessonIndex = 0) {
  return {
    id: makeLocalId('new-lesson'),
    title: '',
    youtube_id: '',
    thumbnail_url: '',
    duration_sec: 0,
    description: '',
    order: lessonIndex,
  };
}

function makeNewModule(moduleIndex = 0) {
  return {
    id: makeLocalId('new-module'),
    title: `Module ${moduleIndex + 1}`,
    order: moduleIndex,
    lessons: [makeNewLesson(0)],
  };
}

export default function CreateCourse() {
  const { id: courseId } = useParams();
  const isEdit = !!courseId;
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Islamic Studies',
    level: 'beginner',
    language: 'English',
    playlist_id: '',
    thumbnail_url: '',
    is_free: true,
    price: 0,
    is_published: false,
  });
  const [playlist, setPlaylist] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [modules, setModules] = useState([]);
  const [deletedModuleIds, setDeletedModuleIds] = useState([]);
  const [deletedLessonIds, setDeletedLessonIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingEditData, setLoadingEditData] = useState(false);

  const previewThumbnail = thumbPreview || form.thumbnail_url;
  const sortedModules = useMemo(
    () => [...modules].sort(sortByOrder),
    [modules],
  );
  const totalLessons = useMemo(
    () => sortedModules.reduce((count, module) => count + module.lessons.length, 0),
    [sortedModules],
  );

  useEffect(() => {
    return () => {
      if (thumbPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(thumbPreview);
      }
    };
  }, [thumbPreview]);

  useEffect(() => {
    if (isEdit) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    setLoadingEditData(true);
    try {
      const course = await fetchCourseById(courseId);
      setForm({
        title: course.title,
        description: course.description || '',
        category: course.category || 'Islamic Studies',
        level: course.level || 'beginner',
        language: course.language || 'English',
        playlist_id: course.playlist_id || '',
        thumbnail_url: course.thumbnail_url || '',
        is_free: course.is_free,
        price: course.price || 0,
        is_published: course.is_published,
      });
      setThumbFile(null);
      setThumbPreview('');
      setModules((course.modules || []).sort(sortByOrder).map((module, moduleIndex) => normalizeModule(module, moduleIndex)));
      setDeletedModuleIds([]);
      setDeletedLessonIds([]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load course editor');
      navigate('/admin/courses');
    } finally {
      setLoadingEditData(false);
    }
  };

  const setField = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleThumbChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (thumbPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(thumbPreview);
    }

    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const handlePlaylistImported = (data) => {
    setPlaylist(data);
    setForm((prev) => ({
      ...prev,
      title: prev.title || data.title,
      description: prev.description || data.description?.slice(0, 500) || '',
      playlist_id: data.playlistId || prev.playlist_id,
      thumbnail_url: prev.thumbnail_url || data.thumbnail || '',
    }));
    toast.success(`Playlist ready: ${data.videos.length} videos`);
  };

  const updateModuleField = (moduleId, key, value) => {
    setModules((prev) => prev.map((module) => (
      module.id === moduleId ? { ...module, [key]: value } : module
    )));
  };

  const updateLessonField = (moduleId, lessonId, key, value) => {
    setModules((prev) => prev.map((module) => {
      if (module.id !== moduleId) return module;
      return {
        ...module,
        lessons: module.lessons.map((lesson) => (
          lesson.id === lessonId ? { ...lesson, [key]: value } : lesson
        )),
      };
    }));
  };

  const addModuleBlock = () => {
    setModules((prev) => [...prev, makeNewModule(prev.length)]);
  };

  const removeModuleBlock = (moduleId) => {
    if (modules.length === 1) {
      toast.error('A course needs at least one module');
      return;
    }

    const target = modules.find((module) => module.id === moduleId);
    if (!target) return;

    if (!String(moduleId).startsWith('new-module')) {
      setDeletedModuleIds((prev) => [...prev, moduleId]);
    }

    const existingLessonIds = target.lessons
      .map((lesson) => lesson.id)
      .filter((lessonId) => !String(lessonId).startsWith('new-lesson'));

    if (existingLessonIds.length) {
      setDeletedLessonIds((prev) => [...prev, ...existingLessonIds]);
    }

    setModules((prev) => prev.filter((module) => module.id !== moduleId));
  };

  const addLessonToModule = (moduleId) => {
    setModules((prev) => prev.map((module) => {
      if (module.id !== moduleId) return module;
      return {
        ...module,
        lessons: [...module.lessons, makeNewLesson(module.lessons.length)],
      };
    }));
  };

  const removeLessonFromModule = (moduleId, lessonId) => {
    const targetModule = modules.find((module) => module.id === moduleId);
    if (!targetModule) return;

    if (targetModule.lessons.length === 1) {
      toast.error('A module needs at least one lesson');
      return;
    }

    if (!String(lessonId).startsWith('new-lesson')) {
      setDeletedLessonIds((prev) => [...prev, lessonId]);
    }

    setModules((prev) => prev.map((module) => {
      if (module.id !== moduleId) return module;
      return {
        ...module,
        lessons: module.lessons.filter((lesson) => lesson.id !== lessonId),
      };
    }));
  };

  const validateCurriculum = () => {
    if (!modules.length) {
      throw new Error('Add at least one module to the course');
    }

    for (const module of modules) {
      if (!module.title.trim()) {
        throw new Error('Every module needs a title');
      }

      if (!module.lessons.length) {
        throw new Error(`"${module.title}" must contain at least one lesson`);
      }

      for (const lesson of module.lessons) {
        if (!lesson.title.trim()) {
          throw new Error(`Every lesson in "${module.title}" needs a title`);
        }
        if (!lesson.youtube_id.trim()) {
          throw new Error(`"${lesson.title}" needs a YouTube video ID`);
        }
      }
    }
  };

  const persistCurriculum = async (targetCourseId) => {
    validateCurriculum();

    const uniqueLessonDeletes = [...new Set(deletedLessonIds)];
    const uniqueModuleDeletes = [...new Set(deletedModuleIds)];

    for (const lessonId of uniqueLessonDeletes) {
      await deleteLesson(lessonId);
    }

    for (const moduleId of uniqueModuleDeletes) {
      await deleteModule(moduleId);
    }

    const freshModules = [];

    for (let moduleIndex = 0; moduleIndex < sortedModules.length; moduleIndex += 1) {
      const module = sortedModules[moduleIndex];
      const modulePayload = {
        title: module.title.trim(),
        order: Number(module.order) || moduleIndex,
      };

      let persistedModuleId = module.id;

      if (String(module.id).startsWith('new-module')) {
        const createdModule = await createModule(targetCourseId, modulePayload);
        persistedModuleId = createdModule.id;
      } else {
        await updateModule(module.id, modulePayload);
      }

      const sortedLessons = [...module.lessons].sort(sortByOrder);
      const freshLessons = [];

      for (let lessonIndex = 0; lessonIndex < sortedLessons.length; lessonIndex += 1) {
        const lesson = sortedLessons[lessonIndex];
        const lessonPayload = {
          title: lesson.title.trim(),
          youtube_id: lesson.youtube_id.trim(),
          thumbnail_url: lesson.thumbnail_url.trim(),
          duration_sec: Number(lesson.duration_sec) || 0,
          description: lesson.description.trim(),
          order: Number(lesson.order) || lessonIndex,
          module_id: persistedModuleId,
          course_id: targetCourseId,
        };

        let persistedLesson;
        if (String(lesson.id).startsWith('new-lesson')) {
          persistedLesson = await createLesson(targetCourseId, persistedModuleId, lessonPayload);
        } else {
          persistedLesson = await updateLesson(lesson.id, lessonPayload);
        }

        freshLessons.push(normalizeLesson(persistedLesson, lessonIndex));
      }

      freshModules.push({
        id: persistedModuleId,
        title: modulePayload.title,
        order: modulePayload.order,
        lessons: freshLessons,
      });
    }

    setModules(freshModules.sort(sortByOrder));
    setDeletedLessonIds([]);
    setDeletedModuleIds([]);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Course title is required');
      return;
    }
    if (!isEdit && !playlist) {
      toast.error('Please import a YouTube playlist first');
      return;
    }

    setSaving(true);
    try {
      let thumbnailUrl = form.thumbnail_url.trim();

      if (isEdit && thumbFile) {
        thumbnailUrl = await uploadThumbnail(thumbFile, courseId);
      }

      if (isEdit) {
        await persistCurriculum(courseId);
        await updateCourse(courseId, {
          ...form,
          title: form.title.trim(),
          description: form.description.trim(),
          playlist_id: form.playlist_id.trim() || null,
          thumbnail_url: thumbnailUrl,
          price: Number(form.price) || 0,
        });
        if (thumbFile) {
          setThumbFile(null);
          setThumbPreview('');
        }
        await loadCourse();
        toast.success('Course controls updated successfully');
      } else {
        if (!playlist?.videos?.length) {
          toast.error('Playlist has no videos');
          return;
        }

        const course = await importPlaylistAsCourse({
          title: form.title.trim(),
          description: form.description.trim(),
          thumbnail_url: thumbnailUrl || playlist.thumbnail || '',
          playlist_id: playlist.playlistId,
          instructor_id: user.id,
          category: form.category,
          level: form.level,
          language: form.language,
          is_free: form.is_free,
          price: Number(form.price) || 0,
          is_published: form.is_published,
          videos: playlist.videos,
        });

        if (thumbFile) {
          const uploadedUrl = await uploadThumbnail(thumbFile, course.id);
          await updateCourse(course.id, { thumbnail_url: uploadedUrl });
        }

        toast.success('Course created successfully! 🎉');
        navigate(`/admin/courses/${course.id}/edit`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream">
            {isEdit ? 'Edit Course Controls' : 'Create New Course'}
          </h1>
          <p className="text-slate-muted text-sm mt-1">
            {isEdit
              ? 'Manage the course thumbnail, description, pricing, publishing, modules, and lessons from one place.'
              : 'Import a YouTube playlist and configure course settings.'}
          </p>
        </div>

        {isEdit && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="p-4">
              <p className="text-xs text-slate-muted uppercase tracking-wider">Modules</p>
              <p className="font-display text-2xl text-cream mt-1">{sortedModules.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-muted uppercase tracking-wider">Lessons</p>
              <p className="font-display text-2xl text-cream mt-1">{totalLessons}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-muted uppercase tracking-wider">Status</p>
              <p className={`font-display text-xl mt-1 ${form.is_published ? 'text-green-light' : 'text-gold'}`}>
                {form.is_published ? 'Published' : 'Draft'}
              </p>
            </Card>
          </div>
        )}
      </div>

      {!isEdit && (
        <Card>
          <h2 className="font-display text-base font-semibold text-cream mb-4">
            Step 1 — Import YouTube Playlist
          </h2>
          <PlaylistImporter onImported={handlePlaylistImported} />
          {playlist && (
            <div className="mt-3 flex items-center gap-2 text-green-light text-sm">
              <span>✅</span>
              <span>Playlist ready: <strong>{playlist.videos.length}</strong> videos loaded</span>
            </div>
          )}
        </Card>
      )}

      <Card>
        <h2 className="font-display text-base font-semibold text-cream mb-5">
          {isEdit ? 'Course Settings' : 'Step 2 — Course Details'}
        </h2>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
          <div className="space-y-5">
            <Input
              label="Course Title *"
              placeholder="e.g. Introduction to Aqeedah"
              value={form.title}
              onChange={setField('title')}
            />

            <Textarea
              label="Description"
              placeholder="Describe what students will learn in this course…"
              value={form.description}
              onChange={setField('description')}
              rows={5}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Category"
                value={form.category}
                onChange={setField('category')}
                options={CATS.map((category) => ({ value: category, label: category }))}
              />
              <Select
                label="Level"
                value={form.level}
                onChange={setField('level')}
                options={LEVELS.map((level) => ({
                  value: level,
                  label: level.charAt(0).toUpperCase() + level.slice(1),
                }))}
              />
              <Select
                label="Language"
                value={form.language}
                onChange={setField('language')}
                options={LANGS.map((language) => ({ value: language, label: language }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Playlist ID"
                placeholder="PL..."
                value={form.playlist_id}
                onChange={setField('playlist_id')}
              />
              <Input
                label="Course Thumbnail URL"
                placeholder="https://..."
                value={form.thumbnail_url}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, thumbnail_url: event.target.value }));
                  if (thumbFile && thumbPreview?.startsWith('blob:')) {
                    URL.revokeObjectURL(thumbPreview);
                    setThumbFile(null);
                    setThumbPreview('');
                  }
                }}
              />
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_free}
                  onChange={setField('is_free')}
                  className="w-4 h-4 accent-green"
                />
                <span className="text-sm text-cream-muted">Free Course</span>
              </label>
              {!form.is_free && (
                <Input
                  type="number"
                  placeholder="Price (USD)"
                  className="w-36"
                  value={form.price}
                  onChange={setField('price')}
                />
              )}
            </div>

            <label
              className="flex items-center gap-3 cursor-pointer p-4 rounded-xl
                border border-navy-border hover:border-gold/30 transition-all"
            >
              <div className={`relative w-10 h-5 rounded-full transition-colors ${form.is_published ? 'bg-green' : 'bg-navy-border'}`}>
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-cream transition-transform
                    ${form.is_published ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-cream flex items-center gap-2">
                  {form.is_published
                    ? <><Globe size={14} className="text-green-light" /> Published</>
                    : <><Lock size={14} className="text-slate-muted" /> Draft</>}
                </p>
                <p className="text-xs text-slate-muted">
                  {form.is_published ? 'Visible to students' : 'Not visible to students'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={setField('is_published')}
                className="sr-only"
              />
            </label>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-cream-muted">Course Thumbnail</label>
            {previewThumbnail ? (
              <img
                src={previewThumbnail}
                alt="Course thumbnail preview"
                className="w-full aspect-[16/10] object-cover rounded-2xl border border-navy-border bg-navy-dark"
              />
            ) : (
              <div className="w-full aspect-[16/10] rounded-2xl border border-dashed border-navy-border bg-navy-dark/50 flex items-center justify-center text-sm text-slate-muted">
                No thumbnail selected
              </div>
            )}

            <label
              className="cursor-pointer flex items-center justify-center gap-2 border border-dashed
                border-navy-border hover:border-gold/40 rounded-xl px-4 py-3 text-sm
                text-slate-muted hover:text-cream transition-all"
            >
              <Upload size={16} /> Upload New Image
              <input type="file" accept="image/*" className="sr-only" onChange={handleThumbChange} />
            </label>

            <p className="text-xs text-slate-muted leading-relaxed">
              Admins can now manage the course cover using either a direct image URL or an uploaded file.
            </p>
          </div>
        </div>
      </Card>

      {isEdit && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <h2 className="font-display text-base font-semibold text-cream">Curriculum Controls</h2>
              <p className="text-xs text-slate-muted mt-1">
                Edit module names, lesson titles, descriptions, YouTube IDs, thumbnail URLs, durations, and order.
              </p>
            </div>
            <Button onClick={addModuleBlock} variant="ghost">
              <Plus size={15} /> Add Module
            </Button>
          </div>

          {loadingEditData ? (
            <div className="text-sm text-slate-muted">Loading curriculum…</div>
          ) : (
            <div className="space-y-6">
              {sortedModules.map((module, moduleIndex) => (
                <div key={module.id} className="rounded-2xl border border-navy-border bg-navy-dark/40 p-5 space-y-5">
                  <div className="flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between">
                    <div className="grid grid-cols-1 sm:grid-cols-[120px_minmax(0,1fr)] gap-4 flex-1">
                      <Input
                        label="Module Order"
                        type="number"
                        min="0"
                        value={module.order}
                        onChange={(event) => updateModuleField(module.id, 'order', event.target.value)}
                      />
                      <Input
                        label="Module Title"
                        value={module.title}
                        onChange={(event) => updateModuleField(module.id, 'title', event.target.value)}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => addLessonToModule(module.id)} variant="ghost" size="sm">
                        <Plus size={14} /> Add Lesson
                      </Button>
                      <Button onClick={() => removeModuleBlock(module.id)} variant="danger" size="sm">
                        <Trash2 size={14} /> Remove Module
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[...module.lessons].sort(sortByOrder).map((lesson) => (
                      <div key={lesson.id} className="rounded-2xl border border-navy-border/70 bg-navy-dark p-4 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-cream">
                            {lesson.title || 'New Lesson'}
                          </p>
                          <Button onClick={() => removeLessonFromModule(module.id, lesson.id)} variant="danger" size="sm">
                            <Trash2 size={14} /> Remove
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Input
                            label="Lesson Order"
                            type="number"
                            min="0"
                            value={lesson.order}
                            onChange={(event) => updateLessonField(module.id, lesson.id, 'order', event.target.value)}
                          />
                          <Input
                            label="Duration (Seconds)"
                            type="number"
                            min="0"
                            value={lesson.duration_sec}
                            onChange={(event) => updateLessonField(module.id, lesson.id, 'duration_sec', event.target.value)}
                          />
                          <Input
                            label="YouTube ID"
                            placeholder="e.g. dQw4w9WgXcQ"
                            value={lesson.youtube_id}
                            onChange={(event) => updateLessonField(module.id, lesson.id, 'youtube_id', event.target.value)}
                          />
                        </div>

                        <Input
                          label="Lesson Title"
                          placeholder="Lesson title"
                          value={lesson.title}
                          onChange={(event) => updateLessonField(module.id, lesson.id, 'title', event.target.value)}
                        />

                        <Input
                          label="Lesson Thumbnail URL"
                          placeholder="https://..."
                          value={lesson.thumbnail_url}
                          onChange={(event) => updateLessonField(module.id, lesson.id, 'thumbnail_url', event.target.value)}
                        />

                        <Textarea
                          label="Lesson Description"
                          rows={3}
                          placeholder="Describe the lesson content..."
                          value={lesson.description}
                          onChange={(event) => updateLessonField(module.id, lesson.id, 'description', event.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate('/admin/courses')} variant="ghost">
          Back to Courses
        </Button>
        <Button onClick={handleSave} loading={saving} variant="gold" className="flex-1 sm:flex-none">
          <Save size={16} />
          {saving ? 'Saving…' : isEdit ? 'Save Course Controls' : 'Create Course'}
        </Button>
      </div>
    </div>
  );
}

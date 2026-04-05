import { supabase } from '../lib/supabase';

/* ─────────────────────────────────────────────
   COURSES
───────────────────────────────────────────── */
export async function fetchPublishedCourses({ search = '', category = '', level = '' } = {}) {
  let q = supabase
    .from('courses')
    .select(`
      *,
      instructor:profiles(name, avatar_url),
      modules(id, title, order,
        lessons(id, title, youtube_id, order, thumbnail_url)
      )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (search)   q = q.ilike('title', `%${search}%`);
  if (category) q = q.eq('category', category);
  if (level)    q = q.eq('level', level);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function fetchAllCoursesAdmin() {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      instructor:profiles(name),
      enrollments(count)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchCourseById(courseId) {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      instructor:profiles(name, avatar_url, bio),
      modules!inner(
        id, title, "order",
        lessons(id, title, youtube_id, thumbnail_url, duration_sec, "order", description)
      )
    `)
    .eq('id', courseId)
    .single();

  if (error) throw error;

  // Sort modules and lessons
  if (data?.modules) {
    data.modules.sort((a, b) => a.order - b.order);
    data.modules.forEach(m => m.lessons?.sort((a, b) => a.order - b.order));
  }
  return data;
}

export async function createCourse(courseData) {
  const { data, error } = await supabase
    .from('courses')
    .insert(courseData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCourse(courseId, updates) {
  const { data, error } = await supabase
    .from('courses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', courseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCourse(courseId) {
  const { error } = await supabase.from('courses').delete().eq('id', courseId);
  if (error) throw error;
}

/* ─────────────────────────────────────────────
   MODULES + LESSONS (bulk create from playlist)
───────────────────────────────────────────── */
export async function createModuleWithLessons(courseId, moduleTitle, lessons) {
  // Create module
  const { data: mod, error: modErr } = await supabase
    .from('modules')
    .insert({ course_id: courseId, title: moduleTitle, order: 0 })
    .select()
    .single();

  if (modErr) throw modErr;

  // Create all lessons
  const lessonRows = lessons.map((l, i) => ({
    module_id:     mod.id,
    course_id:     courseId,
    title:         l.title,
    youtube_id:    l.videoId,
    thumbnail_url: l.thumbnail,
    duration_sec:  Number(l.durationSec || l.duration_sec || 0),
    description:   l.description || '',
    order:         Number.isFinite(l.position) ? l.position : i,
  }));

  const { data: createdLessons, error: lessErr } = await supabase
    .from('lessons')
    .insert(lessonRows)
    .select();

  if (lessErr) throw lessErr;
  return { module: mod, lessons: createdLessons };
}

export async function createModule(courseId, moduleData = {}) {
  const payload = {
    course_id: courseId,
    title: moduleData.title || 'New Module',
    order: Number(moduleData.order) || 0,
  };

  const { data, error } = await supabase
    .from('modules')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function importPlaylistAsCourse({ title, description, thumbnail_url,
  playlist_id, instructor_id, category, level, language, is_free, price,
  is_published, videos }) {

  // 1. Create course
  const course = await createCourse({
    title, description, thumbnail_url, playlist_id,
    instructor_id,
    category,
    level,
    language: language || 'English',
    is_free: is_free ?? true,
    price: Number(price) || 0,
    is_published: Boolean(is_published),
  });

  // 2. Create one default module with all videos
  await createModuleWithLessons(course.id, 'Course Content', videos);

  return course;
}

export async function updateModule(moduleId, updates) {
  const { data, error } = await supabase
    .from('modules').update(updates).eq('id', moduleId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteModule(moduleId) {
  const { error } = await supabase.from('modules').delete().eq('id', moduleId);
  if (error) throw error;
}

export async function createLesson(courseId, moduleId, lessonData = {}) {
  const payload = {
    course_id: courseId,
    module_id: moduleId,
    title: lessonData.title || 'New Lesson',
    youtube_id: lessonData.youtube_id || '',
    thumbnail_url: lessonData.thumbnail_url || '',
    duration_sec: Number(lessonData.duration_sec) || 0,
    description: lessonData.description || '',
    order: Number(lessonData.order) || 0,
  };

  const { data, error } = await supabase
    .from('lessons')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLesson(lessonId, updates) {
  const { data, error } = await supabase
    .from('lessons').update(updates).eq('id', lessonId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteLesson(lessonId) {
  const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
  if (error) throw error;
}

/* ─────────────────────────────────────────────
   ENROLLMENTS
───────────────────────────────────────────── */
export async function enrollInCourse(userId, courseId) {
  const { data, error } = await supabase
    .from('enrollments')
    .upsert({ user_id: userId, course_id: courseId, status: 'active' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function checkEnrollment(userId, courseId) {
  const { data } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  return data;
}

export async function fetchUserEnrollments(userId) {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(id, title, thumbnail_url, total_lessons, level, category)
    `)
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchAllEnrollments() {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      user:profiles(name, email),
      course:courses(title)
    `)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/* ─────────────────────────────────────────────
   STORAGE — upload thumbnail
───────────────────────────────────────────── */
export async function uploadThumbnail(file, courseId) {
  const ext  = file.name.split('.').pop();
  const path = `${courseId}/thumbnail.${ext}`;

  const { error } = await supabase.storage
    .from('thumbnails')
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('thumbnails').getPublicUrl(path);
  return data.publicUrl;
}

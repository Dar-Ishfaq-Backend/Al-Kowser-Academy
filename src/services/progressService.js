import { supabase } from '../lib/supabase';

const LESSON_WATCH_THRESHOLD = 0.75;
const CERTIFICATE_WATCH_THRESHOLD_PERCENT = 75;

/* ─────────────────────────────────────────────
   PROGRESS
───────────────────────────────────────────── */
export async function fetchCourseProgress(userId, courseId) {
  const { data, error } = await supabase
    .from('progress')
    .select('lesson_id, completed, watched_secs, completed_at')
    .eq('user_id', userId)
    .eq('course_id', courseId);

  if (error) throw error;
  return data || [];
}

export async function markLessonComplete(userId, courseId, lessonId) {
  return setLessonCompletion(userId, courseId, lessonId, true);
}

export async function setLessonCompletion(userId, courseId, lessonId, completed) {
  const { data, error } = await supabase
    .from('progress')
    .upsert({
      user_id:      userId,
      course_id:    courseId,
      lesson_id:    lessonId,
      completed:    Boolean(completed),
      completed_at: completed ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,lesson_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveWatchedTime(userId, courseId, lessonId, watchedSecs) {
  const safeWatchedSecs = Math.max(0, Math.floor(watchedSecs || 0));
  const { error } = await supabase
    .from('progress')
    .upsert({
      user_id:      userId,
      course_id:    courseId,
      lesson_id:    lessonId,
      watched_secs: safeWatchedSecs,
    }, { onConflict: 'user_id,lesson_id' });

  if (error) console.error('Save watch time error:', error);
}

export function computeProgress(progressRows, totalLessons) {
  if (!totalLessons) return 0;
  const completed = progressRows.filter(r => r.completed).length;
  return Math.round((completed / totalLessons) * 100);
}

export function upsertProgressRow(progressRows, updates) {
  const rows = Array.isArray(progressRows) ? progressRows : [];
  const index = rows.findIndex((row) => row.lesson_id === updates.lesson_id);

  if (index === -1) {
    return [...rows, {
      completed: false,
      watched_secs: 0,
      completed_at: null,
      ...updates,
    }];
  }

  const current = rows[index];
  const next = {
    ...current,
    ...updates,
    watched_secs: Math.max(current.watched_secs || 0, updates.watched_secs ?? 0),
  };

  if (Object.prototype.hasOwnProperty.call(updates, 'completed') && !updates.completed) {
    next.completed_at = null;
  }

  return rows.map((row, rowIndex) => (rowIndex === index ? next : row));
}

export function getLastWatchedLesson(progressRows, lessons) {
  if (!progressRows?.length || !lessons?.length) return null;
  const completedIds = new Set(progressRows.filter(r => r.completed).map(r => r.lesson_id));
  // Return first lesson not yet completed
  const next = lessons.find(l => !completedIds.has(l.id));
  return next || lessons[lessons.length - 1];
}

/* ─────────────────────────────────────────────
   CERTIFICATES
───────────────────────────────────────────── */
export async function checkCertificate(userId, courseId) {
  const { data } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  return data;
}

export async function issueCertificate(userId, courseId) {
  // Check if already issued
  const existing = await checkCertificate(userId, courseId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('certificates')
    .insert({ user_id: userId, course_id: courseId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchUserCertificates(userId) {
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      course:courses(title, category, level, thumbnail_url)
    `)
    .eq('user_id', userId)
    .order('issued_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/* ─────────────────────────────────────────────
   LESSON NOTES
───────────────────────────────────────────── */
export async function fetchNote(userId, lessonId) {
  const { data } = await supabase
    .from('lesson_notes')
    .select('content')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  return data?.content || '';
}

export async function saveNote(userId, lessonId, content) {
  const { error } = await supabase
    .from('lesson_notes')
    .upsert({ user_id: userId, lesson_id: lessonId, content },
             { onConflict: 'user_id,lesson_id' });

  if (error) throw error;
}

/* ─────────────────────────────────────────────
   BOOKMARKS
───────────────────────────────────────────── */
export async function fetchBookmarks(userId) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      lesson_id,
      lesson:lessons(id, title, youtube_id, thumbnail_url,
        course:courses(id, title))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function toggleBookmark(userId, lessonId) {
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (existing) {
    await supabase.from('bookmarks').delete().eq('id', existing.id);
    return false;
  } else {
    await supabase.from('bookmarks').insert({ user_id: userId, lesson_id: lessonId });
    return true;
  }
}

/* ─────────────────────────────────────────────
   ADMIN ANALYTICS
───────────────────────────────────────────── */
export async function fetchAdminStats() {
  const [
    { count: totalUsers },
    { count: totalCourses },
    { count: totalEnrollments },
    { count: totalCertificates },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('certificates').select('*', { count: 'exact', head: true }),
  ]);

  return { totalUsers, totalCourses, totalEnrollments, totalCertificates };
}

export function computeWatchMetrics(progressRows, lessons, observedDurations = {}) {
  const totalLessons = lessons?.length || 0;
  const rowMap = new Map((progressRows || []).map((row) => [row.lesson_id, row]));

  let watchedEnoughLessons = 0;
  let knownDurationLessons = 0;
  let watchedDuration = 0;
  let totalDuration = 0;

  for (const lesson of lessons || []) {
    const row = rowMap.get(lesson.id);
    const watchedSecs = Math.max(0, Number(row?.watched_secs || 0));
    const durationSec = Math.max(
      0,
      Number(observedDurations?.[lesson.id] || 0),
      Number(lesson.duration_sec || 0),
    );

    if (durationSec > 0) {
      knownDurationLessons += 1;
      totalDuration += durationSec;
      watchedDuration += Math.min(watchedSecs, durationSec);

      if ((watchedSecs / durationSec) >= LESSON_WATCH_THRESHOLD) {
        watchedEnoughLessons += 1;
      }
    } else if (watchedSecs > 0) {
      watchedDuration += watchedSecs;
    }
  }

  const watchEligiblePercent = totalLessons
    ? Math.round((watchedEnoughLessons / totalLessons) * 100)
    : 0;
  const weightedWatchPercent = totalDuration
    ? Math.round((watchedDuration / totalDuration) * 100)
    : 0;

  return {
    totalLessons,
    knownDurationLessons,
    watchedEnoughLessons,
    missingDurationLessons: Math.max(0, totalLessons - knownDurationLessons),
    watchEligiblePercent,
    weightedWatchPercent,
    lessonWatchThresholdPercent: Math.round(LESSON_WATCH_THRESHOLD * 100),
    certificateWatchThresholdPercent: CERTIFICATE_WATCH_THRESHOLD_PERCENT,
    certificateWatchMet: watchEligiblePercent >= CERTIFICATE_WATCH_THRESHOLD_PERCENT,
  };
}

export function computeCertificateEligibility(progressRows, lessons, observedDurations = {}) {
  const completionPercent = computeProgress(progressRows, lessons?.length || 0);
  const watchMetrics = computeWatchMetrics(progressRows, lessons, observedDurations);

  return {
    ...watchMetrics,
    completionPercent,
    isCourseComplete: completionPercent === 100,
    canIssueCertificate: completionPercent === 100 && watchMetrics.certificateWatchMet,
  };
}

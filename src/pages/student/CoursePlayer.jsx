import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  List,
  ShieldCheck,
  StickyNote,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { fetchCourseById, checkEnrollment } from '../../services/courseService';
import {
  fetchCourseProgress,
  setLessonCompletion,
  getLastWatchedLesson,
  issueCertificate,
  fetchNote,
  saveNote,
  toggleBookmark,
  fetchBookmarks,
  saveWatchedTime,
  upsertProgressRow,
  computeCertificateEligibility,
} from '../../services/progressService';
import { generateCertificatePng, downloadCertificate } from '../../services/certificateService';
import VideoPlayer from '../../components/course/VideoPlayer';
import LessonItem from '../../components/course/LessonItem';
import { ProgressBar, LoadingSpinner, Button } from '../../components/ui/index.jsx';

const WATCH_STORAGE_PREFIX = 'al-kawser-watch-durations';

function getDurationStorageKey(courseId) {
  return `${WATCH_STORAGE_PREFIX}:${courseId}`;
}

function loadStoredDurations(courseId) {
  if (typeof window === 'undefined' || !courseId) return {};

  try {
    const raw = window.localStorage.getItem(getDurationStorageKey(courseId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistDuration(courseId, lessonId, durationSec) {
  if (typeof window === 'undefined' || !courseId || !lessonId || !durationSec) return;

  const next = {
    ...loadStoredDurations(courseId),
    [lessonId]: durationSec,
  };

  window.localStorage.setItem(getDurationStorageKey(courseId), JSON.stringify(next));
}

export default function CoursePlayer() {
  const { id: courseId } = useParams();
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [progressRows, setProgressRows] = useState([]);
  const [bookmarkedIds, setBookmarks] = useState(new Set());
  const [note, setNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [genCert, setGenCert] = useState(false);
  const [observedDurations, setObservedDurations] = useState({});

  const lastSavedWatchRef = useRef({});
  const certificateIssuedRef = useRef(false);

  useEffect(() => {
    setObservedDurations(loadStoredDurations(courseId));
    certificateIssuedRef.current = false;
    lastSavedWatchRef.current = {};
  }, [courseId]);

  useEffect(() => {
    if (user) init();
  }, [user, courseId]);

  const init = async () => {
    setLoading(true);

    try {
      const [fetchedCourse, enrollment] = await Promise.all([
        fetchCourseById(courseId),
        checkEnrollment(user.id, courseId),
      ]);

      if (!enrollment) {
        toast.error('You are not enrolled in this course');
        navigate('/courses');
        return;
      }

      const allLessons = (fetchedCourse.modules || [])
        .sort((a, b) => a.order - b.order)
        .flatMap((module) => (module.lessons || []).sort((a, b) => a.order - b.order));

      setCourse(fetchedCourse);
      setLessons(allLessons);

      const [rows, bookmarks] = await Promise.all([
        fetchCourseProgress(user.id, courseId),
        fetchBookmarks(user.id),
      ]);

      setProgressRows(rows);
      setBookmarks(new Set(bookmarks.map((bookmark) => bookmark.lesson_id)));

      const resumeLesson = getLastWatchedLesson(rows, allLessons) || allLessons[0];
      if (resumeLesson) {
        setCurrentLesson(resumeLesson);
        await loadNote(resumeLesson.id);
      }
    } catch (err) {
      toast.error('Failed to load course');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadNote = async (lessonId) => {
    const content = await fetchNote(user.id, lessonId);
    setNote(content);
    setNoteSaved(false);
  };

  const handleSelectLesson = async (lesson) => {
    setCurrentLesson(lesson);
    await loadNote(lesson.id);
  };

  const handleVideoProgress = ({ currentTime, duration, ended }) => {
    if (!user || !currentLesson) return;

    const roundedDuration = Math.max(0, Math.round(duration || 0));
    const nextWatchedSeconds = Math.max(
      0,
      Math.round(ended && duration ? duration : currentTime || 0),
    );

    if (roundedDuration > 0) {
      setObservedDurations((prev) => {
        const existing = prev[currentLesson.id] || 0;
        if (roundedDuration <= existing) return prev;

        const next = { ...prev, [currentLesson.id]: roundedDuration };
        persistDuration(courseId, currentLesson.id, roundedDuration);
        return next;
      });
    }

    setProgressRows((prev) => {
      const existing = prev.find((row) => row.lesson_id === currentLesson.id);
      const watchedSecs = Math.max(existing?.watched_secs || 0, nextWatchedSeconds);

      if (existing && watchedSecs === (existing.watched_secs || 0)) {
        return prev;
      }

      return upsertProgressRow(prev, {
        user_id: user.id,
        course_id: courseId,
        lesson_id: currentLesson.id,
        watched_secs: watchedSecs,
      });
    });

    const lastSaved = lastSavedWatchRef.current[currentLesson.id] || 0;
    if (nextWatchedSeconds >= lastSaved + 5 || ended) {
      lastSavedWatchRef.current[currentLesson.id] = nextWatchedSeconds;
      saveWatchedTime(user.id, courseId, currentLesson.id, nextWatchedSeconds);
    }
  };

  const handleToggleComplete = async (lesson = currentLesson) => {
    if (!lesson || !user) return;

    const isCompleted = progressRows.some(
      (row) => row.lesson_id === lesson.id && row.completed,
    );
    const nextCompleted = !isCompleted;

    try {
      await setLessonCompletion(user.id, courseId, lesson.id, nextCompleted);
      setProgressRows((prev) => upsertProgressRow(prev, {
        user_id: user.id,
        course_id: courseId,
        lesson_id: lesson.id,
        completed: nextCompleted,
        completed_at: nextCompleted ? new Date().toISOString() : null,
      }));

      toast.success(nextCompleted ? 'Lesson marked as complete ✅' : 'Lesson marked incomplete');

      if (nextCompleted && lesson.id === currentLesson?.id) {
        goNext();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update lesson progress');
    }
  };

  useEffect(() => {
    const eligibility = computeCertificateEligibility(progressRows, lessons, observedDurations);

    if (!user || !courseId || !eligibility.canIssueCertificate || certificateIssuedRef.current) {
      return;
    }

    certificateIssuedRef.current = true;
    issueCertificate(user.id, courseId)
      .then(() => {
        toast.success('Certificate unlocked! You can download it now.', { duration: 3500 });
      })
      .catch((err) => {
        console.error(err);
        certificateIssuedRef.current = false;
      });
  }, [courseId, lessons, observedDurations, progressRows, user]);

  const handleDownloadCert = async () => {
    if (!course || !profile || !user) return;

    const eligibility = computeCertificateEligibility(progressRows, lessons, observedDurations);
    if (!eligibility.canIssueCertificate) {
      toast.error('Complete all lessons and reach 75% watch time to unlock your certificate');
      return;
    }

    setGenCert(true);

    try {
      const cert = await issueCertificate(user.id, courseId);
      const png = await generateCertificatePng({
        studentName: profile.name,
        courseName: course.title,
        certificateId: cert.certificate_id,
        completionDate: cert.issued_at,
        category: course.category,
      });
      downloadCertificate(png, `AlKawser-${course.title.replace(/\s+/g, '_')}.png`);
      toast.success('Certificate downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate certificate');
    } finally {
      setGenCert(false);
    }
  };

  const handleSaveNote = async () => {
    if (!currentLesson) return;

    try {
      await saveNote(user.id, currentLesson.id, note);
      setNoteSaved(true);
      toast.success('Note saved');
    } catch {
      toast.error('Failed to save note');
    }
  };

  const handleToggleBookmark = async (lessonId) => {
    const added = await toggleBookmark(user.id, lessonId);
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (added) next.add(lessonId);
      else next.delete(lessonId);
      return next;
    });
    toast.success(added ? 'Bookmarked' : 'Bookmark removed');
  };

  const currentIndex = lessons.findIndex((lesson) => lesson.id === currentLesson?.id);
  const completedIds = new Set(progressRows.filter((row) => row.completed).map((row) => row.lesson_id));
  const certificateEligibility = useMemo(
    () => computeCertificateEligibility(progressRows, lessons, observedDurations),
    [progressRows, lessons, observedDurations],
  );

  const currentProgressRow = progressRows.find((row) => row.lesson_id === currentLesson?.id);
  const currentDuration = Math.max(
    Number(observedDurations[currentLesson?.id] || 0),
    Number(currentLesson?.duration_sec || 0),
  );
  const currentWatchPercent = currentDuration
    ? Math.min(100, Math.round(((currentProgressRow?.watched_secs || 0) / currentDuration) * 100))
    : 0;

  const goNext = async () => {
    if (currentIndex < lessons.length - 1) {
      const nextLesson = lessons[currentIndex + 1];
      setCurrentLesson(nextLesson);
      await loadNote(nextLesson.id);
    }
  };

  const goPrev = async () => {
    if (currentIndex > 0) {
      const previousLesson = lessons[currentIndex - 1];
      setCurrentLesson(previousLesson);
      await loadNote(previousLesson.id);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!course) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6 overflow-hidden">
      <aside
        className={`flex-shrink-0 bg-navy-dark border-r border-navy-border
          flex flex-col transition-all duration-300 overflow-hidden
          ${showSidebar ? 'w-72' : 'w-0'}`}
      >
        <div className="p-4 border-b border-navy-border space-y-3">
          <h2 className="font-display text-sm font-semibold text-cream line-clamp-2">
            {course.title}
          </h2>
          <ProgressBar value={certificateEligibility.completionPercent} label="Course completion" />
          <ProgressBar value={certificateEligibility.watchEligiblePercent} label="Watch-time for certificate" />
          <p className="text-xs text-slate-muted text-center">
            {completedIds.size} / {lessons.length} lessons complete
          </p>
          <p className="text-[11px] text-center text-slate-muted">
            {certificateEligibility.watchedEnoughLessons} / {lessons.length} lessons watched 75%+
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {(course.modules || []).map((module) => (
            <div key={module.id}>
              <div
                className="px-4 py-2 text-[10px] text-slate-muted uppercase tracking-wider
                  font-semibold sticky top-0 bg-navy-dark/95 backdrop-blur-sm border-b border-navy-border/30"
              >
                {module.title}
              </div>
              {(module.lessons || []).sort((a, b) => a.order - b.order).map((lesson, index) => {
                const row = progressRows.find((progressRow) => progressRow.lesson_id === lesson.id);
                const lessonDuration = Math.max(
                  Number(observedDurations[lesson.id] || 0),
                  Number(lesson.duration_sec || 0),
                );
                const watchPercent = lessonDuration
                  ? Math.min(100, Math.round(((row?.watched_secs || 0) / lessonDuration) * 100))
                  : 0;

                return (
                  <LessonItem
                    key={lesson.id}
                    lesson={lesson}
                    index={index}
                    isActive={lesson.id === currentLesson?.id}
                    isCompleted={completedIds.has(lesson.id)}
                    isBookmarked={bookmarkedIds.has(lesson.id)}
                    watchPercent={watchPercent}
                    watchReady={lessonDuration > 0}
                    onSelect={handleSelectLesson}
                    onBookmark={handleToggleBookmark}
                    onToggleComplete={handleToggleComplete}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-navy-border space-y-3">
          {certificateEligibility.canIssueCertificate ? (
            <Button
              onClick={handleDownloadCert}
              loading={genCert}
              variant="gold"
              className="w-full text-sm"
            >
              <Award size={16} /> Download Certificate
            </Button>
          ) : (
            <div className="rounded-2xl border border-gold/20 bg-gold/5 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={15} className="text-gold mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-cream">Certificate requirement</p>
                  <p className="text-[11px] leading-relaxed text-slate-muted">
                    Finish every lesson and watch at least 75% of the course videos up to 75% or more.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          className="flex items-center justify-between px-5 py-3
            border-b border-navy-border bg-navy-dark/60 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setShowSidebar((value) => !value)}
              className="text-slate-muted hover:text-cream transition-colors p-1 rounded-lg
                hover:bg-navy-border/50"
            >
              <List size={18} />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-slate-muted">
                Lesson {currentIndex + 1} of {lessons.length}
              </p>
              <div className="flex items-start gap-3">
                <p className="text-sm font-semibold text-cream line-clamp-1">
                  {currentLesson?.title}
                </p>
                <button
                  onClick={() => handleToggleComplete(currentLesson)}
                  className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-md border bg-white transition-all
                    ${completedIds.has(currentLesson?.id)
                      ? 'border-green-light text-green-light shadow-[0_0_0_1px_rgba(212,168,83,0.45)]'
                      : 'border-gold/70 text-white hover:border-green-light'
                    }`}
                  title={completedIds.has(currentLesson?.id) ? 'Mark lesson incomplete' : 'Mark lesson complete'}
                >
                  <Check size={13} className={completedIds.has(currentLesson?.id) ? 'opacity-100' : 'opacity-0'} />
                </button>
              </div>
              <p className="text-[11px] text-slate-muted mt-1">
                {currentDuration > 0
                  ? `Watched ${currentWatchPercent}% of this lesson`
                  : 'Play this lesson once to start tracking watch time'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotes((value) => !value)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all
                ${showNotes
                  ? 'bg-gold/20 text-gold border border-gold/30'
                  : 'text-slate-muted hover:text-cream border border-navy-border hover:border-gold/30'
                }`}
            >
              <StickyNote size={13} /> Notes
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <VideoPlayer
            videoId={currentLesson?.youtube_id}
            autoplay={false}
            onProgress={handleVideoProgress}
          />

          <div className="glass-card p-4 border-green/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green/20 to-gold/20 border border-gold/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={18} className="text-gold" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-cream">Certificate unlock rule</p>
                <p className="text-xs text-slate-muted leading-relaxed">
                  You can mark lessons complete with the white square, but your certificate unlocks only after every lesson is completed and at least 75% of the course videos are watched up to 75% or more.
                </p>
                <div className="flex flex-wrap gap-3 text-[11px]">
                  <span className="badge-green">
                    Completion {certificateEligibility.completionPercent}%
                  </span>
                  <span className={certificateEligibility.certificateWatchMet ? 'badge-green' : 'badge-gold'}>
                    Watch requirement {certificateEligibility.watchEligiblePercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {currentLesson?.description && (
            <div className="glass-card p-4">
              <h4 className="font-semibold text-sm text-cream mb-2">About this lesson</h4>
              <p className="text-xs text-slate-muted leading-relaxed">
                {currentLesson.description}
              </p>
            </div>
          )}

          {showNotes && (
            <div className="glass-card p-4 space-y-3 animate-slide-up border-gold/20">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-gold flex items-center gap-2">
                  <StickyNote size={14} /> My Notes
                </h4>
                <button onClick={() => setShowNotes(false)} className="text-slate-muted hover:text-cream">
                  <X size={14} />
                </button>
              </div>
              <textarea
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  setNoteSaved(false);
                }}
                placeholder="Write your notes for this lesson…"
                className="input-field min-h-[120px] resize-none text-sm"
                rows={5}
              />
              <Button onClick={handleSaveNote} size="sm" variant={noteSaved ? 'ghost' : 'primary'}>
                {noteSaved ? '✓ Saved' : 'Save Note'}
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 text-sm text-slate-muted hover:text-cream
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} /> Previous
            </button>

            {certificateEligibility.canIssueCertificate ? (
              <Button onClick={handleDownloadCert} loading={genCert} variant="gold" size="sm">
                <Award size={14} /> Certificate
              </Button>
            ) : (
              <button
                onClick={goNext}
                disabled={currentIndex === lessons.length - 1}
                className="flex items-center gap-2 text-sm text-cream hover:text-gold
                  disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

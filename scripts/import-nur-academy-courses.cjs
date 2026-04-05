const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');
const { pathToFileURL } = require('node:url');
const { createClient } = require('@supabase/supabase-js');

const rootDir = path.resolve(__dirname, '..');
const defaultNurRoot = path.resolve(rootDir, '..', 'Nur Academy');

const CATEGORY_MAP = {
  Quran: 'Quran',
  Arabic: 'Arabic',
  Seerah: 'Seerah',
  Aqidah: 'Aqeedah',
  Hadith: 'Hadith',
  Fiqh: 'Fiqh',
  Family: 'Other',
};

const LEVEL_MAP = {
  Beginner: 'beginner',
  Intermediate: 'intermediate',
  Advanced: 'advanced',
  'All Levels': 'beginner',
};

const CATALOG = [
  {
    key: 'tajweed-ul-qiraat-course',
    title: "Tajweed-ul-Qira'at Course",
    description: "A complete Tajweed ul Qira'at course covering all 20 currently public episodes from the Nur Academy playlist.",
    instructor: 'Hafiz Saeed Raza Baghdadi',
    category: 'Quran',
    level: 'Beginner',
    language: 'Urdu',
    groupSize: 5,
    source: { type: 'playlist-file', file: 'tajweedQiraatPlaylist.js' },
  },
  {
    key: 'tajweed-course',
    title: 'Tajweed Course',
    description: 'A complete Urdu Tajweed video series covering terminology, noon sakinah and tanween, meem sakin, idgham families, hamza rules, and advanced Quran-reading cases.',
    instructor: 'Qari Aqib',
    category: 'Quran',
    level: 'Intermediate',
    language: 'Urdu',
    groupSize: 6,
    source: { type: 'playlist-file', file: 'tajweedCoursePlaylist.js' },
  },
  {
    key: 'lisan-ul-quran',
    title: 'Lisan ul Quran',
    description: 'A full Lisan ul Quran series covering Quranic Arabic grammar, noun patterns, nominal and verbal sentences, jussive and passive forms, and advanced applied structures.',
    instructor: 'Amir Sohail',
    category: 'Arabic',
    level: 'Intermediate',
    language: 'Urdu',
    groupSize: 10,
    source: { type: 'playlist-file', file: 'lisanulQuranPlaylist.js' },
  },
  {
    key: 'arbi-ka-muallim-book-1-to-4',
    title: 'Arbi ka Muallim Book 1 to 4',
    description: 'A long Arabic-learning pathway covering Arbi ka Muallim Books 1 to 4 through the Nur Academy playlist lessons.',
    instructor: 'Amir Sohail',
    category: 'Arabic',
    level: 'Beginner',
    language: 'Urdu',
    groupSize: 15,
    source: { type: 'playlist-file', file: 'arbiKaMuallimPlaylist.js' },
  },
  {
    key: 'aasan-arabic-grammar',
    title: 'Aasan Arabic Grammar',
    description: 'A full Arabic grammar course covering nouns, compounds, jumla ismiyyah, pronouns, verbs, and applied Quranic parsing across the full Nur Academy playlist.',
    instructor: 'Asif Hameed',
    category: 'Arabic',
    level: 'Intermediate',
    language: 'Urdu',
    groupSize: 10,
    source: { type: 'playlist-file', file: 'aasanArabicGrammarPlaylist.js' },
  },
  {
    key: 'ilm-us-sarf',
    title: 'Ilm us Sarf',
    description: 'A structured Arabic morphology course covering the foundations of Ilm us Sarf through the full public playlist lessons.',
    instructor: 'Mufti Muhammad',
    category: 'Arabic',
    level: 'Beginner',
    language: 'Urdu',
    groupSize: 11,
    source: { type: 'playlist-file', file: 'ilmUsSarfPlaylist.js' },
  },
  {
    key: 'ilm-un-nahw',
    title: 'Ilm un Nahw',
    description: 'A beginner-friendly Arabic syntax course covering core Nahw topics through the linked playlist lessons.',
    instructor: 'Mufti Muhammad',
    category: 'Arabic',
    level: 'Beginner',
    language: 'Urdu',
    groupSize: 10,
    source: { type: 'playlist-file', file: 'ilmUnNahwPlaylist.js' },
  },
  {
    key: 'mualim-ul-quran',
    title: 'Mualim ul Quran',
    description: 'A structured Muallim ul Quran challenge focused on understanding Quran directly in six months through guided lessons, homework checkpoints, revision sessions, and test-based practice.',
    instructor: 'Hamza Sabherwal & Dr. Ubaid',
    category: 'Quran',
    level: 'Beginner',
    language: 'English',
    groupSize: 7,
    source: { type: 'playlist-file', file: 'mualimUlQuranPlaylist.js' },
  },
  {
    key: 'short-seerah-course',
    title: 'Short Seerah Course',
    description: 'A shorter English Seerah journey through the life of Prophet Muhammad, organized from a compact playlist for learners who want a faster overview.',
    instructor: 'Dr. Yasir Qadhi',
    category: 'Seerah',
    level: 'Beginner',
    language: 'English',
    groupSize: 8,
    source: { type: 'playlist-file', file: 'shortSeerahPlaylist.js' },
  },
  {
    key: 'prophetic-saw-life',
    title: 'Prophetic (SAW) Life',
    description: 'A detailed Prophetic Life in Focus series tracing the blessed life of the Messenger from Arabia before Islam through the major stages of his mission.',
    instructor: 'Shaykh Abdul-Rahim Reasat',
    category: 'Seerah',
    level: 'Intermediate',
    language: 'English',
    groupSize: 10,
    source: { type: 'playlist-file', file: 'propheticLifePlaylist.js' },
  },
  {
    key: 'prophetic-parenting',
    title: 'Prophetic Parenting',
    description: 'A concise Prophetic Parenting series on raising righteous Muslim children through forty hadith-based reflections and a closing Q&A.',
    instructor: 'Shaykh Faraz Rabbani',
    category: 'Family',
    level: 'All Levels',
    language: 'English',
    groupSize: 10,
    source: { type: 'playlist-file', file: 'propheticParentingPlaylist.js' },
  },
  {
    key: 'noorani-qaida',
    title: 'Noorani Qaida',
    description: 'The full Noorani Qaida route imported from the main Nur Academy playlist.',
    instructor: 'Nur Academy Qaida Faculty',
    category: 'Quran',
    level: 'Beginner',
    language: 'Urdu',
    groupSize: 12,
    source: { type: 'playlist-file', file: 'nooraniQaidaAPlaylist.js' },
  },
  {
    key: 'noorani-basics',
    title: 'Noorani Basics',
    description: 'A shorter Noorani Qaida route imported from the alternate Nur Academy playlist.',
    instructor: 'Nur Academy Qaida Faculty',
    category: 'Quran',
    level: 'Beginner',
    language: 'Urdu',
    groupSize: 12,
    source: { type: 'playlist-file', file: 'nooraniQaidaBPlaylist.js' },
  },
  {
    key: 'madani-qaida-journey',
    title: 'Madani Qaida Journey',
    description: 'A longer Madani Qaida route with the full Nur Academy lesson sequence.',
    instructor: 'Nur Academy Qaida Faculty',
    category: 'Quran',
    level: 'Beginner',
    language: 'Urdu',
    groupSize: 10,
    source: { type: 'playlist-file', file: 'qaidaTrackTwoPlaylist.js' },
  },
  {
    key: 'madani-qaida-classic',
    title: 'Madani Qaida Classic',
    description: 'The original Madani Qaida track imported from the Nur Academy playlist.',
    instructor: 'Nur Academy Qaida Faculty',
    category: 'Quran',
    level: 'Beginner',
    language: 'Urdu',
    groupSize: 10,
    source: { type: 'playlist-file', file: 'madaniQaidaPlaylist.js' },
  },
  {
    key: 'al-arabiyya-bayna-yadayk',
    title: 'Al Arabiyya Bayna Yadayk',
    description: 'A full Arabic-from-scratch pathway using the Al Arabiyya Bayna Yadayk lesson series from Nur Academy.',
    instructor: 'Nur Academy Arabic Faculty',
    category: 'Arabic',
    level: 'Beginner',
    language: 'English',
    groupSize: 8,
    source: { type: 'playlist-file', file: 'arabiyyaBaynaYadaykPlaylist.js' },
  },
  {
    key: 'al-ajooroomiyya-grammar',
    title: 'Al Ajooroomiyya Grammar',
    description: 'A structured Arabic grammar route built from the Al Ajooroomiyya lesson series in Nur Academy.',
    instructor: 'Nur Academy Arabic Faculty',
    category: 'Arabic',
    level: 'Beginner',
    language: 'English',
    groupSize: 8,
    source: { type: 'playlist-file', file: 'ajooroomiyyaPlaylist.js' },
  },
  {
    key: 'madinah-arabic-book-1-urdu',
    title: 'Madinah Arabic Book 1 (Urdu)',
    description: 'Begin the Madinah Arabic journey with Book 1 in Urdu, covering the opening lessons, vocabulary patterns, and foundational grammar.',
    instructor: 'Nur Academy Arabic Faculty',
    category: 'Arabic',
    level: 'Beginner',
    language: 'Urdu',
    groupSize: 8,
    source: { type: 'playlist-file', file: 'madinahArabicBook1UrduPlaylist.js' },
  },
  {
    key: 'madinah-arabic-book-2-urdu',
    title: 'Madinah Arabic Book 2 (Urdu)',
    description: 'Continue with Book 2 in Urdu through structured grammar lessons, sentence patterns, and progressively deeper Arabic study.',
    instructor: 'Nur Academy Arabic Faculty',
    category: 'Arabic',
    level: 'Intermediate',
    language: 'Urdu',
    groupSize: 9,
    source: { type: 'playlist-file', file: 'madinahArabicBook2UrduPlaylist.js' },
  },
  {
    key: 'madinah-arabic-book-3-urdu',
    title: 'Madinah Arabic Book 3 (Urdu)',
    description: 'Complete the Urdu series with Book 3 and its advanced lesson path, keeping progress and completion separate from the earlier books.',
    instructor: 'Nur Academy Arabic Faculty',
    category: 'Arabic',
    level: 'Advanced',
    language: 'Urdu',
    groupSize: 7,
    source: { type: 'playlist-file', file: 'madinahArabicBook3UrduPlaylist.js' },
  },
  {
    key: 'madinah-arabic-book-1-english',
    title: 'Madinah Arabic Book 1 (English)',
    description: 'Start with Madinah Arabic Book 1 in English, including the opening Quranic Arabic concepts and the complete Book 1 lesson path from Nur Academy.',
    instructor: 'Nur Academy Arabic Faculty',
    category: 'Arabic',
    level: 'Beginner',
    language: 'English',
    groupSize: 8,
    source: { type: 'playlist-file', file: 'madinahArabicEnglishPlaylist.js' },
  },
  {
    key: 'madinah-arabic-book-2-english',
    title: 'Madinah Arabic Book 2 (English)',
    description: 'Continue into Madinah Arabic Book 2 in English with the full second-book sequence organized into structured modules.',
    instructor: 'Nur Academy Arabic Faculty',
    category: 'Arabic',
    level: 'Intermediate',
    language: 'English',
    groupSize: 9,
    source: { type: 'playlist-file', file: 'madinahArabicBook2EnglishPlaylist.js' },
  },
  {
    key: 'aqidah-at-tahawi',
    title: 'Aqidah At-Tahawi',
    description: 'A structured Aqidah At-Tahawi course covering creed, divine attributes, decree, prophethood, and core Sunni belief foundations.',
    instructor: 'Asrar Rashid',
    category: 'Aqidah',
    level: 'Intermediate',
    language: 'English',
    groupSize: 5,
    source: { type: 'playlist-file', file: 'aqidahNewPlaylist.js' },
  },
  {
    key: 'hajj-course',
    title: 'Hajj Course',
    description: 'A step-by-step Hajj guide covering preparation, ihram, major rites, and common practical questions through the full playlist.',
    instructor: 'Zaid Patel',
    category: 'Fiqh',
    level: 'Beginner',
    language: 'English',
    groupSize: 6,
    source: { type: 'playlist-file', file: 'hajjPlaylist.js' },
  },
  {
    key: 'hifz-quran',
    title: 'Hifz Quran',
    description: 'A large Urdu/Hindi Hifz pathway for memorising short surahs, revision lessons, and extended hifz practice from the linked playlist.',
    instructor: 'eQuranAcademy',
    category: 'Quran',
    level: 'Intermediate',
    language: 'Urdu',
    groupSize: 10,
    source: { type: 'playlist-file', file: 'hifzQuranPlaylist.js' },
  },
  {
    key: 'recite-quran-properly',
    title: 'Recite Quran Properly',
    description: 'A guided recitation practice course focused on reading the Quran correctly page by page with slow, clear demonstration.',
    instructor: 'Alaa Elsayed',
    category: 'Quran',
    level: 'Beginner',
    language: 'English',
    groupSize: 8,
    source: { type: 'playlist-file', file: 'reciteQuranProperlyPlaylist.js' },
  },
  {
    key: 'complete-namaz-with-tajweed',
    title: 'Complete Namaz with Tajweed',
    description: 'A short practical lesson for learning the complete namaz recitation with proper tajweed.',
    instructor: 'Nur Academy',
    category: 'Quran',
    level: 'Beginner',
    language: 'Urdu',
    groupSize: 1,
    source: {
      type: 'manual',
      lessons: [
        {
          title: 'Lesson 01 - Complete Namaz with Tajweed',
          youtubeId: 'EBmgv8Z25Mc',
          duration: '15:00',
          description: 'Imported from the YouTube lesson shared in Nur Academy for complete namaz with tajweed.',
        },
      ],
    },
  },
  {
    key: 'usool-e-hadith',
    title: 'Usool e Hadith',
    description: 'A full Usool e Hadith course covering the preservation, terminology, and foundations of the Hadith sciences.',
    instructor: 'Shaikh Noorul Hasan Madani',
    category: 'Hadith',
    level: 'Intermediate',
    language: 'Urdu',
    groupSize: 8,
    source: { type: 'playlist-file', file: 'usoolHadithPlaylist.js' },
  },
  {
    key: 'sahih-muslim',
    title: 'Sahih Muslim',
    description: 'A standalone Sahih Muslim course using the Urdu translation playlist shared in Nur Academy.',
    instructor: 'Sunnat Pak',
    category: 'Hadith',
    level: 'Intermediate',
    language: 'Urdu',
    groupSize: 10,
    source: { type: 'playlist-file', file: 'muslimSharifPlaylist.js' },
  },
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function getArg(flag) {
  const exact = `${flag}=`;
  for (let i = 2; i < process.argv.length; i += 1) {
    const value = process.argv[i];
    if (value === flag) return process.argv[i + 1];
    if (value.startsWith(exact)) return value.slice(exact.length);
  }
  return undefined;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function slugify(value, fallback = 'course') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;
}

function parseDurationToSeconds(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return 0;
  const parts = trimmed.split(':').map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return 0;

  if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  }
  if (parts.length === 2) {
    return (parts[0] * 60) + parts[1];
  }
  return parts[0];
}

function chunk(items, size) {
  const groups = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

async function loadPlaylistSource(nurDataDir, fileName) {
  const modulePath = path.join(nurDataDir, fileName);
  if (!fs.existsSync(modulePath)) {
    throw new Error(`Missing Nur Academy data file: ${modulePath}`);
  }

  const exportsObject = await import(pathToFileURL(modulePath).href);
  const playlistIdKey = Object.keys(exportsObject).find((key) => key.endsWith('_PLAYLIST_ID'));
  const playlistItemsKey = Object.keys(exportsObject).find((key) => key.endsWith('_PLAYLIST_ITEMS'));

  if (!playlistItemsKey) {
    throw new Error(`Could not find playlist items export in ${fileName}`);
  }

  const playlistId = playlistIdKey ? exportsObject[playlistIdKey] : '';
  const rawItems = exportsObject[playlistItemsKey] || [];

  return {
    playlistId: playlistId || '',
    lessons: rawItems.map((item, index) => ({
      order: Number(item.index || (index + 1)),
      title: item.sourceTitle || `Lesson ${String(index + 1).padStart(2, '0')}`,
      youtubeId: item.youtubeId,
      durationSec: parseDurationToSeconds(item.duration),
      description: item.sourceTitle ? `Imported from Nur Academy: ${item.sourceTitle}` : 'Imported from Nur Academy playlist data.',
      thumbnailUrl: item.youtubeId ? `https://i3.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg` : '',
    })),
  };
}

async function resolveCourseContent(nurDataDir, spec) {
  if (spec.source.type === 'manual') {
    return {
      playlistId: '',
      lessons: spec.source.lessons.map((lesson, index) => ({
        order: index + 1,
        title: lesson.title,
        youtubeId: lesson.youtubeId,
        durationSec: parseDurationToSeconds(lesson.duration),
        description: lesson.description || 'Imported from Nur Academy.',
        thumbnailUrl: lesson.youtubeId ? `https://i3.ytimg.com/vi/${lesson.youtubeId}/hqdefault.jpg` : '',
      })),
    };
  }

  return loadPlaylistSource(nurDataDir, spec.source.file);
}

async function resolveInstructorProfile(supabase, email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, name')
    .eq('email', email)
    .single();

  if (error) throw error;
  return data;
}

async function findExistingCourse(supabase, spec, playlistId) {
  if (playlistId) {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, playlist_id')
      .eq('playlist_id', playlistId)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;
  }

  const { data, error } = await supabase
    .from('courses')
    .select('id, title, playlist_id')
    .eq('title', spec.title)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function insertCourseGraph(supabase, instructorId, spec, content, isPublished) {
  const firstLesson = content.lessons[0] || {};
  const category = CATEGORY_MAP[spec.category] || 'Other';
  const level = LEVEL_MAP[spec.level] || 'beginner';

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      title: spec.title,
      description: spec.description,
      thumbnail_url: firstLesson.thumbnailUrl || '',
      level,
      language: spec.language || 'English',
      category,
      is_free: true,
      price: 0,
      is_published: isPublished,
      playlist_id: content.playlistId || null,
      instructor_id: instructorId,
      total_lessons: content.lessons.length,
    })
    .select('id, title')
    .single();

  if (courseError) throw courseError;

  const groupedLessons = chunk(content.lessons, Math.max(1, spec.groupSize || content.lessons.length || 1));

  for (let moduleIndex = 0; moduleIndex < groupedLessons.length; moduleIndex += 1) {
    const group = groupedLessons[moduleIndex];
    const start = group[0]?.order || 1;
    const end = group[group.length - 1]?.order || start;

    const { data: moduleRow, error: moduleError } = await supabase
      .from('modules')
      .insert({
        course_id: course.id,
        title: groupedLessons.length === 1
          ? 'Course Content'
          : `Module ${moduleIndex + 1} - Lessons ${String(start).padStart(2, '0')}-${String(end).padStart(2, '0')}`,
        order: moduleIndex,
      })
      .select('id')
      .single();

    if (moduleError) throw moduleError;

    const lessonRows = group.map((lesson, lessonIndex) => ({
      module_id: moduleRow.id,
      course_id: course.id,
      title: lesson.title,
      youtube_id: lesson.youtubeId,
      thumbnail_url: lesson.thumbnailUrl || '',
      duration_sec: lesson.durationSec || 0,
      description: lesson.description || '',
      order: lessonIndex,
    }));

    const { error: lessonError } = await supabase.from('lessons').insert(lessonRows);
    if (lessonError) throw lessonError;
  }

  return {
    id: course.id,
    title: course.title,
    lessons: content.lessons.length,
  };
}

async function main() {
  loadEnvFile(path.join(rootDir, '.env'));
  loadEnvFile(path.join(rootDir, '.env.local'));

  if (hasFlag('--help') || hasFlag('-h')) {
    console.log(`
Usage:
  node scripts/import-nur-academy-courses.cjs [--instructor-email admin@example.com] [--nur-root "C:\\path\\to\\Nur Academy"] [--only slug] [--dry-run] [--draft]

Required env for real import:
  VITE_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
`);
    return;
  }

  const nurRoot = getArg('--nur-root') || defaultNurRoot;
  const nurDataDir = path.join(nurRoot, 'src', 'data');
  const instructorEmail = getArg('--instructor-email') || 'kamraankhan567@gmail.com';
  const only = getArg('--only');
  const dryRun = hasFlag('--dry-run');
  const isPublished = !hasFlag('--draft');

  const selectedCatalog = only
    ? CATALOG.filter((spec) => spec.key === only || slugify(spec.title) === only)
    : CATALOG;

  if (!selectedCatalog.length) {
    fail(`No Nur Academy course matched "${only}"`);
  }

  const resolved = [];
  for (const spec of selectedCatalog) {
    const content = await resolveCourseContent(nurDataDir, spec);
    resolved.push({
      spec,
      content,
    });
  }

  if (dryRun) {
    console.log(`Nur Academy root: ${nurRoot}`);
    console.log(`Courses ready: ${resolved.length}`);
    for (const entry of resolved) {
      console.log(`- ${entry.spec.title} | lessons=${entry.content.lessons.length} | playlist=${entry.content.playlistId || 'manual'}`);
    }
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) fail('Missing VITE_SUPABASE_URL in .env');
  if (!serviceRoleKey) fail('Missing SUPABASE_SERVICE_ROLE_KEY in environment');

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const instructor = await resolveInstructorProfile(supabase, instructorEmail);
  if (!instructor?.id) {
    fail(`Could not find instructor profile for ${instructorEmail}`);
  }

  const imported = [];
  const skipped = [];

  for (const entry of resolved) {
    const existing = await findExistingCourse(supabase, entry.spec, entry.content.playlistId);
    if (existing) {
      skipped.push({ title: entry.spec.title, reason: `already exists (${existing.id})` });
      continue;
    }

    const course = await insertCourseGraph(
      supabase,
      instructor.id,
      entry.spec,
      entry.content,
      isPublished,
    );

    imported.push(course);
  }

  console.log(`Imported: ${imported.length}`);
  imported.forEach((course) => {
    console.log(`+ ${course.title} (${course.id}) lessons=${course.lessons}`);
  });

  console.log(`Skipped: ${skipped.length}`);
  skipped.forEach((course) => {
    console.log(`- ${course.title}: ${course.reason}`);
  });
}

main().catch((error) => {
  fail(error?.message || 'Failed to import Nur Academy courses');
});

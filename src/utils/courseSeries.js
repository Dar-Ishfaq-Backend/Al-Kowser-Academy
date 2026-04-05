export const MADINAH_SERIES_ID = 'madinah-arabic-books';
export const MADINAH_ENGLISH_SERIES_ID = 'madinah-arabic-books-english';
export const NOORANI_SERIES_ID = 'noorani-qaida-series';
export const MADANI_SERIES_ID = 'madani-qaida-series';

const SERIES_CONFIG = [
  {
    id: MADINAH_SERIES_ID,
    title: 'Madinah Arabic Books',
    description: 'Study the complete Urdu Madinah Arabic pathway from one place and choose Book 1, Book 2, or Book 3 as needed.',
    category: 'Arabic',
    language: 'Urdu',
    level: 'beginner',
    filterLevels: ['beginner', 'intermediate', 'advanced'],
    seriesLabel: 'Madinah Series',
    seriesSubtitle: 'Urdu Madinah Series',
    badgeLabel: '3 Books',
    countLabel: 'Books',
    overview: 'This single series card now brings Madinah Arabic Book 1, Book 2, and Book 3 together. Choose the book you need and continue each one separately.',
    chooseTitle: 'Book 1, Book 2, and Book 3',
    chooseSubtitle: 'Choose Your Book',
    summary: 'Open one refined series card and jump directly to Book 1, Book 2, or Book 3 with a cleaner Urdu learning path.',
    secondaryLabel: 'Choose the right Madinah book from a single place instead of browsing separate cards.',
    members: [
      { title: 'Madinah Arabic Book 1 (Urdu)', shortLabel: 'Book 1' },
      { title: 'Madinah Arabic Book 2 (Urdu)', shortLabel: 'Book 2' },
      { title: 'Madinah Arabic Book 3 (Urdu)', shortLabel: 'Book 3' },
    ],
  },
  {
    id: MADINAH_ENGLISH_SERIES_ID,
    title: 'Madinah Arabic Books (English)',
    description: 'Browse the Madinah Arabic English pathway from one place and open Book 1, Book 2, or Book 3 whenever you need.',
    category: 'Arabic',
    language: 'English',
    level: 'beginner',
    filterLevels: ['beginner', 'intermediate', 'advanced'],
    seriesLabel: 'Madinah Series',
    seriesSubtitle: 'English Madinah Series',
    badgeLabel: '3 Books',
    countLabel: 'Books',
    overview: 'This series keeps the full English Madinah Arabic track together so you can jump to the right book at the right time.',
    chooseTitle: 'Book 1, Book 2, and Book 3',
    chooseSubtitle: 'Choose Your Book',
    summary: 'Open the English Madinah series card and jump directly to Book 1, Book 2, or Book 3.',
    secondaryLabel: 'A single English Madinah series card keeps all books together.',
    members: [
      { title: 'Madinah Arabic Book 1 (English)', shortLabel: 'Book 1' },
      { title: 'Madinah Arabic Book 2 (English)', shortLabel: 'Book 2' },
      { title: 'Madinah Arabic Book 3 (English)', shortLabel: 'Book 3' },
    ],
  },
  {
    id: NOORANI_SERIES_ID,
    title: 'Noorani Qaida Series',
    description: 'Choose between Noorani Qaida and Noorani Basics from one clean series card.',
    category: 'Quran',
    language: 'Urdu',
    level: 'beginner',
    filterLevels: ['beginner', 'intermediate', 'advanced'],
    seriesLabel: 'Qaida Series',
    seriesSubtitle: 'Noorani Qaida Series',
    badgeLabel: '2 Courses',
    countLabel: 'Courses',
    overview: 'Keep both Noorani Qaida tracks together so students can pick the pace that fits them.',
    chooseTitle: 'Noorani Qaida and Noorani Basics',
    chooseSubtitle: 'Choose Your Noorani Track',
    summary: 'Open Noorani Qaida or Noorani Basics from one professional series card.',
    secondaryLabel: 'Two Noorani pathways presented side-by-side.',
    members: [
      { title: 'Noorani Qaida', shortLabel: 'Noorani Qaida' },
      { title: 'Noorani Basics', shortLabel: 'Noorani Basics' },
    ],
  },
  {
    id: MADANI_SERIES_ID,
    title: 'Madani Qaida Series',
    description: 'Pick the Madani Qaida track you need from one unified card.',
    category: 'Quran',
    language: 'Urdu',
    level: 'beginner',
    filterLevels: ['beginner', 'intermediate', 'advanced'],
    seriesLabel: 'Qaida Series',
    seriesSubtitle: 'Madani Qaida Series',
    badgeLabel: '2 Courses',
    countLabel: 'Courses',
    overview: 'Keep both Madani Qaida tracks together so students can pick classic or journey.',
    chooseTitle: 'Madani Qaida Classic and Journey',
    chooseSubtitle: 'Choose Your Madani Track',
    summary: 'Open Madani Qaida Classic or Journey from one clear series card.',
    secondaryLabel: 'Classic and Journey options are grouped in one place.',
    members: [
      { title: 'Madani Qaida Classic', shortLabel: 'Madani Classic' },
      { title: 'Madani Qaida Journey', shortLabel: 'Madani Journey' },
    ],
  },
];

function getLessonCount(course) {
  return course.total_lessons
    || course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0)
    || 0;
}

function formatCountLabel(count, label) {
  if (count === 1) {
    return label.endsWith('s') ? label.slice(0, -1) : label;
  }
  return label;
}

function isSeriesMember(course, config) {
  return config.members.some((item) => item.title === course?.title);
}

export function isMadinahSeriesCourse(course) {
  return SERIES_CONFIG
    .filter((config) => config.id === MADINAH_SERIES_ID)
    .some((config) => isSeriesMember(course, config));
}

export function isSeriesCourseId(courseId) {
  return SERIES_CONFIG.some((config) => config.id === courseId);
}

export function getSeriesConfigById(seriesId) {
  return SERIES_CONFIG.find((config) => config.id === seriesId);
}

export function getSeriesMembers(courses = [], config) {
  return config.members
    .map((item) => {
      const course = courses.find((entry) => entry?.title === item.title);
      return course ? { ...course, ...item } : null;
    })
    .filter(Boolean);
}

function buildSeriesCourse(config, courses = [], enrolledIds = new Set(), progressMap = {}) {
  const members = getSeriesMembers(courses, config);
  if (!members.length) return null;

  const progressTotals = members.reduce((acc, member) => {
    if (!enrolledIds.has(member.id)) return acc;

    const lessons = Math.max(1, getLessonCount(member));
    acc.weight += lessons;
    acc.progress += ((progressMap[member.id] || 0) / 100) * lessons;
    return acc;
  }, { weight: 0, progress: 0 });

  const anyEnrolled = members.some((member) => enrolledIds.has(member.id));
  const countLabel = config.countLabel || 'Courses';
  const computedBadgeLabel = `${members.length} ${formatCountLabel(members.length, countLabel)}`;
  const badgeLabel = config.badgeLabel && members.length === config.members.length
    ? config.badgeLabel
    : computedBadgeLabel;

  return {
    id: config.id,
    title: config.title,
    description: config.description,
    category: config.category,
    language: config.language,
    level: config.level,
    filterLevels: config.filterLevels,
    is_free: members.every((member) => member.is_free !== false),
    price: members.some((member) => !member.is_free)
      ? Math.max(...members.map((member) => Number(member.price) || 0))
      : 0,
    total_lessons: members.reduce((total, member) => total + getLessonCount(member), 0),
    thumbnail_url: members[0].thumbnail_url
      || members[0].modules?.[0]?.lessons?.[0]?.thumbnail_url
      || '',
    instructor: members[0].instructor,
    isSeriesGroup: true,
    summary: config.summary,
    primaryLabel: anyEnrolled ? 'Resume Series' : 'View Courses',
    primaryHref: `/courses/${config.id}`,
    secondaryLabel: config.secondaryLabel,
    seriesLabel: config.seriesLabel,
    seriesSubtitle: config.seriesSubtitle,
    seriesOverview: config.overview,
    chooseTitle: config.chooseTitle,
    chooseSubtitle: config.chooseSubtitle,
    badgeLabel,
    countLabel,
    searchText: [config.title, ...members.map((member) => member.title)].join(' '),
    groupMembers: members.map((member) => ({
      ...member,
      progress: progressMap[member.id] ?? 0,
      enrolled: enrolledIds.has(member.id),
      lessons: getLessonCount(member),
      href: enrolledIds.has(member.id) ? `/courses/${member.id}/learn` : `/courses/${member.id}`,
    })),
    progress: progressTotals.weight
      ? Math.round((progressTotals.progress / progressTotals.weight) * 100)
      : null,
  };
}

export function buildSeriesCourseById(seriesId, courses = [], enrolledIds = new Set(), progressMap = {}) {
  const config = getSeriesConfigById(seriesId);
  if (!config) return null;
  return buildSeriesCourse(config, courses, enrolledIds, progressMap);
}

export function groupCatalogCourses(courses = [], enrolledIds = new Set(), progressMap = {}) {
  let grouped = [...courses];

  SERIES_CONFIG.forEach((config) => {
    const seriesCourse = buildSeriesCourse(config, grouped, enrolledIds, progressMap);
    if (!seriesCourse) return;

    const firstSeriesIndex = grouped.findIndex((course) => isSeriesMember(course, config));
    if (firstSeriesIndex === -1) return;

    const nonSeriesCourses = grouped.filter((course) => !isSeriesMember(course, config));
    const insertAt = Math.min(firstSeriesIndex, nonSeriesCourses.length);
    nonSeriesCourses.splice(insertAt, 0, seriesCourse);
    grouped = nonSeriesCourses;
  });

  return grouped;
}

export function matchesGroupedCourse(course, { search = '', level = '', category = '' } = {}) {
  if (category && course.category !== category) return false;

  if (level) {
    const levels = course.filterLevels || [course.level];
    if (!levels.includes(level)) return false;
  }

  const term = search.trim().toLowerCase();
  if (!term) return true;

  const haystack = [
    course.title,
    course.description,
    course.summary,
    course.language,
    course.category,
    course.searchText,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(term);
}

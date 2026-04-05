const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');
const { createClient } = require('@supabase/supabase-js');

const rootDir = path.resolve(__dirname, '..');

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

function extractPlaylistId(input) {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^PL[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    return url.searchParams.get('list');
  } catch {
    return null;
  }
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function decodeEscapedJsonString(value) {
  return value.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

function textFromRuns(node) {
  if (!node) return '';
  if (typeof node.simpleText === 'string') return node.simpleText;
  if (Array.isArray(node.runs)) return node.runs.map((run) => run.text || '').join('');
  return '';
}

function findFirstMatch(source, regex, fallback = '') {
  const match = source.match(regex);
  return match ? decodeHtmlEntities(match[1].trim()) : fallback;
}

function collectValues(root, predicate, results = []) {
  if (Array.isArray(root)) {
    for (const item of root) collectValues(item, predicate, results);
    return results;
  }

  if (!root || typeof root !== 'object') {
    return results;
  }

  if (predicate(root)) {
    results.push(root);
  }

  for (const value of Object.values(root)) {
    collectValues(value, predicate, results);
  }

  return results;
}

function extractInitialData(html) {
  const match = html.match(/(?:window\[['"])?ytInitialData(?:['"]\])?\s*=\s*'([\s\S]*?)';/);
  if (!match) {
    throw new Error('Could not find ytInitialData in playlist page');
  }

  return JSON.parse(decodeEscapedJsonString(match[1]));
}

function extractPlaylistVideos(initialData) {
  const renderers = collectValues(
    initialData,
    (node) => Object.prototype.hasOwnProperty.call(node, 'playlistVideoRenderer')
  ).map((node) => node.playlistVideoRenderer);

  const seen = new Set();
  const videos = [];

  for (const renderer of renderers) {
    const videoId = renderer.videoId;
    if (!videoId || seen.has(videoId)) continue;
    seen.add(videoId);

    const thumbs = renderer.thumbnail?.thumbnails || [];
    const thumbnail = thumbs[thumbs.length - 1]?.url || `https://i3.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    videos.push({
      videoId,
      title: textFromRuns(renderer.title) || `Lesson ${videos.length + 1}`,
      thumbnail,
      description: '',
    });
  }

  return videos;
}

function parseFeedEntries(xml) {
  const title = findFirstMatch(xml, /<feed[\s\S]*?<title>([\s\S]*?)<\/title>/);
  const channelTitle = findFirstMatch(xml, /<author>[\s\S]*?<name>([\s\S]*?)<\/name>/);
  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml))) {
    const entry = match[1];
    entries.push({
      videoId: findFirstMatch(entry, /<yt:videoId>([\s\S]*?)<\/yt:videoId>/),
      title: findFirstMatch(entry, /<title>([\s\S]*?)<\/title>/),
      thumbnail: findFirstMatch(entry, /<media:thumbnail[^>]*url="([^"]+)"/),
      description: findFirstMatch(entry, /<media:description>([\s\S]*?)<\/media:description>/),
    });
  }

  return { title, channelTitle, entries };
}

async function fetchText(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return response.text();
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

async function main() {
  loadEnvFile(path.join(rootDir, '.env'));
  loadEnvFile(path.join(rootDir, '.env.local'));

  if (hasFlag('--help') || hasFlag('-h')) {
    console.log(`
Usage:
  node scripts/import-playlist-course.cjs --url "https://www.youtube.com/playlist?list=PL..." --instructor-email admin@example.com [--category Arabic] [--level beginner] [--language Urdu] [--title "Course Title"] [--description "Custom description"] [--draft]

Required env:
  VITE_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
`);
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = getArg('--url');
  const instructorEmail = getArg('--instructor-email');
  const category = getArg('--category') || 'Arabic';
  const level = getArg('--level') || 'beginner';
  const language = getArg('--language') || 'Urdu';
  const overrideTitle = getArg('--title');
  const overrideDescription = getArg('--description');
  const isPublished = !hasFlag('--draft');

  if (!supabaseUrl) fail('Missing VITE_SUPABASE_URL in .env');
  if (!serviceRoleKey) fail('Missing SUPABASE_SERVICE_ROLE_KEY in .env');
  if (!url) fail('Missing --url argument');
  if (!instructorEmail) fail('Missing --instructor-email argument');

  const playlistId = extractPlaylistId(url);
  if (!playlistId) fail('Could not extract a playlist id from the provided URL');

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const instructor = await resolveInstructorProfile(supabase, instructorEmail);
  if (!instructor?.id) {
    fail(`Could not find instructor profile for ${instructorEmail}`);
  }

  const { data: existingCourse, error: existingError } = await supabase
    .from('courses')
    .select('id, title')
    .eq('playlist_id', playlistId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingCourse) {
    console.log(`Course already exists: ${existingCourse.title} (${existingCourse.id})`);
    return;
  }

  const [playlistHtml, feedXml] = await Promise.all([
    fetchText(`https://m.youtube.com/playlist?list=${playlistId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }),
    fetchText(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`),
  ]);

  const feedData = parseFeedEntries(feedXml);
  const feedMap = new Map(feedData.entries.map((entry) => [entry.videoId, entry]));
  let htmlVideos = [];

  try {
    const initialData = extractInitialData(playlistHtml);
    htmlVideos = extractPlaylistVideos(initialData);
  } catch (error) {
    console.warn(`Falling back to playlist feed only: ${error.message}`);
  }

  const sourceVideos = htmlVideos.length
    ? htmlVideos
    : feedData.entries.map((entry) => ({
        videoId: entry.videoId,
        title: entry.title,
        thumbnail: entry.thumbnail,
        description: entry.description,
      }));

  const videos = sourceVideos.map((video) => {
    const feedEntry = feedMap.get(video.videoId);
    return {
      ...video,
      title: feedEntry?.title || video.title,
      thumbnail: feedEntry?.thumbnail || video.thumbnail,
      description: feedEntry?.description || video.description || '',
    };
  });

  if (!videos.length) {
    fail('No videos were found in the playlist');
  }

  const courseTitle = overrideTitle || feedData.title || videos[0].title;
  const description = overrideDescription
    || `Imported from the YouTube playlist "${courseTitle}" by ${feedData.channelTitle || instructor.name || 'the instructor'}.`;

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      title: courseTitle,
      description,
      thumbnail_url: videos[0].thumbnail,
      level,
      language,
      category,
      is_free: true,
      price: 0,
      is_published: isPublished,
      playlist_id: playlistId,
      instructor_id: instructor.id,
      total_lessons: videos.length,
    })
    .select('id, title')
    .single();

  if (courseError) throw courseError;

  const { data: moduleRow, error: moduleError } = await supabase
    .from('modules')
    .insert({
      course_id: course.id,
      title: 'Course Content',
      order: 0,
    })
    .select('id')
    .single();

  if (moduleError) throw moduleError;

  const lessons = videos.map((video, index) => ({
    module_id: moduleRow.id,
    course_id: course.id,
    title: video.title,
    youtube_id: video.videoId,
    thumbnail_url: video.thumbnail,
    description: video.description,
    order: index,
  }));

  const { error: lessonError } = await supabase.from('lessons').insert(lessons);
  if (lessonError) throw lessonError;

  const { error: totalError } = await supabase
    .from('courses')
    .update({ total_lessons: lessons.length })
    .eq('id', course.id);

  if (totalError) throw totalError;

  console.log(`Imported course: ${course.title}`);
  console.log(`Course id: ${course.id}`);
  console.log(`Lessons imported: ${lessons.length}`);
  console.log(`Published: ${isPublished ? 'yes' : 'no'}`);
}

main().catch((error) => {
  fail(error?.message || 'Failed to import playlist course');
});

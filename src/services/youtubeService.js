const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE    = 'https://www.googleapis.com/youtube/v3';

function parseIsoDuration(isoDuration = '') {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const [, hours = '0', minutes = '0', seconds = '0'] = match;
  return (Number(hours) * 3600) + (Number(minutes) * 60) + Number(seconds);
}

async function fetchDurations(videoIds) {
  const durationMap = {};

  for (let index = 0; index < videoIds.length; index += 50) {
    const batch = videoIds.slice(index, index + 50);
    if (!batch.length) continue;

    const response = await fetch(
      `${BASE}/videos?part=contentDetails&id=${batch.join(',')}&key=${API_KEY}`,
    );
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);

    for (const item of data.items || []) {
      durationMap[item.id] = parseIsoDuration(item.contentDetails?.duration);
    }
  }

  return durationMap;
}

/* ─── Extract playlist ID from any YouTube URL ── */
export function extractPlaylistId(url) {
  if (!url) return null;
  // Handle direct playlist IDs too
  if (/^PL[a-zA-Z0-9_-]+$/.test(url.trim())) return url.trim();
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/* ─── Extract video ID from YouTube URL ────────── */
export function extractVideoId(url) {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

/* ─── Fetch full playlist data via YouTube API ── */
export async function fetchPlaylist(playlistId) {
  if (!API_KEY) {
    throw new Error('YouTube API key not configured. Set VITE_YOUTUBE_API_KEY in .env');
  }

  // 1. Fetch playlist metadata
  const metaRes = await fetch(
    `${BASE}/playlists?part=snippet&id=${playlistId}&key=${API_KEY}`
  );
  const metaData = await metaRes.json();

  if (metaData.error) throw new Error(metaData.error.message);
  if (!metaData.items?.length) throw new Error('Playlist not found or is private.');

  const snippet = metaData.items[0].snippet;

  // 2. Fetch all playlist items (handles pagination)
  const videos  = [];
  let pageToken = '';

  do {
    const itemsRes = await fetch(
      `${BASE}/playlistItems?part=snippet,contentDetails&maxResults=50` +
      `&playlistId=${playlistId}&key=${API_KEY}` +
      (pageToken ? `&pageToken=${pageToken}` : '')
    );
    const itemsData = await itemsRes.json();

    if (itemsData.error) throw new Error(itemsData.error.message);

    for (const item of itemsData.items || []) {
      const s = item.snippet;
      // Skip deleted/private videos
      if (s.title === 'Deleted video' || s.title === 'Private video') continue;

      videos.push({
        title:        s.title,
        description:  s.description,
        videoId:      s.resourceId.videoId,
        thumbnail:    s.thumbnails?.medium?.url || s.thumbnails?.default?.url || '',
        position:     s.position,
      });
    }

    pageToken = itemsData.nextPageToken || '';
  } while (pageToken);

  const durationMap = await fetchDurations(videos.map((video) => video.videoId));

  return {
    playlistId,
    title:       snippet.title,
    description: snippet.description,
    thumbnail:   snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || '',
    channelTitle: snippet.channelTitle,
    videos: videos.map((video) => ({
      ...video,
      durationSec: durationMap[video.videoId] || 0,
    })),
  };
}

/* ─── YouTube thumbnail URL helpers ────────────── */
export const ytThumbnail = (videoId, quality = 'mqdefault') =>
  `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;

/* ─── Build embed URL ───────────────────────────── */
export const ytEmbedUrl = (videoId, opts = {}) => {
  const params = new URLSearchParams({
    modestbranding: 1,
    rel: 0,
    showinfo: 0,
    color: 'white',
    ...opts,
  });
  return `https://www.youtube.com/embed/${videoId}?${params}`;
};

import { useEffect, useRef, useState } from 'react';

let youtubeApiPromise = null;

function loadYouTubeApi() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is not available'));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-youtube-iframe-api="true"]');

      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        resolve(window.YT);
      };

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.dataset.youtubeIframeApi = 'true';
        script.onerror = () => reject(new Error('Failed to load YouTube player'));
        document.body.appendChild(script);
      }
    });
  }

  return youtubeApiPromise;
}

export default function VideoPlayer({
  videoId,
  onEnded,
  onProgress,
  autoplay = false,
}) {
  const [loading, setLoading] = useState(true);
  const playerHostRef = useRef(null);
  const playerRef = useRef(null);
  const pollRef = useRef(null);
  const onProgressRef = useRef(onProgress);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    setLoading(true);
  }, [videoId]);

  useEffect(() => {
    let active = true;

    const stopPolling = () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const emitProgress = (forceEnded = false) => {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== 'function') return;

      const duration = Number(player.getDuration?.() || 0);
      const currentTime = Number(player.getCurrentTime?.() || 0);

      onProgressRef.current?.({
        currentTime,
        duration,
        progressPercent: duration > 0 ? Math.round((currentTime / duration) * 100) : 0,
        ended: forceEnded,
      });
    };

    const startPolling = () => {
      stopPolling();
      pollRef.current = window.setInterval(() => emitProgress(false), 1500);
    };

    async function setupPlayer() {
      if (!videoId || !playerHostRef.current) {
        setLoading(false);
        return;
      }

      try {
        const YT = await loadYouTubeApi();
        if (!active || !playerHostRef.current) return;

        playerRef.current?.destroy?.();
        playerHostRef.current.innerHTML = '';

        playerRef.current = new YT.Player(playerHostRef.current, {
          width: '100%',
          height: '100%',
          videoId,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            color: 'white',
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (!active) return;
              setLoading(false);
              emitProgress(false);
            },
            onStateChange: (event) => {
              if (!active) return;

              switch (event.data) {
                case YT.PlayerState.PLAYING:
                  startPolling();
                  break;
                case YT.PlayerState.PAUSED:
                case YT.PlayerState.BUFFERING:
                  emitProgress(false);
                  stopPolling();
                  break;
                case YT.PlayerState.ENDED:
                  emitProgress(true);
                  stopPolling();
                  onEndedRef.current?.();
                  break;
                default:
                  break;
              }
            },
            onError: () => {
              if (!active) return;
              setLoading(false);
              stopPolling();
            },
          },
        });
      } catch (err) {
        console.error('YouTube player setup error:', err);
        if (active) setLoading(false);
      }
    }

    setupPlayer();

    return () => {
      active = false;
      stopPolling();
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [autoplay, videoId]);

  if (!videoId) {
    return (
      <div className="yt-embed-wrapper bg-navy-dark rounded-xl flex items-center justify-center">
        <div className="text-slate-muted text-sm">Select a lesson to begin</div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden shadow-glass border border-navy-border/50">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-navy-dark z-10 rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-navy-border border-t-gold rounded-full animate-spin" />
            <span className="text-xs text-slate-muted font-display tracking-widest">Loading…</span>
          </div>
        </div>
      )}
      <div className="yt-embed-wrapper">
        <div ref={playerHostRef} className="h-full w-full" />
      </div>
    </div>
  );
}

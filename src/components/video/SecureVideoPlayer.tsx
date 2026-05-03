import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, Play, Settings, SkipForward, SkipBack, Maximize, Volume2, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNetworkSpeed } from '@/hooks/useNetworkSpeed';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Declare globals for CDN libraries
declare global {
  interface Window {
    Plyr: any;
    Hls: any;
  }
}

interface SecureVideoPlayerProps {
  lessonId: string;
  videoPath: string;
  isFreePreview?: boolean;
  onProgress?: (progress: number, currentTime: number) => void;
  onComplete?: () => void;
  initialPosition?: number;
  allowExternal?: boolean;
}

export function SecureVideoPlayer({
  lessonId,
  videoPath,
  isFreePreview = false,
  onProgress,
  onComplete,
  initialPosition = 0,
  allowExternal = false,
}: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const hlsRef = useRef<any>(null);
  const completionTrackedRef = useRef<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [useIframe, setUseIframe] = useState(false);
  const [iframeMarkedComplete, setIframeMarkedComplete] = useState(false);
  const [iframeWatchTime, setIframeWatchTime] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  
  const { user, session, isAdmin } = useAuth();
  const { isSlow } = useNetworkSpeed();
  const [volume, setVolume] = useState(() => Number(localStorage.getItem('plyr-volume') || 1));
  const [playbackSpeed, setPlaybackSpeed] = useState(() => Number(localStorage.getItem('plyr-speed') || 1));
  const [showVolumeBadge, setShowVolumeBadge] = useState(false);
  const volumeTimeoutRef = useRef<NodeJS.Timeout>();

  const isExternalUrl = useMemo(() => /^https?:\/\//i.test(videoPath || ''), [videoPath]);
  const isGoogleDriveUrl = useMemo(
    () => /drive\.google\.com|docs\.google\.com/i.test(videoPath || ''),
    [videoPath],
  );
  const isLuluStreamUrl = useMemo(
    () => /lulustream\.com/i.test(videoPath || ''),
    [videoPath],
  );
  const isHls = useMemo(() => videoPath?.includes('.m3u8') || false, [videoPath]);

  // Handle Hotkeys
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!playerRef.current || useIframe) return;
    const player = playerRef.current;
    
    // Ignore if typing in an input
    if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

    switch (e.key.toLowerCase()) {
      case ' ':
        e.preventDefault();
        player.togglePlay();
        break;
      case 'f':
        e.preventDefault();
        player.fullscreen.toggle();
        break;
      case 'm':
        e.preventDefault();
        player.muted = !player.muted;
        break;
      case 'arrowright':
        e.preventDefault();
        player.forward(5);
        break;
      case 'arrowleft':
        e.preventDefault();
        player.rewind(5);
        break;
      case 'arrowup':
        e.preventDefault();
        const newVolUp = Math.min(1, player.volume + 0.1);
        player.volume = newVolUp;
        setVolume(newVolUp);
        localStorage.setItem('plyr-volume', newVolUp.toString());
        setShowVolumeBadge(true);
        if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
        volumeTimeoutRef.current = setTimeout(() => setShowVolumeBadge(false), 2000);
        break;
      case 'arrowdown':
        e.preventDefault();
        const newVolDown = Math.max(0, player.volume - 0.1);
        player.volume = newVolDown;
        setVolume(newVolDown);
        localStorage.setItem('plyr-volume', newVolDown.toString());
        setShowVolumeBadge(true);
        if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
        volumeTimeoutRef.current = setTimeout(() => setShowVolumeBadge(false), 2000);
        break;
      case 's':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          toast.error('Downloading is disabled for security.');
        }
        break;
    }

    // Number keys 0-9 for seek percentage
    if (/^[0-9]$/.test(e.key)) {
      const percentage = parseInt(e.key) * 10;
      player.currentTime = (percentage / 100) * player.duration;
    }
  }, [useIframe]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Fetch Video Logic
  useEffect(() => {
    const fetchVideoUrl = async () => {
      const timeoutId = setTimeout(() => {
        if (loading) {
          setError('Video taking too long to load. Please try direct link or refresh.');
          setLoading(false);
        }
      }, 15000); // 15s timeout

      try {
        setLoading(true);
        setError(null);
        setUseIframe(false);
        setPlayerReady(false);

        if (!videoPath) {
          setVideoUrl(null);
          setError('No video available for this lesson.');
          clearTimeout(timeoutId);
          return;
        }

        // LuluStream: always iframe
        if (isLuluStreamUrl) {
          setVideoUrl(videoPath);
          setUseIframe(true);
          setPlayerReady(true);
          clearTimeout(timeoutId);
          return;
        }

        // Other External URLs (not Google/Lulu)
        if (isExternalUrl && !isGoogleDriveUrl) {
          setVideoUrl(videoPath);
          setLoading(false);
          clearTimeout(timeoutId);
          return;
        }

        // Google Drive proxy logic
        if (isGoogleDriveUrl) {
          if (user && session?.access_token) {
            try {
              const { data, error: ticketError } = await supabase.functions.invoke('mint-video-ticket', {
                body: { lessonId, videoPath },
              });

              if (!ticketError && data?.ticket) {
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                const streamUrl = `${supabaseUrl}/functions/v1/stream-video?ticket=${encodeURIComponent(data.ticket)}&l=${encodeURIComponent(lessonId)}&p=${encodeURIComponent(videoPath)}`;
                setVideoUrl(streamUrl);
                clearTimeout(timeoutId);
                return;
              }
            } catch (err) {
              console.warn('Proxy failed, falling back to embed');
            }
          }
          setVideoUrl(toGoogleDriveEmbed(videoPath));
          setUseIframe(true);
          setPlayerReady(true);
          clearTimeout(timeoutId);
          return;
        }

        // Standard Storage Signed URL
        if (user || isFreePreview) {
          const fnName = user ? 'get-video-url' : 'get-video-url-public';
          const { data, error: fnError } = await supabase.functions.invoke(fnName, {
            body: { lessonId, videoPath },
          });
          if (fnError) throw fnError;
          setVideoUrl(data?.signedUrl || videoPath);
          clearTimeout(timeoutId);
          return;
        }

        setError('Please sign in to watch this lesson.');
      } catch (err: any) {
        setError(err.message || 'Failed to load video');
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchVideoUrl();
  }, [lessonId, videoPath, user?.id, isFreePreview]);

  // Initialize Plyr + HLS
  useEffect(() => {
    if (!videoRef.current || !videoUrl || useIframe || loading) return;

    const video = videoRef.current;
    
    // Cleanup previous instances
    if (playerRef.current) playerRef.current.destroy();
    if (hlsRef.current) hlsRef.current.destroy();

    const setupPlayer = () => {
      const plyrOptions = {
        controls: [
          'play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 
          'captions', 'settings', 'pip', 'airplay', 'fullscreen'
        ],
        settings: ['quality', 'speed', 'loop'],
        speed: { selected: playbackSpeed, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
        quality: { default: isSlow ? 480 : 1080, options: [4320, 2160, 1440, 1080, 720, 576, 480, 360, 240] },
        tooltips: { controls: true, seek: true },
        keyboard: { focused: true, global: false }, // We handle global hotkeys ourselves for better control
        // Custom branding
        autoplay: true,
        i18n: { speed: 'Speed', quality: 'Quality' },
      };

      if (isHls && window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({
          capLevelToPlayerSize: true,
          autoStartLoad: true,
          startLevel: -1,
          debug: false,
          xhrSetup: (xhr: XMLHttpRequest) => {
            xhr.withCredentials = false; // Important for some signed URL providers
          }
        });
        
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          playerRef.current = new window.Plyr(video, plyrOptions);
          playerRef.current.volume = volume;
          if (initialPosition > 0) {
            video.currentTime = initialPosition;
            playerRef.current.currentTime = initialPosition;
          }
          // Attempt auto-play
          playerRef.current.play().catch(() => {
            console.log('Autoplay blocked by browser policy');
          });
        });

        hls.on(window.Hls.Events.ERROR, (event: any, data: any) => {
          if (data.fatal) {
            switch (data.type) {
              case window.Hls.ErrorTypes.NETWORK_ERROR:
                console.error('HLS Network Error:', data);
                setError('Network error while loading video stream.');
                break;
              case window.Hls.ErrorTypes.MEDIA_ERROR:
                console.error('HLS Media Error:', data);
                hls.recoverMediaError();
                break;
              default:
                console.error('Fatal HLS Error:', data);
                setError('Playback failed due to a technical error.');
                hls.destroy();
                break;
            }
          }
        });
      } else {
        // For non-HLS or native HLS support (Safari)
        video.src = videoUrl;
        playerRef.current = new window.Plyr(video, plyrOptions);
        playerRef.current.volume = volume;
        if (initialPosition > 0) {
          video.currentTime = initialPosition;
          playerRef.current.currentTime = initialPosition;
        }

        // Attempt auto-play
        playerRef.current.play().catch(() => {
          console.log('Autoplay blocked by browser policy');
        });

        video.onerror = () => {
          console.error('Video element error');
          setError('Failed to play video. The source might be inaccessible.');
        };
      }

    };

    // Check if libraries are loaded (CDN scripts)
    const checkLibraries = () => {
      if (isHls) {
        return window.Plyr && window.Hls;
      }
      return window.Plyr;
    };

    if (checkLibraries()) {
      setupPlayer();
    } else {
      const interval = setInterval(() => {
        if (checkLibraries()) {
          setupPlayer();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }

    return () => {
      if (playerRef.current) playerRef.current.destroy();
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [videoUrl, useIframe, loading, isHls, isSlow]);

  // Handle events & Persistence
  useEffect(() => {
    if (!playerRef.current) return;
    const player = playerRef.current;

    player.on('ready', () => setPlayerReady(true));
    player.on('waiting', () => setIsBuffering(true));
    player.on('playing', () => setIsBuffering(false));
    player.on('pause', () => setIsBuffering(false));

    player.on('timeupdate', () => {
      const current = player.currentTime;
      const total = player.duration;
      if (onProgress && total > 0) onProgress((current / total) * 100, current);
      if (onComplete && total > 0 && current / total >= 0.95 && completionTrackedRef.current !== lessonId) {
        completionTrackedRef.current = lessonId;
        onComplete();
      }
    });

    player.on('volumechange', () => {
      localStorage.setItem('plyr-volume', player.volume.toString());
      setVolume(player.volume);
    });

    player.on('ratechange', () => {
      localStorage.setItem('plyr-speed', player.speed.toString());
      setPlaybackSpeed(player.speed);
    });

    player.on('ended', () => {
      if (onComplete) onComplete();
    });
  }, [onProgress, onComplete]);

  if (loading || (!playerReady && !useIframe)) {
    return (
      <div className="aspect-video bg-black/90 rounded-2xl flex flex-col items-center justify-center gap-4 border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-10" />
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <div className="absolute inset-0 blur-xl bg-accent/20 animate-pulse" />
        </div>
        <p className="text-white/40 text-sm font-medium tracking-wide animate-pulse">Initializing Secure Stream...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="aspect-video bg-zinc-950 rounded-2xl flex items-center justify-center border border-white/5 p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Globe className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold text-white">Playback Interrupted</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
            <Button variant="outline" onClick={() => window.location.reload()} className="border-white/10 hover:bg-white/5">
              Retry Connection
            </Button>
            {isGoogleDriveUrl && (
              <Button 
                variant="secondary" 
                onClick={() => window.open(videoPath, '_blank')}
                className="gap-2"
              >
                <Globe className="h-4 w-4" />
                Open on Google Drive
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative group select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* Container with premium styling */}
      <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10 relative">
        {useIframe ? (
          <div className="w-full h-full relative">
            <iframe
              src={videoUrl!}
              className="w-full h-full border-0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              sandbox="allow-scripts allow-same-origin"
            />
            {!iframeMarkedComplete && (
              <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="sm" 
                  className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 shadow-xl"
                  onClick={() => {
                    setIframeMarkedComplete(true);
                    if (onComplete) onComplete();
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Completed
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className={`w-full h-full transition-opacity duration-1000 ${playerReady ? 'opacity-100' : 'opacity-0'}`}
              playsInline
              crossOrigin="anonymous"
            />
            
            {/* Buffering Overlay */}
            <AnimatePresence>
              {isBuffering && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[40] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    <span className="text-xs font-medium text-white/80 tracking-widest uppercase">Buffering</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Volume Badge UI */}
        {showVolumeBadge && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in duration-200">
            <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl">
              <Volume2 className="h-4 w-4 text-accent" />
              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-accent transition-all duration-200" style={{ width: `${volume * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-white min-w-[2.5rem]">{Math.round(volume * 100)}%</span>
            </div>
          </div>
        )}

        {/* Content Protection Watermark */}
        {user && !isAdmin && (
          <div className="absolute inset-0 pointer-events-none z-[50] overflow-hidden mix-blend-overlay">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] select-none">
              <div className="text-white text-2xl font-mono rotate-[-25deg] animate-[watermark_25s_infinite_linear] whitespace-nowrap">
                {user.email} &bull; SECURE STREAM &bull; {user.id.slice(0, 8)} &bull; {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes watermark {
          0% { transform: rotate(-25deg) translate(-30%, -30%); }
          25% { transform: rotate(-25deg) translate(30%, -10%); }
          50% { transform: rotate(-25deg) translate(10%, 30%); }
          75% { transform: rotate(-25deg) translate(-10%, 10%); }
          100% { transform: rotate(-25deg) translate(-30%, -30%); }
        }
        .plyr--full-ui { --plyr-color-main: #c45a32; }
        .plyr__video-wrapper { background: #000; }
        .plyr--video .plyr__controls {
          background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.85));
          padding-top: 40px;
          opacity: ${playerReady ? 1 : 0};
          transition: opacity 0.5s ease;
        }
        .plyr__control--overlaid { background: rgba(196, 90, 50, 0.95); box-shadow: 0 0 20px rgba(196, 90, 50, 0.3); }
        .plyr__control:hover { background: rgba(196, 90, 50, 1) !important; }
        .plyr--video.plyr--hide-controls .plyr__controls { transform: translateY(100%); }
        .plyr__menu__container { background: rgba(10, 10, 10, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; }
        .plyr--loading .plyr__poster { opacity: 0 !important; }
      `}</style>
    </div>
  );
}

function toGoogleDriveEmbed(url: string): string {
  let embedUrl = url;
  if (!embedUrl.endsWith('/preview')) {
    embedUrl = embedUrl.replace(/\/(view|edit)(\?.*)?$/, '/preview');
    if (!embedUrl.endsWith('/preview')) {
      const match = embedUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match) embedUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }
  return embedUrl;
}


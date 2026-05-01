import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, Play, Settings, SkipForward, SkipBack, Maximize, Volume2, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNetworkSpeed } from '@/hooks/useNetworkSpeed';

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
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [useIframe, setUseIframe] = useState(false);
  const [iframeMarkedComplete, setIframeMarkedComplete] = useState(false);
  const [iframeWatchTime, setIframeWatchTime] = useState(0);
  
  const { user, session, isAdmin } = useAuth();
  const { isSlow } = useNetworkSpeed();

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

  // Fetch Video Logic
  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        setLoading(true);
        setError(null);
        setUseIframe(false);

        if (!videoPath) {
          setVideoUrl(null);
          setError('No video available for this lesson.');
          return;
        }

        // LuluStream: always iframe
        if (isLuluStreamUrl) {
          setVideoUrl(videoPath);
          setUseIframe(true);
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
                return;
              }
            } catch (err) {
              console.warn('Proxy failed, falling back to embed');
            }
          }
          setVideoUrl(toGoogleDriveEmbed(videoPath));
          setUseIframe(true);
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
          return;
        }

        setError('Please sign in to watch this lesson.');
      } catch (err: any) {
        setError(err.message || 'Failed to load video');
      } finally {
        setLoading(false);
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
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
        quality: { default: isSlow ? 480 : 1080, options: [4320, 2160, 1440, 1080, 720, 576, 480, 360, 240] },
        tooltips: { controls: true, seek: true },
        keyboard: { focused: true, global: true },
        // Custom branding
        i18n: { speed: 'Speed', quality: 'Quality' },
      };

      if (isHls && window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          playerRef.current = new window.Plyr(video, plyrOptions);
        });
      } else {
        playerRef.current = new window.Plyr(video, plyrOptions);
      }

      // Restore position
      if (initialPosition > 0) {
        video.currentTime = initialPosition;
      }
    };

    // Check if libraries are loaded (CDN scripts)
    if (window.Plyr) {
      setupPlayer();
    } else {
      const interval = setInterval(() => {
        if (window.Plyr) {
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

  // Handle events
  useEffect(() => {
    if (!playerRef.current) return;
    const player = playerRef.current;

    player.on('timeupdate', () => {
      const current = player.currentTime;
      const total = player.duration;
      if (onProgress && total > 0) onProgress((current / total) * 100, current);
      if (onComplete && total > 0 && current / total >= 0.95) onComplete();
    });

    player.on('ended', () => {
      if (onComplete) onComplete();
    });
  }, [onProgress, onComplete]);

  if (loading) {
    return (
      <div className="aspect-video bg-black/90 rounded-2xl flex flex-col items-center justify-center gap-4 border border-white/5 shadow-2xl">
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
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-2 border-white/10 hover:bg-white/5">
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative group">
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
          <video
            ref={videoRef}
            className="w-full h-full"
            playsInline
            crossOrigin="anonymous"
          />
        )}

        {/* Content Protection Watermark */}
        {user && !isAdmin && (
          <div className="absolute inset-0 pointer-events-none z-[50] overflow-hidden mix-blend-overlay">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] select-none">
              <div className="text-white text-3xl font-mono rotate-[-35deg] animate-[watermark_20s_infinite_linear]">
                {user.email} &bull; {user.id.slice(0, 8)}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes watermark {
          0% { transform: rotate(-35deg) translate(-20%, -20%); }
          50% { transform: rotate(-35deg) translate(20%, 20%); }
          100% { transform: rotate(-35deg) translate(-20%, -20%); }
        }
        .plyr--full-ui { --plyr-color-main: #c45a32; }
        .plyr__video-wrapper { background: #000; }
        .plyr--video .plyr__controls {
          background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7));
          padding-top: 40px;
        }
        .plyr__control--overlaid { background: rgba(196, 90, 50, 0.9); }
        .plyr__control:hover { background: rgba(196, 90, 50, 1) !important; }
        .plyr--video.plyr--hide-controls .plyr__controls { transform: translateY(100%); }
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


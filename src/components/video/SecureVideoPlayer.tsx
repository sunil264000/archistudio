import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Shield, Settings } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SecureVideoPlayerProps {
  lessonId: string;
  videoPath: string;
  onProgress?: (progress: number, currentTime: number) => void;
  onComplete?: () => void;
  initialPosition?: number;
  /**
   * If true, allows embedding external video URLs (e.g., Google Drive iframe).
   * WARNING: external hosts can be captured by download extensions.
   */
  allowExternal?: boolean;
}

type QualityMode = 'auto' | 'hd' | 'sd';

// Check if mobile device
const isMobileDevice = () => {
  return window.innerWidth < 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export function SecureVideoPlayer({ 
  lessonId, 
  videoPath, 
  onProgress,
  onComplete,
  initialPosition = 0,
  allowExternal = false,
}: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 50, y: 50 });
  const [qualityMode, setQualityMode] = useState<QualityMode>('auto');
  const [hasAppliedInitialPosition, setHasAppliedInitialPosition] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPreviewTime, setSeekPreviewTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile] = useState(isMobileDevice);
  const isSeekingRef = useRef(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const watermarkIntervalRef = useRef<NodeJS.Timeout>();
  const urlFetchedRef = useRef<string | null>(null);
  const { user, session } = useAuth();

  // Keep actual stream URL off the DOM attribute as much as possible.
  // (Still not DRM; but removes easy link-copy from Elements pane.)
  useEffect(() => {
    if (!videoRef.current) return;
    if (!videoUrl) return;
    try {
      videoRef.current.src = videoUrl;
      videoRef.current.load();
    } catch {
      // ignore
    }
  }, [videoUrl]);

  const isExternalUrl = (url: string) => /^https?:\/\//i.test(url);
  const isGoogleDriveUrl = (url: string) =>
    /drive\.google\.com|docs\.google\.com/i.test(url);
  const isGoogleDrivePreview = (url: string) =>
    /drive\.google\.com\/file\/d\/.+\/preview/i.test(url);
  const isGoogleDriveView = (url: string) =>
    /drive\.google\.com\/file\/d\/.+\/view/i.test(url);

  // Convert Google Drive view URL to preview URL (for fallback iframe)
  const convertToPreviewUrl = (url: string): string => {
    return url.replace('/view', '/preview');
  };

  // Get iframe URL for SD mode
  const getIframeUrl = useCallback((path: string): string => {
    if (isGoogleDriveView(path)) {
      return convertToPreviewUrl(path);
    } else if (isGoogleDrivePreview(path)) {
      return path;
    }
    const fileIdMatch = path.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
    return path;
  }, []);

  // Flag to track if we're using proxy streaming for Google Drive
  const [useProxyForGDrive, setUseProxyForGDrive] = useState(true);

  // Move watermark randomly to make it harder to crop out
  useEffect(() => {
    watermarkIntervalRef.current = setInterval(() => {
      setWatermarkPosition({
        x: 10 + Math.random() * 80, // 10% to 90%
        y: 10 + Math.random() * 80,
      });
    }, 8000); // Move every 8 seconds

    return () => {
      if (watermarkIntervalRef.current) {
        clearInterval(watermarkIntervalRef.current);
      }
    };
  }, []);

  // Generate secure streaming URL through our proxy (ticket-based, no access token in URL)
  const generateStreamingUrl = async (path: string): Promise<string | null> => {
    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const randomSalt = Math.random().toString(36).substring(7);

      // Use the real logged-in session token (never let this fall back to anon).
      let accessToken = session?.access_token;
      if (!accessToken && user) {
        await supabase.auth.refreshSession().catch(() => undefined);
        const { data: { session: refreshed } } = await supabase.auth.getSession();
        accessToken = refreshed?.access_token;
      }

      if (!accessToken) return null;

      const { data, error: ticketError } = await supabase.functions.invoke('mint-video-ticket', {
        body: { lessonId, videoPath: path },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (ticketError) throw ticketError;
      if (!data?.ticket) throw new Error('Could not mint video ticket');
      
      // Build secure URL with ticket, lesson, path, and cache-buster
      const params = new URLSearchParams({
        ticket: data.ticket,
        l: lessonId,
        p: path,
        _: randomSalt, // Cache buster
      });

      return `${baseUrl}/functions/v1/stream-video?${params.toString()}`;
    } catch (err) {
      console.error('Failed to generate streaming URL:', err);
      return null;
    }
  };

  // NOTE: Decoy prefetch links removed.
  // They can confuse some browsers / network stacks and do not materially improve security.

  useEffect(() => {
    // Prevent re-fetching if we already have the URL for this videoPath
    // This fixes the tab-switch refresh issue
    if (urlFetchedRef.current === videoPath && videoUrl) {
      setLoading(false);
      return;
    }

    // Handle quality mode changes for Google Drive
    if (videoPath && isGoogleDriveUrl(videoPath)) {
      // If user selected SD mode, use iframe directly
      if (qualityMode === 'sd') {
        setUseProxyForGDrive(false);
        setVideoUrl(getIframeUrl(videoPath));
        setLoading(false);
        urlFetchedRef.current = videoPath;
        return;
      }

      const fetchGoogleDriveStream = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Generate proxy streaming URL that will fetch from Google Drive at full quality
          const streamUrl = await generateStreamingUrl(videoPath);
          
          if (streamUrl) {
            setVideoUrl(streamUrl);
            setUseProxyForGDrive(true);
            urlFetchedRef.current = videoPath;
          } else {
            // Fallback to iframe embed if proxy fails (lower quality)
            console.warn('Proxy streaming unavailable, falling back to iframe embed');
            setUseProxyForGDrive(false);
            setVideoUrl(getIframeUrl(videoPath));
            urlFetchedRef.current = videoPath;
          }
        } catch (err: any) {
          console.error('Error setting up Google Drive stream:', err);
          // Fallback to iframe
          setUseProxyForGDrive(false);
          setVideoUrl(getIframeUrl(videoPath));
          urlFetchedRef.current = videoPath;
        } finally {
          setLoading(false);
        }
      };

      fetchGoogleDriveStream();
      return;
    }

    // Handle other external URLs (non-Google Drive)
    if (videoPath && isExternalUrl(videoPath) && !isGoogleDriveUrl(videoPath)) {
      if (!allowExternal) {
        setError(
          'This lesson video is hosted externally and cannot be fully protected. Please upload it to secure storage to disable download extensions.'
        );
        setVideoUrl(null);
        setLoading(false);
        return;
      }

      setError(null);
      setVideoUrl(videoPath);
      setLoading(false);
      urlFetchedRef.current = videoPath;
      return;
    }

    // For internal videos, use streaming proxy
    const fetchStreamingUrl = async () => {
      try {
        setLoading(true);
        setError(null);

        const streamUrl = await generateStreamingUrl(videoPath);
        
        if (!streamUrl) {
          // Fallback to signed URL approach
          const { data, error: fnError } = await supabase.functions.invoke('get-video-url', {
            body: { lessonId, videoPath },
          });

          if (fnError) throw fnError;
          if (!data?.signedUrl) throw new Error('Could not get video URL');

          setVideoUrl(data.signedUrl);
        } else {
          setVideoUrl(streamUrl);
        }
        urlFetchedRef.current = videoPath;
      } catch (err: any) {
        console.error('Error fetching video URL:', err);
        setError(err.message || 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    if (videoPath) {
      fetchStreamingUrl();
    }
  }, [lessonId, videoPath, allowExternal, qualityMode, getIframeUrl, user?.id]);

  // Apply initial position when video is ready - only once
  useEffect(() => {
    if (videoRef.current && videoUrl && initialPosition > 0 && !hasAppliedInitialPosition) {
      const applyInitialPosition = () => {
        if (videoRef.current && videoRef.current.readyState >= 1) {
          videoRef.current.currentTime = initialPosition;
          setHasAppliedInitialPosition(true);
        }
      };
      
      // Try immediately if ready
      applyInitialPosition();
      
      // Also listen for loadedmetadata in case video isn't ready yet
      const video = videoRef.current;
      video.addEventListener('loadedmetadata', applyInitialPosition);
      return () => video.removeEventListener('loadedmetadata', applyInitialPosition);
    }
  }, [videoUrl, initialPosition, hasAppliedInitialPosition]);

  // Reset applied position flag when lesson changes
  useEffect(() => {
    setHasAppliedInitialPosition(false);
  }, [lessonId]);

  // Disable right-click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('contextmenu', handleContextMenu);
      return () => container.removeEventListener('contextmenu', handleContextMenu);
    }
  }, []);

  // Hide controls after inactivity
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      // While user drags the seek bar, don't fight their UI position.
      if (isSeekingRef.current) return;
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      
      if (onProgress && total > 0) {
        const progress = (current / total) * 100;
        onProgress(progress, current);
      }

      // Mark as complete at 90%
      if (onComplete && total > 0 && current / total >= 0.9) {
        onComplete();
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0];
      setVolume(value[0]);
      setIsMuted(value[0] === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
      setIsFullscreen(isFs);
      
      // Lock orientation on mobile when fullscreen (if supported)
      if (isFs && isMobile) {
        try {
          (screen.orientation as any)?.lock?.('landscape');
        } catch {
          // Orientation lock not supported
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isMobile]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
      } else {
        // Use video element directly on mobile for native fullscreen controls as fallback
        if (isMobile && videoRef.current) {
          if ((videoRef.current as any).webkitEnterFullscreen) {
            // iOS Safari - use native video fullscreen
            (videoRef.current as any).webkitEnterFullscreen();
            return;
          }
        }
        
        // Standard fullscreen API
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          (containerRef.current as any).webkitRequestFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get user identifier for watermark
  const getUserWatermark = () => {
    if (user?.email) {
      // Partially mask the email for privacy but still identifiable
      const [localPart, domain] = user.email.split('@');
      if (localPart.length > 3) {
        return `${localPart.slice(0, 2)}***@${domain}`;
      }
      return user.email;
    }
    return '';
  };

  // External embeds (Google Drive preview iframe) - ONLY used as fallback when proxy fails
  // The proxy streaming gives full 720p/1080p quality, iframe gives 360p
  if (!loading && !error && videoUrl && isGoogleDrivePreview(videoUrl) && !useProxyForGDrive) {
    return (
      <div 
        ref={containerRef} 
        className="relative aspect-video bg-black rounded-lg overflow-hidden"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Invisible overlay to block right-click and prevent download options */}
        <div 
          className="absolute inset-0 z-10"
          style={{ background: 'transparent', pointerEvents: 'none' }}
        />
        <iframe
          title="Lesson video"
          src={`${videoUrl}?modestbranding=1&rel=0`}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation"
          style={{ pointerEvents: 'auto' }}
        />
        
        {/* Moving user watermark - identifies who downloaded if leaked */}
        <div 
          className="absolute text-white/20 text-sm pointer-events-none select-none z-20 font-mono transition-all duration-1000"
          style={{ 
            left: `${watermarkPosition.x}%`, 
            top: `${watermarkPosition.y}%`,
            transform: 'translate(-50%, -50%)',
            textShadow: '0 0 2px rgba(0,0,0,0.5)',
          }}
        >
          {getUserWatermark()}
        </div>

        {/* Corner watermarks */}
        <div className="absolute bottom-2 left-2 text-[10px] text-white/30 pointer-events-none select-none z-20 flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Protected Content
        </div>
        <div className="absolute top-2 right-2 text-white/15 text-xs pointer-events-none select-none z-20">
          Archistudio
        </div>

      </div>
    );
  }

  if (loading) {
    return (
      <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="aspect-video bg-background rounded-lg flex items-center justify-center border">
        <div className="text-center text-foreground px-4">
          <p className="text-destructive mb-2 text-lg font-medium">Video Not Available</p>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {error.includes('Object not found') || error.includes('404') 
              ? 'The video file has not been uploaded yet. Please contact the administrator.' 
              : error}
          </p>
          <p className="text-xs text-muted-foreground">
            If you're the admin, please upload the video in the Admin Panel → Lessons section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black overflow-hidden group video-protected-container ${
        isFullscreen 
          ? 'fixed inset-0 z-[9999] w-screen h-screen' 
          : 'aspect-video rounded-lg'
      }`}
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        // NOTE: we set the src via property (below effect) to reduce DOM attribute exposure.
        // This doesn't make it impossible to discover, but avoids leaking sensitive tokens.
        src={undefined}
        className={`w-full h-full object-contain ${isFullscreen ? '' : ''}`}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
          }
        }}
        onClick={togglePlay}
        playsInline
        webkit-playsinline="true"
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        crossOrigin="anonymous"
      />

      {/* Moving user watermark - identifies who downloaded if leaked */}
      <div 
        className="absolute text-white/15 text-xs sm:text-sm pointer-events-none select-none font-mono transition-all duration-1000"
        style={{ 
          left: `${watermarkPosition.x}%`, 
          top: `${watermarkPosition.y}%`,
          transform: 'translate(-50%, -50%)',
          textShadow: '0 0 2px rgba(0,0,0,0.5)',
        }}
      >
        {getUserWatermark()}
      </div>

      {/* Custom Controls Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ pointerEvents: showControls ? 'auto' : 'none' }}
      >
        {/* Center Play Button - Larger on mobile */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: 'auto' }}>
            <Button
              variant="ghost"
              size="icon"
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 text-white touch-target"
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            >
              <Play className="h-8 w-8 sm:h-10 sm:w-10 fill-current" />
            </Button>
          </div>
        )}

        {/* Bottom Controls - Responsive layout */}
        <div className={`absolute bottom-0 left-0 right-0 p-2 sm:p-4 space-y-2 ${isFullscreen ? 'safe-area-inset pb-safe' : ''}`}>
          {/* Progress Bar - Larger touch target on mobile */}
          <div className="relative group/seek touch-target">
            <Slider
              value={[isSeeking ? seekPreviewTime : currentTime]}
              min={0}
              max={duration || 100}
              step={0.01}
              onValueChange={(value) => {
                if (!duration || duration <= 0) return;
                const newTime = value[0];
                setIsSeeking(true);
                isSeekingRef.current = true;
                setSeekPreviewTime(newTime);
              }}
              onValueCommit={(value) => {
                if (videoRef.current && duration > 0) {
                  const newTime = value[0];
                  videoRef.current.currentTime = newTime;
                  setCurrentTime(newTime);
                }
                setIsSeeking(false);
                isSeekingRef.current = false;
              }}
              className="cursor-pointer [&>span:first-child]:h-2 sm:[&>span:first-child]:h-2 [&>span:first-child]:hover:h-3 [&>span:first-child]:transition-all [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 sm:[&_[role=slider]]:h-4 sm:[&_[role=slider]]:w-4 [&_[role=slider]]:opacity-100 sm:[&_[role=slider]]:opacity-0 sm:[&_[role=slider]]:group-hover/seek:opacity-100 [&_[role=slider]]:transition-opacity"
            />
          </div>

          {/* Control Buttons - Mobile-optimized layout */}
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {/* Left controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 text-white hover:bg-white/20 active:bg-white/30"
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              >
                {isPlaying ? <Pause className="h-4 w-4 sm:h-5 sm:w-5" /> : <Play className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 text-white hover:bg-white/20 active:bg-white/30"
                onClick={(e) => { e.stopPropagation(); skip(-5); }}
              >
                <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 text-white hover:bg-white/20 active:bg-white/30"
                onClick={(e) => { e.stopPropagation(); skip(5); }}
              >
                <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              {/* Volume - Hidden on mobile (use device volume) */}
              <div className="hidden sm:flex items-center gap-2 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>

              {/* Time - Compact on mobile */}
              <span className="text-white text-xs sm:text-sm ml-2 sm:ml-4 whitespace-nowrap">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Quality Selector - Only show for Google Drive videos */}
              {isGoogleDriveUrl(videoPath) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 sm:h-10 sm:w-10 text-white hover:bg-white/20 active:bg-white/30"
                    >
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[120px]">
                    <DropdownMenuItem 
                      onClick={() => {
                        if (qualityMode !== 'auto' && qualityMode !== 'hd') {
                          urlFetchedRef.current = null;
                          setQualityMode('auto');
                        }
                      }}
                      className={qualityMode === 'auto' || qualityMode === 'hd' ? 'bg-muted' : ''}
                    >
                      <span className="flex items-center gap-2">
                        HD (Original)
                        {(qualityMode === 'auto' || qualityMode === 'hd') && <span className="text-xs">✓</span>}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        if (qualityMode !== 'sd') {
                          urlFetchedRef.current = null;
                          setQualityMode('sd');
                        }
                      }}
                      className={qualityMode === 'sd' ? 'bg-muted' : ''}
                    >
                      <span className="flex items-center gap-2">
                        SD (360p)
                        {qualityMode === 'sd' && <span className="text-xs">✓</span>}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Fullscreen toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 text-white hover:bg-white/20 active:bg-white/30"
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              >
                {isFullscreen ? <Minimize className="h-4 w-4 sm:h-5 sm:w-5" /> : <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Corner watermarks */}
      <div className="absolute top-2 left-2 text-white/10 text-[10px] sm:text-xs pointer-events-none select-none flex items-center gap-1">
        <Shield className="h-3 w-3" />
        <span className="hidden sm:inline">Protected</span>
      </div>
      
      {/* Quality indicator badge */}
      {isGoogleDriveUrl(videoPath) && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs pointer-events-none select-none">
          <span
            className={`px-1.5 sm:px-2 py-0.5 rounded ${useProxyForGDrive ? 'bg-success/80 text-success-foreground' : 'bg-warning/80 text-warning-foreground'}`}
          >
            {useProxyForGDrive ? 'HD' : 'SD'}
          </span>
        </div>
      )}
      
      <div className="absolute top-2 right-2 text-white/10 text-[10px] sm:text-xs pointer-events-none select-none">
        Archistudio
      </div>
    </div>
  );
}

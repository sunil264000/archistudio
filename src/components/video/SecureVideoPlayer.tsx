import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Shield } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

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
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const watermarkIntervalRef = useRef<NodeJS.Timeout>();
  const { user } = useAuth();

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

  // Generate secure streaming URL through our proxy
  const generateStreamingUrl = async (path: string): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return null;

      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const timestamp = Date.now();
      const randomSalt = Math.random().toString(36).substring(7);
      
      // Build secure URL with token, lesson, path, and timestamp
      const params = new URLSearchParams({
        t: session.access_token,
        l: lessonId,
        p: path,
        ts: timestamp.toString(),
        _: randomSalt, // Cache buster
      });

      return `${baseUrl}/functions/v1/stream-video?${params.toString()}`;
    } catch (err) {
      console.error('Failed to generate streaming URL:', err);
      return null;
    }
  };

  // Generate decoy URLs to confuse download managers
  const generateDecoyUrls = () => {
    const decoys = [];
    for (let i = 0; i < 5; i++) {
      const fakeToken = Math.random().toString(36).substring(2, 15);
      const fakeTimestamp = Date.now() - Math.floor(Math.random() * 10000);
      decoys.push(`https://decoy-${i}.invalid/video?t=${fakeToken}&ts=${fakeTimestamp}`);
    }
    // Add decoy link elements to DOM (these will fail to download but confuse sniffers)
    decoys.forEach((url, i) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.id = `decoy-${i}`;
      document.head.appendChild(link);
    });
  };

  // Clean up decoy URLs
  const cleanupDecoys = () => {
    for (let i = 0; i < 5; i++) {
      const decoy = document.getElementById(`decoy-${i}`);
      if (decoy) decoy.remove();
    }
  };

  useEffect(() => {
    generateDecoyUrls();
    return () => cleanupDecoys();
  }, []);

  useEffect(() => {
    // For Google Drive URLs, route through our streaming proxy for full quality
    if (videoPath && isGoogleDriveUrl(videoPath)) {
      const fetchGoogleDriveStream = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Generate proxy streaming URL that will fetch from Google Drive at full quality
          const streamUrl = await generateStreamingUrl(videoPath);
          
          if (streamUrl) {
            setVideoUrl(streamUrl);
            setUseProxyForGDrive(true);
          } else {
            // Fallback to iframe embed if proxy fails (lower quality)
            console.warn('Proxy streaming unavailable, falling back to iframe embed');
            setUseProxyForGDrive(false);
            let finalUrl = videoPath;
            if (isGoogleDriveView(videoPath)) {
              finalUrl = convertToPreviewUrl(videoPath);
            } else if (!isGoogleDrivePreview(videoPath)) {
              // Convert to preview URL format
              const fileIdMatch = videoPath.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
              if (fileIdMatch) {
                finalUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
              }
            }
            setVideoUrl(finalUrl);
          }
        } catch (err: any) {
          console.error('Error setting up Google Drive stream:', err);
          // Fallback to iframe
          setUseProxyForGDrive(false);
          let finalUrl = videoPath;
          if (isGoogleDriveView(videoPath)) {
            finalUrl = convertToPreviewUrl(videoPath);
          }
          setVideoUrl(finalUrl);
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
  }, [lessonId, videoPath, allowExternal]);

  useEffect(() => {
    if (videoRef.current && videoUrl && initialPosition > 0) {
      videoRef.current.currentTime = initialPosition;
    }
  }, [videoUrl, initialPosition]);

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

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
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
          Concrete Logic
        </div>

        {/* Notice for embedded videos - lower quality */}
        <div className="absolute bottom-12 left-0 right-0 text-center">
          <span className="text-[10px] text-white/40 bg-black/40 px-2 py-1 rounded">
            Embedded video (360p quality - progress tracking limited)
          </span>
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
      <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
        <div className="text-center text-white px-4">
          <p className="text-red-400 mb-2 text-lg font-medium">Video Not Available</p>
          <p className="text-sm text-gray-400 mb-4 max-w-md">
            {error.includes('Object not found') || error.includes('404') 
              ? 'The video file has not been uploaded yet. Please contact the administrator.' 
              : error}
          </p>
          <p className="text-xs text-gray-500">
            If you're the admin, please upload the video in the Admin Panel → Lessons section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl || undefined}
        className="w-full h-full"
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
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        crossOrigin="anonymous"
      />

      {/* Moving user watermark - identifies who downloaded if leaked */}
      <div 
        className="absolute text-white/15 text-sm pointer-events-none select-none font-mono transition-all duration-1000"
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
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Center Play Button */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-20 w-20 rounded-full bg-white/20 hover:bg-white/30 text-white"
              onClick={togglePlay}
            >
              <Play className="h-10 w-10 fill-current" />
            </Button>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Progress Bar */}
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => skip(-10)}
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => skip(10)}
              >
                <SkipForward className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-2 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={toggleMute}
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

              <span className="text-white text-sm ml-4">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Corner watermarks */}
      <div className="absolute top-2 left-2 text-white/10 text-xs pointer-events-none select-none flex items-center gap-1">
        <Shield className="h-3 w-3" />
        Protected
      </div>
      <div className="absolute top-2 right-2 text-white/10 text-xs pointer-events-none select-none">
        Concrete Logic
      </div>
    </div>
  );
}

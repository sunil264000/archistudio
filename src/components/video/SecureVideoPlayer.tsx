import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SecureVideoPlayerProps {
  lessonId: string;
  videoPath: string;
  isFreePreview?: boolean;
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
  isFreePreview = false,
  onProgress,
  onComplete,
  initialPosition = 0,
  allowExternal = false,
}: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [hasAppliedInitialPosition, setHasAppliedInitialPosition] = useState(false);
  const { user, session } = useAuth();

  const isExternalUrl = useMemo(() => /^https?:\/\//i.test(videoPath || ''), [videoPath]);
  const isGoogleDriveUrl = useMemo(
    () => /drive\.google\.com|docs\.google\.com/i.test(videoPath || ''),
    [videoPath],
  );
  const isLuluStreamUrl = useMemo(
    () => /lulustream\.com/i.test(videoPath || ''),
    [videoPath],
  );

  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!videoPath) {
          setVideoUrl(null);
          setError('No video available for this lesson.');
          return;
        }

        // External hosts: only allow if explicitly enabled.
        if (isExternalUrl) {
          // LuluStream embed URLs — always allow, render as iframe
          if (isLuluStreamUrl) {
            setVideoUrl(videoPath);
            return;
          }

          if (!allowExternal) {
            setVideoUrl(null);
            setError('This video is hosted externally and is disabled for this lesson.');
            return;
          }

          // Google Drive “view” links are not directly playable by <video>.
          // Use the existing HD streaming proxy for Drive links.
          if (isGoogleDriveUrl) {
            const baseUrl = import.meta.env.VITE_SUPABASE_URL;

            if (user) {
              let accessToken = session?.access_token;
              if (!accessToken) {
                await supabase.auth.refreshSession().catch(() => undefined);
                const { data: { session: refreshed } } = await supabase.auth.getSession();
                accessToken = refreshed?.access_token;
              }
              if (!accessToken) throw new Error('Please sign in again to continue.');

              const { data, error: ticketError } = await supabase.functions.invoke('mint-video-ticket', {
                body: { lessonId, videoPath },
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (ticketError) throw ticketError;
              if (!data?.ticket) throw new Error('Could not start video stream');

              const params = new URLSearchParams({
                ticket: data.ticket,
                l: lessonId,
                p: videoPath,
                _: Math.random().toString(36).slice(2),
              });
              setVideoUrl(`${baseUrl}/functions/v1/stream-video?${params.toString()}`);
              return;
            }

            if (isFreePreview) {
              const { data, error: ticketError } = await supabase.functions.invoke(
                'mint-video-ticket-public',
                { body: { lessonId, videoPath } },
              );
              if (ticketError) throw ticketError;
              if (!data?.ticket) throw new Error('Could not start preview stream');

              const params = new URLSearchParams({
                ticket: data.ticket,
                l: lessonId,
                p: videoPath,
                _: Math.random().toString(36).slice(2),
              });
              setVideoUrl(`${baseUrl}/functions/v1/stream-video?${params.toString()}`);
              return;
            }

            setVideoUrl(null);
            setError('Please sign in and enroll to watch this lesson.');
            return;
          }

          // Other external URLs can be played directly.
          setVideoUrl(videoPath);
          return;
        }

        // Signed URL flow (normal HTML5 video, no proxy/protection)
        if (user) {
          let accessToken = session?.access_token;
          if (!accessToken) {
            await supabase.auth.refreshSession().catch(() => undefined);
            const { data: { session: refreshed } } = await supabase.auth.getSession();
            accessToken = refreshed?.access_token;
          }

          if (!accessToken) throw new Error('Please sign in again to continue.');

          const { data, error: fnError } = await supabase.functions.invoke('get-video-url', {
            body: { lessonId, videoPath },
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (fnError) throw fnError;
          if (!data?.signedUrl) throw new Error('Could not get video URL');
          setVideoUrl(data.signedUrl);
          return;
        }

        if (isFreePreview) {
          const { data, error: fnError } = await supabase.functions.invoke('get-video-url-public', {
            body: { lessonId, videoPath },
          });
          if (fnError) throw fnError;
          if (!data?.signedUrl) throw new Error('Could not get preview video URL');
          setVideoUrl(data.signedUrl);
          return;
        }

        setVideoUrl(null);
        setError('Please sign in and enroll to watch this lesson.');
      } catch (err: any) {
        console.error('Error fetching video URL:', err);
        setError(err.message || 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoUrl();
  }, [lessonId, videoPath, allowExternal, isExternalUrl, user?.id, session?.access_token, isFreePreview]);

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

  // LuluStream: render as iframe embed
  if (isLuluStreamUrl && videoUrl) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          src={videoUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>
    );
  }

  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={videoUrl ?? undefined}
        className="w-full h-full object-contain"
        controls
        controlsList="nodownload"
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (!v) return;
          const total = v.duration || 0;
          const current = v.currentTime || 0;
          if (onProgress && total > 0) onProgress((current / total) * 100, current);
          if (onComplete && total > 0 && current / total >= 0.9) onComplete();
        }}
      />
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

// Royalty-free ambient music from Pixabay
const AMBIENT_AUDIO_URL = "https://cdn.pixabay.com/audio/2022/03/10/audio_50a3d1f86b.mp3";

export function AmbientAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(30);
  const [showControls, setShowControls] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    const audio = new Audio();
    audio.src = AMBIENT_AUDIO_URL;
    audio.loop = true;
    audio.volume = volume / 100;
    audio.preload = 'auto';
    
    audio.oncanplaythrough = () => {
      setIsLoaded(true);
      setHasError(false);
    };
    
    audio.onerror = () => {
      console.error('Audio failed to load');
      setHasError(true);
      setIsLoaded(false);
    };
    
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const togglePlay = async () => {
    if (!audioRef.current || hasError) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Audio playback failed:', err);
      setHasError(true);
    }
  };

  // Don't show if audio failed to load
  if (hasError) return null;

  return (
    <div 
      className="fixed bottom-6 right-6 z-[9999]"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="flex items-center gap-2">
        {showControls && isPlaying && (
          <div className="flex items-center gap-2 px-3 py-2 bg-card/95 backdrop-blur-md rounded-full border shadow-xl animate-fade-in">
            <Slider
              value={[volume]}
              onValueChange={([v]) => setVolume(v)}
              max={100}
              step={1}
              className="w-24"
            />
            <span className="text-xs text-muted-foreground font-medium w-8">{volume}%</span>
          </div>
        )}
        
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlay}
          disabled={!isLoaded}
          className={`h-12 w-12 rounded-full shadow-2xl transition-all duration-300 border-2 ${
            isPlaying 
              ? 'bg-accent text-accent-foreground border-accent hover:bg-accent/90 animate-pulse' 
              : 'bg-card text-foreground border-border hover:bg-muted hover:scale-110'
          } ${!isLoaded ? 'opacity-50' : ''}`}
          title={isPlaying ? 'Pause ambient music' : 'Play ambient music'}
        >
          {isPlaying ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <Music className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {!isLoaded && !hasError && (
        <p className="text-[10px] text-muted-foreground mt-1 text-center">
          Loading...
        </p>
      )}
      
      {isPlaying && (
        <p className="text-[10px] font-medium text-accent mt-1 text-center">
          🎵 Ambient
        </p>
      )}
    </div>
  );
}

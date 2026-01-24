import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const AMBIENT_AUDIO_URL = "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3";

export function AmbientAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(20);
  const [showControls, setShowControls] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio(AMBIENT_AUDIO_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = volume / 100;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
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
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (err) {
      console.log('Audio playback failed:', err);
    }
  };

  return (
    <div 
      className="fixed bottom-20 left-4 z-50"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlay}
          className={`h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border-border/50 shadow-lg transition-all duration-300 ${
            isPlaying ? 'text-accent border-accent/50' : 'text-muted-foreground'
          }`}
          title={isPlaying ? 'Pause ambient music' : 'Play ambient music'}
        >
          {isPlaying ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </Button>
        
        {showControls && isPlaying && (
          <div className="flex items-center gap-2 px-3 py-2 bg-background/90 backdrop-blur-sm rounded-full border border-border/50 shadow-lg animate-fade-in">
            <Slider
              value={[volume]}
              onValueChange={([v]) => setVolume(v)}
              max={100}
              step={1}
              className="w-20"
            />
            <span className="text-xs text-muted-foreground w-8">{volume}%</span>
          </div>
        )}
      </div>
      
      {isPlaying && (
        <p className="text-[10px] text-muted-foreground mt-1 text-center animate-pulse">
          🎵 Ambient
        </p>
      )}
    </div>
  );
}

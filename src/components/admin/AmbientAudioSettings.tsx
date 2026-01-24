import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Music, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function AmbientAudioSettings() {
  const [audioUrl, setAudioUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSetting();
  }, []);

  const fetchSetting = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'ambient_audio_url')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data?.value) {
        setAudioUrl(data.value);
      }
    } catch (error) {
      console.error('Error fetching audio setting:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertYouTubeToAudio = (url: string): string => {
    // Extract video ID from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        // Use a reliable YouTube audio proxy service
        // Note: This uses a public API - for production, consider self-hosting
        return `https://yt-audio-api.netlify.app/audio/${match[1]}`;
      }
    }
    
    // Return as-is if it's already a direct audio URL
    return url;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'ambient_audio_url',
          value: audioUrl,
          description: 'YouTube URL or direct audio URL for ambient background music',
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;
      toast.success('Ambient audio URL saved successfully!');
    } catch (error) {
      console.error('Error saving audio setting:', error);
      toast.error('Failed to save audio URL');
    } finally {
      setSaving(false);
    }
  };

  const isYouTubeUrl = (url: string) => {
    return /youtube\.com|youtu\.be/.test(url);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Ambient Audio Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-10 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Ambient Audio Settings
        </CardTitle>
        <CardDescription>
          Configure background music for your website. Supports YouTube links or direct MP3 URLs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="audio-url">Audio URL (YouTube or Direct MP3)</Label>
          <Input
            id="audio-url"
            placeholder="https://youtube.com/watch?v=... or https://example.com/audio.mp3"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
          />
        </div>

        {audioUrl && (
          <div className="flex items-center gap-2 text-sm">
            {isYouTubeUrl(audioUrl) ? (
              <>
                <AlertCircle className="h-4 w-4 text-warning" />
                <span className="text-muted-foreground">
                  YouTube URL detected. Audio will be extracted automatically.
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-muted-foreground">
                  Direct audio URL detected.
                </span>
              </>
            )}
          </div>
        )}

        <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
          <strong>Tips:</strong>
          <ul className="list-disc ml-4 mt-1 space-y-1">
            <li>Use royalty-free music to avoid copyright issues</li>
            <li>Shorter loops (2-5 minutes) work best for ambient audio</li>
            <li>Direct MP3 URLs are more reliable than YouTube links</li>
            <li>Free sources: Pixabay, Mixkit, Freesound</li>
          </ul>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Audio URL'}
        </Button>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AtSign, Check, X, Loader2 } from 'lucide-react';

export function UsernameSetup() {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!user) return;
    supabase
      .from('usernames')
      .select('username')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCurrentUsername(data.username);
          setUsername(data.username);
        }
      });
  }, [user]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const val = username.toLowerCase().trim();
    if (val.length < 3 || val === currentUsername) { setAvailable(null); return; }
    if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(val)) { setAvailable(false); return; }

    setChecking(true);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('usernames')
        .select('id')
        .eq('username', val)
        .maybeSingle();
      setAvailable(!data);
      setChecking(false);
    }, 400);
  }, [username, currentUsername]);

  const handleSave = async () => {
    if (!user || !available) return;
    setSaving(true);
    const val = username.toLowerCase().trim();

    if (currentUsername) {
      const { error } = await supabase
        .from('usernames')
        .update({ username: val, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (error) { toast.error(error.message.includes('username_format') ? 'Invalid username format' : 'Username taken'); }
      else { setCurrentUsername(val); toast.success('Username updated!'); }
    } else {
      const { error } = await supabase
        .from('usernames')
        .insert({ user_id: user.id, username: val });
      if (error) { toast.error(error.message.includes('username_format') ? 'Invalid username format' : 'Username taken'); }
      else { setCurrentUsername(val); toast.success('Username claimed!'); }
    }
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-1.5">
        <AtSign className="h-3.5 w-3.5" /> Username
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
            placeholder="your-username"
            maxLength={30}
            className="bg-background pr-8"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {checking ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : available === true ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : available === false ? (
              <X className="h-3.5 w-3.5 text-destructive" />
            ) : null}
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!available || saving || username === currentUsername}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : currentUsername ? 'Update' : 'Claim'}
        </Button>
      </div>
      {currentUsername && (
        <p className="text-xs text-muted-foreground">
          Your profile: archistudio.lovable.app/u/{currentUsername}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Lowercase letters, numbers, dots, hyphens. 3-30 characters.
      </p>
    </div>
  );
}

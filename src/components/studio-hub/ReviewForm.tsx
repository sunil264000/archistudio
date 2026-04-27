// Reusable star-rating leaver — shown on completed contracts.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Props {
  contractId: string;
  reviewerId: string;
  revieweeId: string;
  direction: 'client_to_worker' | 'worker_to_client';
}

export function ReviewForm({ contractId, reviewerId, revieweeId, direction }: Props) {
  const [existing, setExisting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('marketplace_reviews')
        .select('*')
        .eq('contract_id', contractId)
        .eq('direction', direction)
        .maybeSingle();
      setExisting(data);
      setLoading(false);
    })();
  }, [contractId, direction]);

  const submit = async () => {
    if (rating < 1) { toast.error('Pick a rating from 1 to 5'); return; }
    setSaving(true);
    const { error } = await (supabase as any).from('marketplace_reviews').insert({
      contract_id: contractId,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      direction,
      rating,
      comment: comment.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Thanks for the review!');
    setExisting({ rating, comment, created_at: new Date().toISOString() });
  };

  if (loading) return null;

  if (existing) {
    return (
      <div className="border border-border/40 rounded-2xl p-6 bg-muted/20">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-4 w-4 text-accent" />
          <p className="text-sm font-medium">You left a review</p>
        </div>
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < existing.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
          ))}
        </div>
        {existing.comment && <p className="text-sm text-muted-foreground italic">"{existing.comment}"</p>}
      </div>
    );
  }

  return (
    <div className="border border-border/40 rounded-2xl p-6">
      <p className="font-medium mb-1">{direction === 'client_to_worker' ? 'Rate your Studio Member' : 'Rate this client'}</p>
      <p className="text-xs text-muted-foreground mb-4">Helps the community trust the right people.</p>

      <div className="flex items-center gap-1 mb-4">
        {[1,2,3,4,5].map((n) => (
          <motion.button
            key={n}
            type="button"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="p-1"
            aria-label={`${n} star`}
          >
            <Star className={`h-7 w-7 transition-colors ${
              (hover || rating) >= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
            }`} />
          </motion.button>
        ))}
      </div>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tell others what made this great…"
        rows={3}
        maxLength={1000}
        className="rounded-xl mb-3"
      />
      <Button onClick={submit} disabled={saving} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Submit review
      </Button>
    </div>
  );
}

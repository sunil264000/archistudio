import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface Annotation {
  id: string;
  x_percent: number;
  y_percent: number;
  message: string;
  user_id: string;
  is_resolved: boolean;
  created_at: string;
  parent_id: string | null;
  author_name?: string;
}

interface SheetAnnotationLayerProps {
  sheetId: string;
  annotations: Annotation[];
  onAnnotationAdded: () => void;
  enabled?: boolean;
  children?: React.ReactNode;
}

export function SheetAnnotationLayer({ sheetId, annotations, onAnnotationAdded, enabled = true }: SheetAnnotationLayerProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [placingMode, setPlacingMode] = useState(false);
  const [newPin, setNewPin] = useState<{ x: number; y: number } | null>(null);
  const [message, setMessage] = useState('');
  const [activePin, setActivePin] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!placingMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setNewPin({ x, y });
  }, [placingMode]);

  const submitAnnotation = async () => {
    if (!user || !newPin || !message.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('sheet_annotations' as any).insert({
        sheet_id: sheetId,
        user_id: user.id,
        x_percent: newPin.x,
        y_percent: newPin.y,
        message: message.trim(),
      });
      if (error) throw error;
      toast.success('Annotation added');
      setNewPin(null);
      setMessage('');
      setPlacingMode(false);
      onAnnotationAdded();
    } catch {
      toast.error('Failed to add annotation');
    }
    setSubmitting(false);
  };

  const submitReply = async (parentId: string) => {
    if (!user || !replyText.trim()) return;
    const parent = annotations.find(a => a.id === parentId);
    if (!parent) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('sheet_annotations' as any).insert({
        sheet_id: sheetId,
        user_id: user.id,
        x_percent: parent.x_percent,
        y_percent: parent.y_percent,
        message: replyText.trim(),
        parent_id: parentId,
      });
      if (error) throw error;
      toast.success('Reply added');
      setReplyText('');
      onAnnotationAdded();
    } catch {
      toast.error('Failed to reply');
    }
    setSubmitting(false);
  };

  const toggleResolved = async (id: string, current: boolean) => {
    await supabase.from('sheet_annotations' as any).update({ is_resolved: !current }).eq('id', id);
    onAnnotationAdded();
  };

  const deleteAnnotation = async (id: string) => {
    await supabase.from('sheet_annotations' as any).delete().eq('id', id);
    onAnnotationAdded();
    setActivePin(null);
  };

  const rootAnnotations = annotations.filter(a => !a.parent_id);
  const getReplies = (parentId: string) => annotations.filter(a => a.parent_id === parentId);

  return (
    <div className="relative" ref={containerRef}>
      {/* Toolbar */}
      {enabled && user && (
        <div className="absolute top-3 right-3 z-20 flex gap-2">
          <Button
            size="sm"
            variant={placingMode ? 'default' : 'outline'}
            onClick={() => { setPlacingMode(!placingMode); setNewPin(null); }}
            className="gap-1.5 text-xs shadow-lg backdrop-blur-sm"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {placingMode ? 'Cancel' : 'Add Comment'}
          </Button>
        </div>
      )}

      {/* Click overlay for placing pins */}
      {placingMode && (
        <div
          className="absolute inset-0 z-10 cursor-crosshair"
          onClick={handleImageClick}
        />
      )}

      {/* Existing pins */}
      {rootAnnotations.map((ann) => (
        <div
          key={ann.id}
          className="absolute z-10"
          style={{ left: `${ann.x_percent}%`, top: `${ann.y_percent}%`, transform: 'translate(-50%, -50%)' }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setActivePin(activePin === ann.id ? null : ann.id); }}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-all hover:scale-110 ${
              ann.is_resolved
                ? 'bg-muted text-muted-foreground border border-border'
                : 'bg-accent text-accent-foreground border-2 border-background'
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </button>

          {/* Popover */}
          <AnimatePresence>
            {activePin === ann.id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-8 left-0 w-64 bg-popover border border-border rounded-xl shadow-xl z-30 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{ann.author_name || 'User'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {ann.user_id === user?.id && (
                        <>
                          <button onClick={() => toggleResolved(ann.id, ann.is_resolved)} className="p-1 hover:bg-muted rounded">
                            <CheckCircle className={`h-3.5 w-3.5 ${ann.is_resolved ? 'text-accent' : 'text-muted-foreground'}`} />
                          </button>
                          <button onClick={() => deleteAnnotation(ann.id)} className="p-1 hover:bg-destructive/10 rounded">
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </>
                      )}
                      <button onClick={() => setActivePin(null)} className="p-1 hover:bg-muted rounded">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-foreground">{ann.message}</p>
                  {ann.is_resolved && (
                    <Badge variant="secondary" className="text-[9px]">Resolved</Badge>
                  )}
                </div>

                {/* Replies */}
                {getReplies(ann.id).length > 0 && (
                  <div className="border-t px-3 py-2 space-y-2 bg-muted/30">
                    {getReplies(ann.id).map(reply => (
                      <div key={reply.id} className="text-xs">
                        <span className="font-medium text-foreground">{reply.author_name || 'User'}: </span>
                        <span className="text-muted-foreground">{reply.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input */}
                {user && (
                  <div className="border-t p-2 flex gap-1.5">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Reply..."
                      className="flex-1 text-xs bg-background border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent"
                      onKeyDown={(e) => e.key === 'Enter' && submitReply(ann.id)}
                    />
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => submitReply(ann.id)} disabled={submitting}>
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))

      }

      {/* New pin being placed */}
      {newPin && (
        <div
          className="absolute z-20"
          style={{ left: `${newPin.x}%`, top: `${newPin.y}%`, transform: 'translate(-50%, -100%)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-6 h-6 rounded-full bg-accent border-2 border-background shadow-lg flex items-center justify-center mb-1 mx-auto">
            <MessageCircle className="h-3 w-3 text-accent-foreground" />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-56 bg-popover border border-border rounded-xl shadow-xl p-3 space-y-2"
          >
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add your feedback..."
              className="text-xs min-h-[60px] resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 text-xs h-7" onClick={submitAnnotation} disabled={submitting || !message.trim()}>
                <Send className="h-3 w-3 mr-1" /> Post
              </Button>
              <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { setNewPin(null); setMessage(''); }}>
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

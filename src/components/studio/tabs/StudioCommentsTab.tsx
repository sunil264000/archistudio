import { useState } from 'react';
import { StudioComment } from '@/hooks/useStudioProjects';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface StudioCommentsTabProps {
  comments: StudioComment[];
  onAdd: (content: string) => void;
  isPublic: boolean;
}

export function StudioCommentsTab({ comments, onAdd, isPublic }: StudioCommentsTabProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) return;
    onAdd(content.trim());
    setContent('');
  };

  if (!isPublic) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Lock className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Comments are available for public projects</p>
        <p className="text-sm mt-1">Set your project to public to receive community feedback.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      {user && (
        <div className="flex gap-2">
          <Textarea
            placeholder="Share feedback or suggestions..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            className="flex-1"
          />
          <Button
            onClick={handleSubmit}
            disabled={!content.trim()}
            size="icon"
            className="h-auto bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {comments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No comments yet. Be the first to share feedback!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => (
            <div key={comment.id} className="p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">
                  {(comment.author_name || 'A').charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-foreground">{comment.author_name || 'Anonymous'}</span>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(comment.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

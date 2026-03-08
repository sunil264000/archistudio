import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useSheetDetail } from '@/hooks/useSheetReviews';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, ThumbsUp, Award, MessageSquare, Loader2, Star, Send, Reply } from 'lucide-react';
import { useState } from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import type { SheetCritique } from '@/hooks/useSheetReviews';

export default function SheetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { sheet, critiques, loading, addCritique, toggleUpvote, markBestAnswer } = useSheetDetail(id);
  const [newCritique, setNewCritique] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handlePost = async () => {
    if (!newCritique.trim()) return;
    setPosting(true);
    await addCritique(newCritique.trim());
    setNewCritique('');
    setPosting(false);
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    setPosting(true);
    await addCritique(replyContent.trim(), parentId);
    setReplyContent('');
    setReplyTo(null);
    setPosting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="text-center py-40">
          <p className="text-muted-foreground mb-4">Sheet not found</p>
          <Link to="/sheets"><Button variant="outline">Back to Sheets</Button></Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === sheet.user_id;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${sheet.title} — Sheet Review`}
        description={sheet.description || 'Get architecture presentation critiques'}
        url={`https://archistudio.shop/sheets/${sheet.id}`}
      />
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container-wide max-w-5xl">
          {/* Back */}
          <Button variant="ghost" size="sm" className="mb-6 gap-1" onClick={() => navigate('/sheets')}>
            <ArrowLeft className="h-4 w-4" /> Back to Sheets
          </Button>

          <div className="grid lg:grid-cols-[1fr_400px] gap-8">
            {/* Sheet Image */}
            <div>
              <div className="rounded-xl overflow-hidden border border-border/40 bg-card">
                <img
                  src={sheet.sheet_url}
                  alt={sheet.title}
                  className="w-full object-contain max-h-[80vh]"
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Title & Meta */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={sheet.status === 'open' ? 'default' : 'secondary'}>
                    {sheet.status === 'open' ? 'Open for Critique' : 'Resolved'}
                  </Badge>
                  {sheet.is_featured && (
                    <Badge className="bg-accent text-accent-foreground gap-1">
                      <Star className="h-3 w-3" /> Featured
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-display font-bold">{sheet.title}</h1>
                {sheet.description && (
                  <p className="text-muted-foreground mt-2">{sheet.description}</p>
                )}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={sheet.author_avatar} />
                  <AvatarFallback>{sheet.author_name?.charAt(0) || 'A'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{sheet.author_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(sheet.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {sheet.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {sheet.tags.map(tag => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}

              {/* Critique Form */}
              {user && sheet.status === 'open' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" /> Leave a Critique
                  </h3>
                  <Textarea
                    value={newCritique}
                    onChange={e => setNewCritique(e.target.value)}
                    placeholder="Share your feedback on this sheet..."
                    rows={4}
                  />
                  <Button
                    onClick={handlePost}
                    disabled={!newCritique.trim() || posting}
                    className="w-full gap-2"
                  >
                    {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Post Critique
                  </Button>
                </div>
              )}

              {!user && (
                <Link to="/auth?mode=signup">
                  <Button variant="outline" className="w-full">Sign up to leave critiques</Button>
                </Link>
              )}
            </div>
          </div>

          {/* Critiques Section */}
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Critiques ({critiques.length})
            </h2>

            {critiques.length === 0 ? (
              <div className="text-center py-12 bg-secondary/20 rounded-xl border border-border/30">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No critiques yet. Be the first to share feedback!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {critiques.map(critique => (
                  <CritiqueCard
                    key={critique.id}
                    critique={critique}
                    isOwner={isOwner}
                    isAdmin={isAdmin}
                    user={user}
                    onUpvote={() => toggleUpvote(critique.id, critique.has_upvoted || false)}
                    onMarkBest={() => markBestAnswer(critique.id)}
                    replyTo={replyTo}
                    setReplyTo={setReplyTo}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    onReply={() => handleReply(critique.id)}
                    posting={posting}
                    onUpvoteReply={(id: string, hasUpvoted: boolean) => toggleUpvote(id, hasUpvoted)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function CritiqueCard({
  critique, isOwner, isAdmin, user, onUpvote, onMarkBest,
  replyTo, setReplyTo, replyContent, setReplyContent, onReply, posting, onUpvoteReply,
}: {
  critique: SheetCritique;
  isOwner: boolean;
  isAdmin: boolean;
  user: any;
  onUpvote: () => void;
  onMarkBest: () => void;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  replyContent: string;
  setReplyContent: (s: string) => void;
  onReply: () => void;
  posting: boolean;
  onUpvoteReply: (id: string, hasUpvoted: boolean) => void;
}) {
  return (
    <div className={`rounded-xl border p-4 transition-all ${
      critique.is_best_answer
        ? 'border-accent/60 bg-accent/5 ring-1 ring-accent/20'
        : 'border-border/40 bg-card'
    }`}>
      {critique.is_best_answer && (
        <div className="flex items-center gap-1.5 text-accent text-sm font-medium mb-3">
          <Award className="h-4 w-4" /> Best Critique
        </div>
      )}

      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 mt-0.5">
          <AvatarImage src={critique.author_avatar} />
          <AvatarFallback className="text-xs">{critique.author_name?.charAt(0) || 'A'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{critique.author_name}</span>
            <span className="text-[11px] text-muted-foreground">
              {new Date(critique.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{critique.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-3">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 gap-1 text-xs ${critique.has_upvoted ? 'text-accent' : 'text-muted-foreground'}`}
              onClick={onUpvote}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {critique.upvote_count > 0 && critique.upvote_count}
            </Button>

            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground"
                onClick={() => setReplyTo(replyTo === critique.id ? null : critique.id)}
              >
                <Reply className="h-3.5 w-3.5" /> Reply
              </Button>
            )}

            {(isOwner || isAdmin) && !critique.is_best_answer && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground hover:text-accent"
                onClick={onMarkBest}
              >
                <Award className="h-3.5 w-3.5" /> Mark Best
              </Button>
            )}
          </div>

          {/* Reply form */}
          {replyTo === critique.id && (
            <div className="mt-3 flex gap-2">
              <Textarea
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="text-sm"
              />
              <Button size="sm" onClick={onReply} disabled={!replyContent.trim() || posting}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Replies */}
          {critique.replies && critique.replies.length > 0 && (
            <div className="mt-4 space-y-3 pl-4 border-l-2 border-border/30">
              {critique.replies.map(reply => (
                <div key={reply.id} className="flex items-start gap-2">
                  <Avatar className="h-6 w-6 mt-0.5">
                    <AvatarImage src={reply.author_avatar} />
                    <AvatarFallback className="text-[10px]">{reply.author_name?.charAt(0) || 'A'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium">{reply.author_name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(reply.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80">{reply.content}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 gap-1 text-[10px] mt-1 ${reply.has_upvoted ? 'text-accent' : 'text-muted-foreground'}`}
                      onClick={() => onUpvoteReply(reply.id, reply.has_upvoted || false)}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      {reply.upvote_count > 0 && reply.upvote_count}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

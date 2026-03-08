import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useForumTopic, FORUM_CATEGORIES } from '@/hooks/useForum';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowBigUp, ArrowLeft, Award, CheckCircle2, MessageCircle, Loader2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ForumTopic() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { topic, answers, loading, createAnswer, vote, markBestAnswer, userVotes } = useForumTopic(id);
  const [newAnswer, setNewAnswer] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitAnswer = async () => {
    if (!newAnswer.trim()) return;
    setSubmitting(true);
    await createAnswer(newAnswer.trim());
    setNewAnswer('');
    setSubmitting(false);
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    await createAnswer(replyContent.trim(), parentId);
    setReplyContent('');
    setReplyTo(null);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (!topic) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center pt-24 gap-4">
          <p className="text-muted-foreground">Topic not found</p>
          <Link to="/forum"><Button variant="outline">Back to Forum</Button></Link>
        </div>
      </>
    );
  }

  const cat = FORUM_CATEGORIES.find(c => c.value === topic.category);
  const topLevelAnswers = answers.filter(a => !a.parent_id);
  const getReplies = (parentId: string) => answers.filter(a => a.parent_id === parentId);
  const isOwner = user?.id === topic.user_id;

  return (
    <>
      <SEOHead title={`${topic.title} — Forum`} description={topic.content.slice(0, 160)} />
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Back */}
          <Link to="/forum" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Forum
          </Link>

          {/* Topic */}
          <div className="flex gap-4">
            {/* Vote column */}
            <div className="hidden sm:flex flex-col items-center gap-1 pt-1">
              <button
                onClick={() => vote(topic.id, 'topic')}
                className={`p-1 rounded-lg transition-colors ${userVotes.has(topic.id) ? 'text-accent bg-accent/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                <ArrowBigUp className="h-6 w-6" />
              </button>
              <span className="text-sm font-bold text-foreground">{topic.upvote_count}</span>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {topic.is_resolved && <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20"><CheckCircle2 className="h-3 w-3 mr-1" /> Resolved</Badge>}
                {cat && <span className={`text-xs px-2.5 py-0.5 rounded-full border ${cat.color}`}>{cat.label}</span>}
              </div>

              <h1 className="text-2xl font-display font-bold text-foreground mb-2">{topic.title}</h1>

              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">{(topic.profiles?.full_name || '?')[0]}</AvatarFallback>
                  </Avatar>
                  <span>{topic.profiles?.full_name || 'Anonymous'}</span>
                </div>
                <span>·</span>
                <span>{formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}</span>
                <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {topic.view_count}</span>
              </div>

              <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap mb-4">
                {topic.content}
              </div>

              {topic.tags?.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mb-6">
                  {topic.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}

              {/* Mobile vote */}
              <div className="sm:hidden flex items-center gap-2 mb-6">
                <button
                  onClick={() => vote(topic.id, 'topic')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${userVotes.has(topic.id) ? 'text-accent bg-accent/10' : 'text-muted-foreground bg-muted hover:bg-muted/80'}`}
                >
                  <ArrowBigUp className="h-4 w-4" /> {topic.upvote_count}
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border my-6" />

          {/* Answers */}
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" /> {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
          </h2>

          <div className="space-y-4">
            {topLevelAnswers.map(answer => (
              <Card key={answer.id} className={answer.is_best_answer ? 'border-emerald-500/30 bg-emerald-500/5' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Vote */}
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        onClick={() => vote(answer.id, 'answer')}
                        className={`p-0.5 rounded transition-colors ${userVotes.has(answer.id) ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        <ArrowBigUp className="h-5 w-5" />
                      </button>
                      <span className="text-xs font-semibold">{answer.upvote_count}</span>
                      {answer.is_best_answer && <Award className="h-4 w-4 text-emerald-500 mt-0.5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      {answer.is_best_answer && (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 mb-2">Best Answer</Badge>
                      )}
                      <div className="text-sm text-foreground/90 whitespace-pre-wrap">{answer.content}</div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-[8px]">{(answer.profiles?.full_name || '?')[0]}</AvatarFallback>
                          </Avatar>
                          <span>{answer.profiles?.full_name || 'Anonymous'}</span>
                          <span>·</span>
                          <span>{formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}</span>
                        </div>
                        <div className="flex gap-2">
                          {isOwner && !answer.is_best_answer && (
                            <button onClick={() => markBestAnswer(answer.id)} className="text-xs text-emerald-500 hover:underline flex items-center gap-1">
                              <Award className="h-3 w-3" /> Mark Best
                            </button>
                          )}
                          {user && (
                            <button onClick={() => setReplyTo(replyTo === answer.id ? null : answer.id)} className="text-xs text-muted-foreground hover:text-foreground">
                              Reply
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Reply form */}
                      {replyTo === answer.id && (
                        <div className="mt-3 flex gap-2">
                          <Textarea placeholder="Write a reply..." rows={2} value={replyContent} onChange={e => setReplyContent(e.target.value)} className="text-sm" />
                          <Button size="sm" onClick={() => handleSubmitReply(answer.id)} disabled={submitting || !replyContent.trim()}>
                            {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Reply'}
                          </Button>
                        </div>
                      )}

                      {/* Nested replies */}
                      {getReplies(answer.id).map(reply => (
                        <div key={reply.id} className="mt-3 pl-4 border-l-2 border-border">
                          <div className="text-sm text-foreground/85 whitespace-pre-wrap">{reply.content}</div>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                            <span>{reply.profiles?.full_name || 'Anonymous'}</span>
                            <span>·</span>
                            <span>{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</span>
                            <button onClick={() => vote(reply.id, 'answer')} className={`flex items-center gap-0.5 ${userVotes.has(reply.id) ? 'text-accent' : 'hover:text-foreground'}`}>
                              <ArrowBigUp className="h-3 w-3" /> {reply.upvote_count}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* New answer */}
          {user ? (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-foreground mb-2">Your Answer</h3>
              <Textarea placeholder="Share your knowledge..." rows={4} value={newAnswer} onChange={e => setNewAnswer(e.target.value)} />
              <Button onClick={handleSubmitAnswer} disabled={submitting || !newAnswer.trim()} className="mt-3">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post Answer'}
              </Button>
            </div>
          ) : (
            <div className="mt-8 text-center py-8 border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground mb-3">Sign in to answer this question</p>
              <Link to="/auth"><Button variant="outline">Sign In</Button></Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

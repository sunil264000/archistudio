import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { useStudioRooms, useRoomDetail } from '@/hooks/useStudioRooms';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, Users, ArrowLeft, Calendar, Send, MessageSquare, Loader2,
  Home, Palette, Building2, TreePine, Lightbulb
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const THEMES = [
  { value: 'housing', label: 'Housing Design', icon: Home },
  { value: 'urban', label: 'Urban Design', icon: Building2 },
  { value: 'parametric', label: 'Parametric Design', icon: Palette },
  { value: 'sustainable', label: 'Sustainable Architecture', icon: TreePine },
  { value: 'general', label: 'General Studio', icon: Lightbulb },
];

function getTheme(val: string) {
  return THEMES.find(t => t.value === val) || THEMES[4];
}

export default function StudioRooms() {
  const { user } = useAuth();
  const { rooms, loading, createRoom, joinRoom, leaveRoom } = useStudioRooms();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTheme, setNewTheme] = useState('general');
  const [newMentor, setNewMentor] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    const room = await createRoom(newTitle, newDesc, newTheme, newMentor);
    if (room) {
      setSelectedRoomId(room.id);
      setShowCreate(false);
      setNewTitle(''); setNewDesc(''); setNewMentor('');
    }
    setCreating(false);
  };

  if (selectedRoomId) {
    return <RoomDetailView roomId={selectedRoomId} onBack={() => setSelectedRoomId(null)} />;
  }

  return (
    <>
      <SEOHead title="Architecture Studio Rooms | Archistudio" description="Join themed virtual architecture studios — collaborate, get critiques, and work with mentors." />
      <Navbar />
      <main className="min-h-screen bg-background pt-8 pb-20">
        <div className="container-wide">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
                <Building2 className="h-8 w-8 text-accent" />
                Architecture Studio Rooms
              </h1>
              <p className="text-muted-foreground mt-1">
                Join themed studios — collaborate, critique, and learn together
              </p>
            </div>
            {user && (
              <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                    <Plus className="h-4 w-4" /> Create Studio
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a Studio Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input placeholder="Studio name" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    <Textarea placeholder="Description & brief..." value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} />
                    <Select value={newTheme} onValueChange={setNewTheme}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {THEMES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Mentor name (optional)" value={newMentor} onChange={e => setNewMentor(e.target.value)} />
                    <Button onClick={handleCreate} disabled={creating || !newTitle.trim()} className="w-full gap-2">
                      {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Create Studio
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => <Skeleton key={i} className="h-52 rounded-xl" />)}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold">No studio rooms yet</h2>
              <p className="text-muted-foreground mt-1">Be the first to create one!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room, i) => {
                const theme = getTheme(room.theme);
                const ThemeIcon = theme.icon;
                return (
                  <motion.div key={room.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setSelectedRoomId(room.id)}>
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                              <ThemeIcon className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-1">{room.title}</h3>
                              <Badge variant="outline" className="text-[10px]">{theme.label}</Badge>
                            </div>
                          </div>
                        </div>
                        {room.description && <p className="text-sm text-muted-foreground line-clamp-2">{room.description}</p>}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {room.member_count || 0}/{room.max_members}</span>
                          {room.mentor_name && <span>Mentor: {room.mentor_name}</span>}
                          {room.deadline && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDistanceToNow(new Date(room.deadline), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {room.is_member ? (
                            <Badge className="bg-accent/10 text-accent border-accent/30">Joined</Badge>
                          ) : user ? (
                            <Button size="sm" variant="outline" className="text-xs" onClick={e => { e.stopPropagation(); joinRoom(room.id); }}>
                              Join Studio
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function RoomDetailView({ roomId, onBack }: { roomId: string; onBack: () => void }) {
  const { user } = useAuth();
  const { room, reviews, members, loading, isMember, addReview } = useRoomDetail(roomId);
  const { joinRoom, leaveRoom } = useStudioRooms();
  const [newMessage, setNewMessage] = useState('');
  const [reviewType, setReviewType] = useState('discussion');
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!newMessage.trim()) return;
    setPosting(true);
    await addReview(newMessage.trim(), reviewType);
    setNewMessage('');
    setPosting(false);
  };

  if (loading || !room) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background pt-8 pb-20">
          <div className="container-wide">
            <Skeleton className="h-10 w-1/3 mb-4" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </main>
      </>
    );
  }

  const rootReviews = reviews.filter(r => !r.parent_id);
  const getReplies = (parentId: string) => reviews.filter(r => r.parent_id === parentId);
  const theme = getTheme(room.theme);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-8 pb-20">
        <div className="container-wide max-w-4xl">
          <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" /> Back to Studios
          </Button>

          {/* Room Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">{room.title}</h1>
              {room.description && <p className="text-muted-foreground mt-1">{room.description}</p>}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <Badge variant="outline">{theme.label}</Badge>
                {room.mentor_name && <Badge variant="secondary">Mentor: {room.mentor_name}</Badge>}
                {room.deadline && (
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    Deadline: {new Date(room.deadline).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!isMember && user && (
                <Button onClick={() => joinRoom(roomId)} className="gap-1.5 bg-accent text-accent-foreground">
                  <Users className="h-4 w-4" /> Join
                </Button>
              )}
              {isMember && (
                <Button variant="outline" size="sm" onClick={() => leaveRoom(roomId)}>Leave</Button>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_280px] gap-6">
            {/* Discussion Feed */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Discussions & Critiques
              </h2>

              {isMember && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Select value={reviewType} onValueChange={setReviewType}>
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discussion">Discussion</SelectItem>
                        <SelectItem value="critique">Critique</SelectItem>
                        <SelectItem value="milestone">Milestone Review</SelectItem>
                        <SelectItem value="brief">Project Brief</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Share your thoughts, upload progress, or start a discussion..."
                      rows={3}
                    />
                    <Button onClick={handlePost} disabled={posting || !newMessage.trim()} className="gap-2">
                      {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Post
                    </Button>
                  </CardContent>
                </Card>
              )}

              {rootReviews.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No discussions yet. {isMember ? 'Start the conversation!' : 'Join to participate.'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rootReviews.map(review => (
                    <ReviewCard key={review.id} review={review} replies={getReplies(review.id)} onReply={isMember ? (content) => addReview(content, 'discussion', review.id) : undefined} />
                  ))}
                </div>
              )}
            </div>

            {/* Members Sidebar */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                <Users className="h-4 w-4" /> Members ({members.length})
              </h3>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {members.map(m => (
                    <div key={m.user_id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs">{m.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{m.name}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function ReviewCard({ review, replies, onReply }: { review: any; replies: any[]; onReply?: (content: string) => void }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleReply = () => {
    if (onReply && replyText.trim()) {
      onReply(replyText.trim());
      setReplyText('');
      setShowReply(false);
    }
  };

  const typeColors: Record<string, string> = {
    critique: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    milestone: 'bg-green-500/10 text-green-600 border-green-500/30',
    brief: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    discussion: 'bg-secondary text-secondary-foreground',
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">{(review.author_name || 'U').charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">{review.author_name}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </p>
          </div>
          <Badge variant="outline" className={typeColors[review.review_type] || ''}>
            {review.review_type}
          </Badge>
        </div>
        <p className="text-sm text-foreground whitespace-pre-wrap">{review.content}</p>

        {replies.length > 0 && (
          <div className="pl-4 border-l-2 border-border space-y-2 mt-3">
            {replies.map(r => (
              <div key={r.id} className="text-xs">
                <span className="font-medium">{r.author_name}: </span>
                <span className="text-muted-foreground">{r.content}</span>
              </div>
            ))}
          </div>
        )}

        {onReply && (
          <div>
            {showReply ? (
              <div className="flex gap-2 mt-2">
                <Input
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Reply..."
                  className="text-xs h-8"
                  onKeyDown={e => e.key === 'Enter' && handleReply()}
                />
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleReply}>
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => setShowReply(true)}>
                <MessageSquare className="h-3 w-3" /> Reply
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

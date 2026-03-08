import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useForumTopics, useCreateTopic, FORUM_CATEGORIES, ForumCategory } from '@/hooks/useForum';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquarePlus, ArrowBigUp, Eye, MessageCircle, CheckCircle2, Pin, Search, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Forum() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<ForumCategory | undefined>();
  const [search, setSearch] = useState('');
  const { topics, loading, refetch } = useForumTopics(activeCategory);
  const { createTopic } = useCreateTopic();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<ForumCategory>('general');
  const [newTags, setNewTags] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setCreating(true);
    const result = await createTopic({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setCreating(false);
    if (result) {
      setDialogOpen(false);
      setNewTitle(''); setNewContent(''); setNewTags('');
      navigate(`/forum/${result.id}`);
    }
  };

  const filtered = topics.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <SEOHead title="Forum — Archistudio" description="Architecture student community forum for concept, thesis, portfolio, and software discussions." />
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Community Forum</h1>
              <p className="text-muted-foreground mt-1">Discuss architecture, get help, share knowledge</p>
            </div>
            {user ? (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="gradient" className="gap-2">
                    <MessageSquarePlus className="h-4 w-4" /> New Topic
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Start a Discussion</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <Input placeholder="Topic title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    <Select value={newCategory} onValueChange={v => setNewCategory(v as ForumCategory)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FORUM_CATEGORIES.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea placeholder="Describe your question or topic..." rows={5} value={newContent} onChange={e => setNewContent(e.target.value)} />
                    <Input placeholder="Tags (comma-separated)" value={newTags} onChange={e => setNewTags(e.target.value)} />
                    <Button onClick={handleCreate} disabled={creating || !newTitle.trim() || !newContent.trim()} className="w-full">
                      {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post Topic'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Link to="/auth"><Button variant="outline">Sign in to post</Button></Link>
            )}
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveCategory(undefined)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${!activeCategory ? 'bg-accent text-accent-foreground border-accent' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'}`}
            >All</button>
            {FORUM_CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setActiveCategory(activeCategory === c.value ? undefined : c.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${activeCategory === c.value ? c.color + ' ring-1 ring-current/20' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'}`}
              >{c.label}</button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search topics..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Topics */}
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No topics yet</p>
              <p className="text-sm">Be the first to start a discussion!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(topic => {
                const cat = FORUM_CATEGORIES.find(c => c.value === topic.category);
                return (
                  <Link key={topic.id} to={`/forum/${topic.id}`}>
                    <Card className="hover:border-accent/20 transition-all">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex gap-4">
                          {/* Vote count */}
                          <div className="hidden sm:flex flex-col items-center gap-0.5 min-w-[48px]">
                            <ArrowBigUp className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-semibold text-foreground">{topic.upvote_count}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {topic.is_pinned && <Pin className="h-3.5 w-3.5 text-accent" />}
                              {topic.is_resolved && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                              {cat && <span className={`text-[10px] px-2 py-0.5 rounded-full border ${cat.color}`}>{cat.label}</span>}
                            </div>
                            <h3 className="font-semibold text-foreground line-clamp-1">{topic.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{topic.content}</p>

                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="text-[8px]">{(topic.profiles?.full_name || '?')[0]}</AvatarFallback>
                                </Avatar>
                                <span>{topic.profiles?.full_name || 'Anonymous'}</span>
                              </div>
                              <span>·</span>
                              <span>{formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}</span>
                              <span className="hidden sm:inline">·</span>
                              <span className="hidden sm:flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {topic.answer_count}</span>
                              <span className="hidden sm:flex items-center gap-1"><Eye className="h-3 w-3" /> {topic.view_count}</span>
                              {/* Mobile vote */}
                              <span className="sm:hidden flex items-center gap-1"><ArrowBigUp className="h-3 w-3" /> {topic.upvote_count}</span>
                            </div>

                            {topic.tags?.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {topic.tags.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
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

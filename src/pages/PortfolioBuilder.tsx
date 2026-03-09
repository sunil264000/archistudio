import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMyPortfolio, usePortfolioSections } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Image as ImageIcon,
  Type, Heading, FileText, ExternalLink, Loader2, Upload, Globe, Copy, Check,
  Import, Paintbrush, FileImage, Trophy
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ShareButtons } from '@/components/social/ShareButtons';

function SectionEditor({ pageId }: { pageId: string }) {
  const { user } = useAuth();
  const { sections, loading, addSection, updateSection, deleteSection, reorderSections, uploadImage } = usePortfolioSections(pageId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const url = await uploadImage(file, user.id);
    if (url) await addSection('image', undefined, url);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) return <div className="py-4 text-center text-muted-foreground text-sm">Loading sections...</div>;

  return (
    <div className="space-y-3">
      {sections.map((section, idx) => (
        <div key={section.id} className="group relative border border-border rounded-xl p-3 bg-card hover:border-accent/20 transition-colors">
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
            {idx > 0 && (
              <button onClick={() => reorderSections(idx, idx - 1)} className="p-1 rounded-md bg-muted hover:bg-secondary border border-border">
                <ChevronUp className="h-3 w-3" />
              </button>
            )}
            {idx < sections.length - 1 && (
              <button onClick={() => reorderSections(idx, idx + 1)} className="p-1 rounded-md bg-muted hover:bg-secondary border border-border">
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
            <button onClick={() => deleteSection(section.id)} className="p-1 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>

          {section.section_type === 'image' && (
            <div>
              {section.image_url ? (
                <img src={section.image_url} alt="" className="w-full rounded-lg object-cover max-h-60" />
              ) : (
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
              <Input
                placeholder="Caption (optional)"
                value={section.caption || ''}
                onChange={e => updateSection(section.id, { caption: e.target.value })}
                className="mt-2 text-xs"
              />
            </div>
          )}

          {section.section_type === 'text' && (
            <Textarea
              placeholder="Write your text..."
              value={section.content || ''}
              onChange={e => updateSection(section.id, { content: e.target.value })}
              rows={4}
              className="text-sm"
            />
          )}

          {section.section_type === 'heading' && (
            <Input
              placeholder="Section heading"
              value={section.content || ''}
              onChange={e => updateSection(section.id, { content: e.target.value })}
              className="text-lg font-semibold"
            />
          )}
        </div>
      ))}

      {/* Add section buttons */}
      <div className="flex gap-2 pt-1">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-1.5 text-xs">
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />} Image
        </Button>
        <Button size="sm" variant="outline" onClick={() => addSection('text')} className="gap-1.5 text-xs">
          <Type className="h-3 w-3" /> Text
        </Button>
        <Button size="sm" variant="outline" onClick={() => addSection('heading')} className="gap-1.5 text-xs">
          <Heading className="h-3 w-3" /> Heading
        </Button>
      </div>
    </div>
  );
}

export default function PortfolioBuilder() {
  const { user } = useAuth();
  const { portfolio, pages, loading, createPortfolio, updatePortfolio, addPage, updatePage, deletePage, reorderPages } = useMyPortfolio();
  const [newTitle, setNewTitle] = useState('');
  const [activePage, setActivePage] = useState<string | null>(null);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    await createPortfolio(newTitle.trim());
    setCreating(false);
  };

  const handleAddPage = async () => {
    if (!newPageTitle.trim()) return;
    const page = await addPage(newPageTitle.trim());
    if (page) {
      setActivePage(page.id);
      setNewPageTitle('');
    }
  };

  const shareUrl = portfolio ? `${window.location.origin}/portfolio/${portfolio.slug}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Link copied!' });
  };

  const handleExportPDF = () => {
    if (!portfolio) return;
    window.open(`/portfolio/${portfolio.slug}?print=1`, '_blank');
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Sign in to build your portfolio</p>
          <Link to="/auth"><Button>Sign In</Button></Link>
        </div>
        <Footer />
      </>
    );
  }

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

  // No portfolio yet — create one
  if (!portfolio) {
    return (
      <>
        <SEOHead title="Portfolio Builder — Archistudio" />
        <Navbar />
        <main className="min-h-screen pt-24 pb-16 bg-background">
          <div className="max-w-md mx-auto px-4 text-center">
            <FileText className="h-16 w-16 mx-auto text-accent/50 mb-4" />
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">Create Your Portfolio</h1>
            <p className="text-muted-foreground mb-6">Showcase your architecture projects with a professional portfolio.</p>
            <Input placeholder="Portfolio title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="mb-3" />
            <Button onClick={handleCreate} disabled={creating || !newTitle.trim()} className="w-full">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Portfolio'}
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEOHead title={`${portfolio.title} — Portfolio Builder`} />
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Portfolio Builder</h1>
              <p className="text-sm text-muted-foreground">Edit your portfolio and manage project pages</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <ShareButtons url={`/portfolio/${portfolio.slug}`} title={portfolio.title} />
              <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy Link'}
              </Button>
              <Link to={`/portfolio/${portfolio.slug}`} target="_blank">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" /> Preview
                </Button>
              </Link>
              <Button variant="gradient" size="sm" onClick={handleExportPDF} className="gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Export PDF
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Settings sidebar */}
            <Card className="lg:col-span-1 h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Portfolio Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
                  <Input value={portfolio.title} onChange={e => updatePortfolio({ title: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Subtitle</label>
                  <Input value={portfolio.subtitle || ''} onChange={e => updatePortfolio({ subtitle: e.target.value })} placeholder="Architecture Student" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Bio</label>
                  <Textarea value={portfolio.bio || ''} onChange={e => updatePortfolio({ bio: e.target.value })} rows={3} placeholder="Brief bio..." />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Contact Email</label>
                  <Input value={portfolio.contact_email || ''} onChange={e => updatePortfolio({ contact_email: e.target.value })} placeholder="you@email.com" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Public</span>
                  </div>
                  <Switch checked={portfolio.is_public} onCheckedChange={v => updatePortfolio({ is_public: v })} />
                </div>
              </CardContent>
            </Card>

            {/* Pages / Projects */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Project Pages</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Page</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>New Project Page</DialogTitle></DialogHeader>
                    <Input placeholder="Project name" value={newPageTitle} onChange={e => setNewPageTitle(e.target.value)} />
                    <Button onClick={handleAddPage} disabled={!newPageTitle.trim()}>Create Page</Button>
                  </DialogContent>
                </Dialog>
                <ImportFromPlatformDialog portfolioId={portfolio.id} userId={user?.id || ''} onImported={() => {
                  // Refresh pages
                  window.location.reload();
                }} />
              </div>

              {pages.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-xl">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">No project pages yet</p>
                  <p className="text-sm text-muted-foreground/60">Add pages to showcase your projects</p>
                </div>
              ) : (
                pages.map((page, idx) => (
                  <Card key={page.id} className={activePage === page.id ? 'border-accent/30' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <button onClick={() => setActivePage(activePage === page.id ? null : page.id)} className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{idx + 1}</Badge>
                            <CardTitle className="text-base">{page.title}</CardTitle>
                          </div>
                        </button>
                        <div className="flex gap-1">
                          {idx > 0 && (
                            <button onClick={() => reorderPages(idx, idx - 1)} className="p-1 rounded hover:bg-muted"><ChevronUp className="h-4 w-4 text-muted-foreground" /></button>
                          )}
                          {idx < pages.length - 1 && (
                            <button onClick={() => reorderPages(idx, idx + 1)} className="p-1 rounded hover:bg-muted"><ChevronDown className="h-4 w-4 text-muted-foreground" /></button>
                          )}
                          <button onClick={() => deletePage(page.id)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive/60" /></button>
                        </div>
                      </div>
                    </CardHeader>
                    {activePage === page.id && (
                      <CardContent>
                        <Input
                          placeholder="Page title"
                          value={page.title}
                          onChange={e => updatePage(page.id, { title: e.target.value })}
                          className="mb-2"
                        />
                        <Textarea
                          placeholder="Project description..."
                          value={page.description || ''}
                          onChange={e => updatePage(page.id, { description: e.target.value })}
                          rows={2}
                          className="mb-4 text-sm"
                        />
                        <SectionEditor pageId={page.id} />
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

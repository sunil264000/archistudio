import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { MapPin, Building2, Calendar, ExternalLink, Briefcase, Search, Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Internship {
  id: string; title: string; company_name: string; city: string; role_type: string;
  description: string; requirements: string | null; stipend: string | null;
  deadline: string | null; website_url: string | null; contact_email: string | null;
  created_at: string; application_count: number;
}

const MOCK_INTERNSHIPS: Internship[] = [
  {
    id: 'mock-int-1',
    title: 'Junior Architectural Intern',
    company_name: 'Studio Arch-Delineate',
    city: 'Mumbai',
    role_type: 'Full-time',
    description: 'Looking for a passionate intern to assist with conceptual design and 3D visualization. Proficient in Revit and 3ds Max.',
    requirements: 'Revit, 3ds Max, Lumion',
    stipend: '₹12,000/mo',
    deadline: new Date(Date.now() + 86400000 * 14).toISOString(),
    website_url: '#',
    contact_email: 'jobs@studioarch.com',
    created_at: new Date().toISOString(),
    application_count: 5
  },
  {
    id: 'mock-int-2',
    title: 'Design Research Assistant',
    company_name: 'Urban Genesis',
    city: 'Bangalore',
    role_type: 'Part-time',
    description: 'Assist in urban planning research and site analysis for upcoming township projects.',
    requirements: 'GIS, AutoCAD, Research Skills',
    stipend: '₹8,000/mo',
    deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
    website_url: '#',
    contact_email: 'careers@urbangenesis.in',
    created_at: new Date().toISOString(),
    application_count: 3
  }
];

export default function Internships() {
  const { user } = useAuth();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [applyDialog, setApplyDialog] = useState<string | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [applying, setApplying] = useState(false);

  const fetchInternships = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('internships')
      .select('*').eq('is_approved', true).order('created_at', { ascending: false });
    
    const finalInternships = (data && data.length > 0) ? data : MOCK_INTERNSHIPS;
    setInternships(finalInternships);
    setLoading(false);
  }, []);

  useEffect(() => { fetchInternships(); }, [fetchInternships]);

  const cities = [...new Set(internships.map(i => i.city))].sort();

  const filtered = internships.filter(i => {
    if (cityFilter && i.city !== cityFilter) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !i.company_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleApply = async (internshipId: string) => {
    if (!user) return;
    setApplying(true);
    const { error } = await (supabase as any).from('internship_applications').insert({
      internship_id: internshipId, user_id: user.id,
      portfolio_url: portfolioUrl || null, cover_note: coverNote || null,
    });
    setApplying(false);
    if (error) {
      if (error.code === '23505') toast({ title: 'Already applied!' });
      else toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Application submitted!' });
    setApplyDialog(null); setCoverNote(''); setPortfolioUrl('');
  };

  return (
    <>
      <SEOHead title="Internships — Archistudio" description="Architecture internship opportunities for students" />
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Internships</h1>
              <p className="text-muted-foreground mt-1">Architecture opportunities from leading firms</p>
            </div>
          </div>

          <div className="flex gap-3 mb-6 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search internships..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={cityFilter} onValueChange={v => setCityFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All cities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cities</SelectItem>
                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No internships available</p>
              <p className="text-sm">Check back soon for new opportunities!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(internship => (
                <Card key={internship.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg">{internship.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {internship.company_name}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {internship.city}</span>
                          {internship.stipend && <Badge variant="outline" className="text-xs">{internship.stipend}</Badge>}
                          {internship.deadline && (
                            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDistanceToNow(new Date(internship.deadline), { addSuffix: true })}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{internship.description}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {internship.website_url && (
                          <a href={internship.website_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="gap-1"><ExternalLink className="h-3.5 w-3.5" /> Website</Button>
                          </a>
                        )}
                        {user ? (
                          <Dialog open={applyDialog === internship.id} onOpenChange={v => setApplyDialog(v ? internship.id : null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="gradient" className="gap-1"><Send className="h-3.5 w-3.5" /> Apply</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader><DialogTitle>Apply to {internship.company_name}</DialogTitle></DialogHeader>
                              <div className="space-y-3 mt-2">
                                <Input placeholder="Portfolio URL (optional)" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} />
                                <Textarea placeholder="Cover note (optional)" rows={4} value={coverNote} onChange={e => setCoverNote(e.target.value)} />
                                <Button onClick={() => handleApply(internship.id)} disabled={applying} className="w-full">
                                  {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Application'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Link to="/auth"><Button size="sm" variant="outline">Sign in to apply</Button></Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

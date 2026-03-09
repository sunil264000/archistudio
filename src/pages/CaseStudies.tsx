import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, Calendar, User, Building, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface CaseStudy {
  id: string;
  title: string;
  architect: string;
  location: string;
  year: string;
  type: string;
  image_url: string | null;
  brief: string;
  tags: string[];
}

export default function CaseStudies() {
  const { user } = useAuth();
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<CaseStudy | null>(null);

  useEffect(() => {
    const fetchCaseStudies = async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('case_studies')
        .select('*')
        .eq('is_published', true)
        .order('order_index');
      
      if (data && !error) {
        setCaseStudies(data);
      }
      setLoading(false);
    };
    fetchCaseStudies();
  }, []);

  const types = ['all', ...new Set(caseStudies.map(cs => cs.type))];

  const filtered = caseStudies.filter(cs => {
    const matchesSearch = !search ||
      cs.title.toLowerCase().includes(search.toLowerCase()) ||
      cs.architect.toLowerCase().includes(search.toLowerCase()) ||
      cs.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesType = selectedType === 'all' || cs.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getAiExplanation = async (study: CaseStudy, aspect: string) => {
    if (!user) { toast.error('Please sign in to use AI analysis'); return; }
    setAiLoading(true);
    setAiExplanation('');

    try {
      const response = await supabase.functions.invoke('ai-design-mentor', {
        body: {
          mode: 'concept-generator',
          messages: [
            {
              role: 'user',
              content: `Analyze the ${aspect} of ${study.title} by ${study.architect} (${study.location}, ${study.year}). 
              Building type: ${study.type}. Brief: ${study.brief}. 
              Provide detailed architectural analysis focusing on ${aspect}. Be specific with technical details.`,
            },
          ],
        },
      });

      if (response.error) throw response.error;

      const reader = response.data?.getReader?.();
      if (reader) {
        const decoder = new TextDecoder();
        let result = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
              try {
                const parsed = JSON.parse(line.slice(6));
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  result += content;
                  setAiExplanation(result);
                }
              } catch { /* skip */ }
            }
          }
        }
      }
    } catch (err) {
      console.error('AI analysis error:', err);
      toast.error('Failed to generate AI analysis');
    }
    setAiLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Architecture Case Studies — Archistudio"
        description="Explore iconic architecture projects with AI-powered analysis. Learn from masterworks by Zumthor, Hadid, Kahn, Baker and more."
        url="https://archistudio.shop/case-studies"
      />
      <Navbar />
      <AnimatedBackground intensity="light" />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-2xl mx-auto text-center mb-12">
            <Badge variant="outline" className="mb-4 gap-1.5">
              <Building className="h-3 w-3" /> Case Studies
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
              Architecture Case Study Explorer
            </h1>
            <p className="text-muted-foreground mt-3">
              Study iconic buildings with AI-powered analysis. Understand concept, structure, materiality, and design decisions.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, architect, or tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {types.map(type => (
                <Button
                  key={type}
                  size="sm"
                  variant={selectedType === type ? 'default' : 'outline'}
                  onClick={() => setSelectedType(type)}
                  className="text-xs capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          )}

          {/* Grid */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((study, i) => (
                <motion.div
                  key={study.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Dialog>
                    <DialogTrigger asChild>
                      <Card
                        className="overflow-hidden group cursor-pointer hover:border-accent/30 transition-all h-full"
                        onClick={() => { setSelectedStudy(study); setAiExplanation(''); }}
                      >
                        <div className="aspect-[16/10] overflow-hidden bg-muted">
                          <img
                            src={study.image_url || ''}
                            alt={study.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                                {study.title}
                              </h3>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <User className="h-3 w-3" /> {study.architect}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-[10px] shrink-0">{study.type}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {study.location} • <Calendar className="h-3 w-3" /> {study.year}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{study.brief}</p>
                          <div className="flex flex-wrap gap-1">
                            {(study.tags || []).map(tag => (
                              <Badge key={tag} variant="outline" className="text-[9px] px-1.5">{tag}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>

                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-display">{study.title}</DialogTitle>
                        <p className="text-sm text-muted-foreground">{study.architect} • {study.location} • {study.year}</p>
                      </DialogHeader>

                      <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4">
                          <img
                            src={study.image_url || ''}
                            alt={study.title}
                            className="w-full rounded-lg object-cover max-h-64"
                          />

                          <p className="text-sm text-foreground">{study.brief}</p>

                          <div className="flex flex-wrap gap-1.5">
                            {(study.tags || []).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </div>

                          {/* AI Analysis */}
                          <div className="border-t pt-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-accent" />
                              <h4 className="text-sm font-semibold">AI Architecture Analysis</h4>
                            </div>
                            <Tabs defaultValue="concept">
                              <TabsList className="w-full">
                                <TabsTrigger value="concept" className="flex-1 text-xs">Concept</TabsTrigger>
                                <TabsTrigger value="structure" className="flex-1 text-xs">Structure</TabsTrigger>
                                <TabsTrigger value="materials" className="flex-1 text-xs">Materials</TabsTrigger>
                                <TabsTrigger value="details" className="flex-1 text-xs">Details</TabsTrigger>
                              </TabsList>
                              {['concept', 'structure', 'materials', 'details'].map(aspect => (
                                <TabsContent key={aspect} value={aspect}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full gap-1.5 mb-3"
                                    onClick={() => getAiExplanation(study, aspect)}
                                    disabled={aiLoading}
                                  >
                                    {aiLoading ? (
                                      <div className="h-3.5 w-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Sparkles className="h-3.5 w-3.5" />
                                    )}
                                    Analyze {aspect.charAt(0).toUpperCase() + aspect.slice(1)}
                                  </Button>
                                  {aiExplanation && (
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                                      <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                                    </div>
                                  )}
                                </TabsContent>
                              ))}
                            </Tabs>
                          </div>
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No case studies found matching your search.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

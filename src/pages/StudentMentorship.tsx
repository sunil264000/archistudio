import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  GraduationCap, BookOpen, PenTool, Layers, 
  MessageSquare, Users, Sparkles, CheckCircle2, 
  ChevronRight, Calendar, Clock, Star
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const categories = [
  { 
    id: '1st-2nd-year', 
    title: 'First Year Foundation', 
    desc: 'Struggling with sheets, drafting, or basic design logic? Get your basics right.',
    icon: PenTool,
    color: 'blue'
  },
  { 
    id: 'software-mastery', 
    title: 'Software Mastery', 
    desc: 'AutoCAD, Revit, or 3ds Max giving you trouble? 1:1 screen-share help.',
    icon: Layers,
    color: 'amber'
  },
  { 
    id: 'thesis-guide', 
    title: 'Thesis & Portfolio', 
    desc: 'Thesis planning, site analysis, and world-class portfolio reviews.',
    icon: GraduationCap,
    color: 'emerald'
  }
];

export default function StudentMentorship() {
  const { user } = useAuth();
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to request mentorship'); return; }
    if (!selectedCat) { toast.error('Please select a category'); return; }
    if (description.length < 30) { toast.error('Please describe your problem in at least 30 characters'); return; }

    setLoading(true);
    const { error } = await (supabase as any).from('mentorship_requests').insert({
      user_id: user.id,
      category: selectedCat,
      description,
      status: 'pending'
    });

    setLoading(false);
    if (error) {
      toast.error('Submission failed. Please try again.');
    } else {
      toast.success('Mentorship request sent! Our experts will review it and contact you via WhatsApp/Email.');
      setSelectedCat(null);
      setDescription('');
    }
  };

  return (
    <>
      <SEOHead 
        title="1:1 Student Mentorship — Archistudio" 
        description="Personalized architectural guidance for 1st-year students to Thesis candidates. Get expert help with AutoCAD, Revit, Design, and Portfolios."
      />
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-background relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,hsl(var(--accent)/0.04),transparent)] pointer-events-none" />
        
        <div className="container-wide max-w-6xl mx-auto px-4 relative">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-widest mb-4"
            >
              <Sparkles className="h-3 w-3" /> Exclusive Student Support
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-4">
              Stop Struggling. <br />
              <span className="text-muted-foreground/70 italic font-medium">Start Designing.</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get personalized 1:1 guidance from industry experts. Whether you're stuck on a 1st-year sheet or a final year Thesis, we've got your back.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_400px] gap-12">
            {/* Left: Options & Form */}
            <div className="space-y-10">
              <div className="grid sm:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <div 
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden group ${
                      selectedCat === cat.id 
                      ? 'border-accent bg-accent/[0.03] ring-1 ring-accent/30' 
                      : 'border-border/40 bg-card/30 hover:border-accent/40 hover:bg-card/50'
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                      selectedCat === cat.id ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent'
                    }`}>
                      <cat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm mb-1">{cat.title}</h3>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{cat.desc}</p>
                    </div>
                    {selectedCat === cat.id && (
                      <motion.div layoutId="check" className="absolute top-3 right-3">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>

              <Card className="border-border/40 bg-card/30 backdrop-blur-md overflow-hidden">
                <CardContent className="p-8">
                  <h3 className="text-lg font-display font-bold mb-6">Describe your requirement</h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Textarea 
                        placeholder="Tell us about your problem, current semester, and what software/help you need..."
                        className="rounded-2xl min-h-[180px] bg-background/50 border-border/60 focus:border-accent/40 transition-all text-base"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 px-1">
                        <MessageSquare className="h-3 w-3" /> Minimum 30 characters
                      </p>
                    </div>

                    <Button 
                      className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold text-base transition-transform active:scale-95"
                      disabled={loading || !selectedCat}
                    >
                      {loading ? 'Submitting...' : 'Request 1:1 Session'}
                    </Button>
                    <p className="text-center text-[10px] text-muted-foreground">
                      Our mentors will contact you via WhatsApp/Email within 12-24 hours.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right: Why us? */}
            <aside className="space-y-6">
              <div className="p-8 rounded-3xl border border-border/40 bg-gradient-to-br from-card/60 to-transparent backdrop-blur-sm">
                <h3 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
                  <Star className="h-5 w-5 text-accent" /> Premium Mentorship
                </h3>
                <ul className="space-y-6">
                  {[
                    { t: 'Screen-Share Support', d: 'Get live help on your AutoCAD/Revit files.' },
                    { t: 'Thesis Concept Review', d: 'Stronger site analysis and concept evolution.' },
                    { t: 'Portfolio Transformation', d: 'Turn your college work into studio-ready art.' },
                    { t: 'Career Roadmaps', d: 'What to study next to get into top studios.' },
                  ].map((item, i) => (
                    <li key={i} className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-none mb-1.5">{item.t}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.d}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-8 rounded-3xl border border-accent/20 bg-accent/[0.03]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-bold text-foreground">Top Rated Mentors</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Join 200+ students who improved their design grades with our 1:1 guidance sessions.
                </p>
              </div>

              <div className="p-8 rounded-3xl border border-border/40 bg-card/30 flex items-center justify-between group cursor-pointer hover:bg-card/50 transition-colors">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Pricing</p>
                  <p className="text-lg font-display font-bold">Starts at ₹499</p>
                </div>
                <div className="h-10 w-10 rounded-full border border-border/40 flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-all">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

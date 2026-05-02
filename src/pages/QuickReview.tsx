import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Star, Clock, CheckCircle2, ShieldCheck, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickReview() {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error('Please upload a drawing or project file'); return; }
    setLoading(true);
    // Simulate payment and upload
    setTimeout(() => {
      setLoading(false);
      toast.success('Project submitted for Pro Review! Our experts will respond within 24 hours.');
    }, 2000);
  };

  return (
    <>
      <SEOHead 
        title="Quick Pro Review — Archistudio" 
        description="Get professional feedback on your architectural drawings within 24 hours. Affordable expert reviews for students and young professionals."
      />
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-background relative overflow-hidden">
        {/* Ambient Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,hsl(var(--accent)/0.06),transparent)] pointer-events-none" />
        <div className="absolute inset-0 dot-grid opacity-10 pointer-events-none" />

        <div className="container-wide max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-widest mb-4"
            >
              <Sparkles className="h-3 w-3" /> Professional Audit
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-4">Quick Pro Review</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Stuck on a drawing? Get your portfolio, plan, or 3D render reviewed by office experts for just <span className="text-foreground font-semibold">₹299</span>.
            </p>
          </div>

          <div className="grid md:grid-cols-[1fr_320px] gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border/40 bg-card/30 backdrop-blur-md overflow-hidden">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div 
                      className="border-2 border-dashed border-border/40 rounded-2xl p-10 text-center hover:border-accent/40 hover:bg-accent/[0.02] transition-all cursor-pointer group"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
                      }}
                    >
                      <div className="h-12 w-12 rounded-2xl bg-muted group-hover:bg-accent/10 flex items-center justify-center mx-auto mb-4 transition-colors">
                        <Upload className="h-6 w-6 text-muted-foreground group-hover:text-accent" />
                      </div>
                      <p className="font-semibold mb-1">{file ? file.name : 'Drop your file here'}</p>
                      <p className="text-xs text-muted-foreground">PDF, JPEG, or DWG (Max 50MB)</p>
                      <input 
                        type="file" className="hidden" id="file-upload" 
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                      <Button 
                        type="button" variant="outline" size="sm" className="mt-4 rounded-full"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        Choose file
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold">What should we focus on?</label>
                      <Textarea 
                        placeholder="e.g. 'Is my circulation correct?' or 'How can I improve these renders?'"
                        className="rounded-xl min-h-[120px]"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <Button 
                      className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold text-base"
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Pay ₹299 & Get Review'}
                    </Button>
                    <p className="text-center text-[10px] text-muted-foreground">
                      Secured by Archistudio Escrow. Results in 24 hours.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            <motion.aside 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm">
                <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> What you get
                </h3>
                <ul className="space-y-4">
                  {[
                    { t: 'Annotated Review', d: 'Direct notes on your drawings' },
                    { t: 'Technical Advice', d: 'Correcting plans and details' },
                    { t: 'Software Tips', d: 'How to fix visual errors' },
                    { t: 'Pro Perspective', d: 'What a senior architect thinks' },
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-none">{item.t}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{item.d}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm">
                <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" /> Speed
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Average response time: <span className="text-foreground font-semibold">14 hours</span>.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-accent/20 bg-accent/5">
                <ShieldCheck className="h-8 w-8 text-accent mb-3" />
                <h3 className="font-display font-bold text-sm mb-1">Elite Vetted Experts</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Only top 1% verified architects from our Studio Hub perform these reviews.
                </p>
              </div>
            </motion.aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

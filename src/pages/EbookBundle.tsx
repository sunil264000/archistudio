import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ShoppingCart, 
  Check, 
  Download, 
  Package, 
  Sparkles,
  Library,
  Building2,
  Pencil,
  Home,
  Leaf,
  History,
  X,
  Gift,
  Loader2,
  CheckCircle2,
  Eye,
  ArrowRight,
  BookMarked,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEbookPayment } from '@/hooks/useEbookPayment';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { PhoneNumberDialog } from '@/components/payment/PhoneNumberDialog';
import { EbookPDFViewer } from '@/components/ebook/EbookPDFViewer';

interface Ebook {
  id: string;
  title: string;
  description: string;
  category: string;
  order_index: number;
  cover_image_url: string | null;
}

interface PricingSettings {
  full_bundle_price: number;
  tier_1_max_books: number;
  tier_1_price: number;
  tier_2_max_books: number;
  tier_2_price: number;
  tier_3_max_books: number;
  tier_3_price: number;
  tier_4_price: number;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Fundamentals of Design': <Library className="h-5 w-5" />,
  'Construction & Detailing': <Building2 className="h-5 w-5" />,
  'Drawing & Representation': <Pencil className="h-5 w-5" />,
  'Specialized Buildings & Interiors': <Home className="h-5 w-5" />,
  'Sustainable Design': <Leaf className="h-5 w-5" />,
  'History & Reference': <History className="h-5 w-5" />,
};

const categoryAccents: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  'Fundamentals of Design': { bg: 'bg-blue-500/8', border: 'border-blue-500/20', text: 'text-blue-400', glow: 'shadow-blue-500/5' },
  'Construction & Detailing': { bg: 'bg-orange-500/8', border: 'border-orange-500/20', text: 'text-orange-400', glow: 'shadow-orange-500/5' },
  'Drawing & Representation': { bg: 'bg-purple-500/8', border: 'border-purple-500/20', text: 'text-purple-400', glow: 'shadow-purple-500/5' },
  'Specialized Buildings & Interiors': { bg: 'bg-emerald-500/8', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-emerald-500/5' },
  'Sustainable Design': { bg: 'bg-green-500/8', border: 'border-green-500/20', text: 'text-green-400', glow: 'shadow-green-500/5' },
  'History & Reference': { bg: 'bg-amber-500/8', border: 'border-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/5' },
};

const defaultAccent = { bg: 'bg-primary/8', border: 'border-primary/20', text: 'text-primary', glow: 'shadow-primary/5' };

export default function EbookBundle() {
  const navigate = useNavigate();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [pricingSettings, setPricingSettings] = useState<PricingSettings | null>(null);
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [ownedEbookIds, setOwnedEbookIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedViewBook, setSelectedViewBook] = useState<{ id: string; title: string; hasAccess: boolean } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { initiatePayment, isLoading: purchasing } = useEbookPayment();

  const handleOpenViewer = (book: { id: string; title: string }, hasAccess: boolean) => {
    setSelectedViewBook({ id: book.id, title: book.title, hasAccess });
    setViewerOpen(true);
  };

  const handlePurchaseFromViewer = (ebookId: string, ebookTitle: string) => {
    if (!ownedEbookIds.has(ebookId)) {
      setSelectedBooks(prev => {
        const newSet = new Set(prev);
        newSet.add(ebookId);
        return newSet;
      });
      
      toast({
        title: "Added to Selection",
        description: `"${ebookTitle}" has been added. Complete your purchase below!`,
      });

      setTimeout(() => {
        const cartSection = document.getElementById('ebook-cart-section');
        if (cartSection) {
          cartSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const [ebooksRes, pricingRes] = await Promise.all([
      supabase.from('ebooks').select('*').eq('is_published', true).order('order_index'),
      supabase.from('ebook_pricing_settings').select('*').single()
    ]);
    
    if (ebooksRes.data) setEbooks(ebooksRes.data);
    if (pricingRes.data) setPricingSettings(pricingRes.data);

    if (user) {
      const { data: purchases } = await supabase
        .from('ebook_purchases')
        .select('ebook_ids')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (purchases) {
        const owned = new Set<string>();
        purchases.forEach(p => p.ebook_ids?.forEach(id => owned.add(id)));
        setOwnedEbookIds(owned);
      }
    }

    setLoading(false);
  };

  const handleDownload = async (ebookId: string, title: string) => {
    setDownloading(ebookId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please login to download');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/download-ebook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({ ebookId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to download PDF');
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({ title: 'Download Started', description: `Downloading "${title}"` });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({ title: 'Download Failed', description: error.message || 'Failed to download eBook', variant: 'destructive' });
    } finally {
      setDownloading(null);
    }
  };

  const ownedEbooks = ebooks.filter(e => ownedEbookIds.has(e.id));
  const availableEbooks = ebooks.filter(e => !ownedEbookIds.has(e.id));

  const calculatePrice = (bookCount: number): { total: number; perBook: number; savings: number } => {
    if (bookCount === 0 || !pricingSettings) return { total: 0, perBook: 0, savings: 0 };
    
    let total = 0;
    const basePrice = pricingSettings.tier_1_price;
    
    for (let i = 1; i <= bookCount; i++) {
      if (i <= pricingSettings.tier_1_max_books) total += pricingSettings.tier_1_price;
      else if (i <= pricingSettings.tier_2_max_books) total += pricingSettings.tier_2_price;
      else if (i <= pricingSettings.tier_3_max_books) total += pricingSettings.tier_3_price;
      else total += pricingSettings.tier_4_price;
    }
    
    const fullPrice = bookCount * basePrice;
    return { total, perBook: Math.round(total / bookCount), savings: fullPrice - total };
  };

  const categories = [...new Set(ebooks.map(e => e.category))];
  const totalBooks = ebooks.length;
  
  const toggleBook = (id: string) => {
    const newSelected = new Set(selectedBooks);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedBooks(newSelected);
  };

  const selectCategory = (category: string) => {
    const categoryBooks = ebooks.filter(e => e.category === category);
    const newSelected = new Set(selectedBooks);
    const allSelected = categoryBooks.every(b => selectedBooks.has(b.id));
    categoryBooks.forEach(b => { if (allSelected) newSelected.delete(b.id); else newSelected.add(b.id); });
    setSelectedBooks(newSelected);
  };

  const selectAll = () => {
    if (selectedBooks.size === ebooks.length) setSelectedBooks(new Set());
    else setSelectedBooks(new Set(ebooks.map(e => e.id)));
  };

  const pricing = calculatePrice(selectedBooks.size);
  const fullBundlePrice = pricingSettings?.full_bundle_price || 1034;
  const basePrice = pricingSettings?.tier_1_price || 50;
  const isFullBundle = selectedBooks.size === totalBooks && totalBooks > 0;
  const finalPrice = isFullBundle ? fullBundlePrice : pricing.total;
  const fullBundleSavings = (totalBooks * basePrice) - fullBundlePrice;

  const handlePurchase = async (phone?: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to purchase eBooks", variant: "destructive" });
      navigate('/auth');
      return;
    }

    if (selectedBooks.size === 0) {
      toast({ title: "No Books Selected", description: "Please select at least one book to purchase", variant: "destructive" });
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('phone, full_name, email').eq('user_id', user.id).single();
    const userPhone = phone || profile?.phone;
    
    if (!userPhone || userPhone.length < 10) {
      setPhoneDialogOpen(true);
      return;
    }

    await initiatePayment({
      ebookIds: Array.from(selectedBooks),
      customerName: profile?.full_name || user.email?.split('@')[0] || 'Customer',
      customerEmail: profile?.email || user.email || '',
      customerPhone: userPhone,
    });
  };

  const handlePhoneSubmit = (phone: string) => {
    setPhoneDialogOpen(false);
    handlePurchase(phone);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BookMarked className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatedBackground />
      <Navbar />
      
      <main className="relative z-10 pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Badge className="mb-6 bg-primary/8 text-primary border-primary/15 px-5 py-2 text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Premium Architecture Library
              </Badge>
            </motion.div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-5 tracking-tight">
              <span className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                The Ultimate
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                Architecture eBooks
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              {totalBooks} handpicked professional eBooks covering everything from design fundamentals 
              to sustainable construction. Build your complete architecture library.
            </p>

            {/* Bundle Deal Banner */}
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="relative rounded-2xl border border-primary/15 bg-card/60 p-1 mb-10 overflow-hidden"
            >
              {/* Subtle gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
              
              <div className="relative rounded-xl bg-gradient-to-r from-primary/8 via-transparent to-primary/8 p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5">
                      <Package className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-lg sm:text-xl">Complete Bundle Deal</h3>
                      <p className="text-sm text-muted-foreground">All {totalBooks} books • One-time purchase • Instant access</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground line-through">₹{totalBooks * 50}</p>
                      <p className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">₹{fullBundlePrice}</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1">
                        <Gift className="h-3.5 w-3.5 mr-1.5" />
                        Save ₹{fullBundleSavings}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 px-8 h-12 text-base"
                    onClick={selectAll}
                  >
                    {selectedBooks.size === totalBooks ? 'Deselect All' : 'Select Full Bundle'}
                    <Layers className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Pricing Tiers */}
            {pricingSettings && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mb-8"
              >
                {[
                  { range: `1–${pricingSettings.tier_1_max_books} books`, price: `₹${pricingSettings.tier_1_price}`, label: 'per book' },
                  { range: `${pricingSettings.tier_1_max_books + 1}–${pricingSettings.tier_2_max_books} books`, price: `₹${pricingSettings.tier_2_price}`, label: 'per book' },
                  { range: `${pricingSettings.tier_2_max_books + 1}–${pricingSettings.tier_3_max_books} books`, price: `₹${pricingSettings.tier_3_price}`, label: 'per book' },
                  { range: `${pricingSettings.tier_3_max_books}+ books`, price: `₹${pricingSettings.tier_4_price}`, label: 'per book' },
                ].map((tier, i) => (
                  <div key={i} className="rounded-xl bg-card/50 border border-border/50 p-4 text-center hover:border-primary/20 transition-colors">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">{tier.range}</p>
                    <p className="text-xl font-bold text-foreground">{tier.price}</p>
                    <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">{tier.label}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </section>

        {/* My Library Section */}
        {ownedEbooks.length > 0 && (
          <section className="container mx-auto px-4 mb-14">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="rounded-2xl border border-emerald-500/15 bg-card/40 overflow-hidden">
                <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">My eBook Library</h2>
                      <p className="text-sm text-muted-foreground">
                        {ownedEbooks.length} {ownedEbooks.length === 1 ? 'eBook' : 'eBooks'} you own
                      </p>
                    </div>
                  </div>
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm" className="gap-2 border-emerald-500/20 hover:bg-emerald-500/5">
                      <Library className="h-4 w-4" />
                      Dashboard
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {ownedEbooks.map((book, i) => (
                      <motion.div
                        key={book.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group rounded-xl bg-background/60 border border-emerald-500/10 hover:border-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 overflow-hidden"
                      >
                        {/* Cover Image */}
                                {book.cover_image_url ? (
                          <div className="aspect-[3/4] w-full bg-muted/30 overflow-hidden flex items-center justify-center p-3">
                            <img 
                              src={book.cover_image_url} 
                              alt={book.title}
                              className="max-w-full max-h-full object-contain rounded-sm shadow-md group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => { (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-emerald-400/40"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>'; }}
                            />
                          </div>
                        ) : (
                          <div className="aspect-[3/4] w-full bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center">
                            <BookOpen className="h-10 w-10 text-emerald-400/40" />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="mb-3">
                            <h4 className="font-semibold text-sm line-clamp-2 mb-1.5 leading-snug">{book.title}</h4>
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/8 border-emerald-500/20 text-emerald-400 font-medium">
                              Owned
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 gap-1.5 h-9 text-xs border-border/50 hover:border-primary/30"
                              onClick={(e) => { e.stopPropagation(); handleOpenViewer(book, true); }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Read
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 gap-1.5 h-9 text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); handleDownload(book.id, book.title); }}
                              disabled={downloading === book.id}
                            >
                              {downloading === book.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                              {downloading === book.id ? '...' : 'Save'}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </section>
        )}

        {/* Categories Grid */}
        <section className="container mx-auto px-4 mb-8">
          {availableEbooks.length > 0 && (
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center">
                <BookMarked className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {ownedEbooks.length > 0 ? 'Available for Purchase' : 'Browse eBooks'}
                </h2>
                <p className="text-sm text-muted-foreground">{availableEbooks.length} books across {categories.length} categories</p>
              </div>
            </div>
          )}
          <div className="space-y-6">
            {categories.map((category, catIndex) => {
              const categoryBooks = availableEbooks.filter(e => e.category === category);
              if (categoryBooks.length === 0) return null;
              const selectedInCategory = categoryBooks.filter(b => selectedBooks.has(b.id)).length;
              const allSelected = selectedInCategory === categoryBooks.length;
              const accent = categoryAccents[category] || defaultAccent;
              
              return (
                <motion.div 
                  key={category}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIndex * 0.08, duration: 0.5 }}
                >
                  <div className={`rounded-2xl border ${accent.border} ${accent.bg} overflow-hidden shadow-lg ${accent.glow}`}>
                    {/* Category Header */}
                    <div className="px-5 sm:px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl bg-background/60 border ${accent.border} flex items-center justify-center ${accent.text}`}>
                          {categoryIcons[category] || <BookOpen className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-base sm:text-lg">{category}</h3>
                          <p className="text-xs text-muted-foreground">
                            {categoryBooks.length} books
                            {selectedInCategory > 0 && (
                              <span className={`ml-1.5 ${accent.text} font-medium`}>• {selectedInCategory} selected</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => selectCategory(category)}
                        className={`bg-background/60 border-border/50 hover:${accent.border} text-xs h-8 px-3`}
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    
                    {/* Books Grid */}
                    <div className="px-5 sm:px-6 pb-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoryBooks.map((book) => {
                          const isSelected = selectedBooks.has(book.id);
                          return (
                            <motion.div
                              key={book.id}
                              whileHover={{ y: -2 }}
                              transition={{ duration: 0.2 }}
                              className={`
                                group rounded-xl border transition-all duration-300 overflow-hidden
                                ${isSelected 
                                  ? `bg-primary/8 border-primary/30 shadow-md shadow-primary/5` 
                                  : 'bg-background/50 border-border/30 hover:border-primary/20 hover:shadow-md'}
                              `}
                            >
                              {/* Cover Image */}
                              <div 
                                className="cursor-pointer"
                                onClick={() => toggleBook(book.id)}
                              >
                                {book.cover_image_url ? (
                                  <div className="aspect-[3/4] w-full bg-muted/20 overflow-hidden relative flex items-center justify-center p-3">
                                    <img 
                                      src={book.cover_image_url} 
                                      alt={book.title}
                                      className="max-w-full max-h-full object-contain rounded-sm shadow-md group-hover:scale-105 transition-transform duration-500"
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                    {/* Checkbox overlay */}
                                    <div className="absolute top-2 left-2">
                                      <div className={`
                                        h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 backdrop-blur-sm
                                        ${isSelected 
                                          ? 'bg-primary border-primary shadow-sm shadow-primary/30' 
                                          : 'border-foreground/40 bg-background/60 group-hover:border-foreground/60'}
                                      `}>
                                        {isSelected && (
                                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
                                            <Check className="h-3.5 w-3.5 text-primary-foreground" />
                                          </motion.div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="aspect-[3/4] w-full bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center relative">
                                    <BookOpen className="h-10 w-10 text-muted-foreground/20" />
                                    <div className="absolute top-2 left-2">
                                      <div className={`
                                        h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all duration-200
                                        ${isSelected 
                                          ? 'bg-primary border-primary shadow-sm shadow-primary/30' 
                                          : 'border-muted-foreground/30 group-hover:border-muted-foreground/50'}
                                      `}>
                                        {isSelected && (
                                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
                                            <Check className="h-3.5 w-3.5 text-primary-foreground" />
                                          </motion.div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <div className="p-3">
                                  <h4 className="font-medium text-sm leading-snug line-clamp-2">
                                    {book.title}
                                  </h4>
                                  {book.description && (
                                    <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">
                                      {book.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Preview Button */}
                              <div className="px-4 pb-3">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="w-full gap-2 h-8 text-xs text-muted-foreground hover:text-primary opacity-60 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => { e.stopPropagation(); handleOpenViewer(book, false); }}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Preview
                                  <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Sticky Cart */}
        <AnimatePresence>
          {selectedBooks.size > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/10 bg-background/95 backdrop-blur-xl"
            >
              {/* Gradient top edge */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              
              <div id="ebook-cart-section" className="container mx-auto max-w-4xl px-4 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        {selectedBooks.size} {selectedBooks.size === 1 ? 'book' : 'books'} selected
                        {isFullBundle && (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                            Full Bundle
                          </Badge>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        {(pricing.savings > 0 || isFullBundle) && (
                          <span className="text-muted-foreground line-through text-xs">
                            ₹{isFullBundle ? totalBooks * 50 : selectedBooks.size * 50}
                          </span>
                        )}
                        {(pricing.savings > 0 || isFullBundle) && (
                          <span className="text-emerald-400 text-xs font-medium">
                            Save ₹{isFullBundle ? fullBundleSavings : pricing.savings}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total</p>
                      <p className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">₹{finalPrice}</p>
                    </div>
                    <Button 
                      size="lg" 
                      className="bg-primary hover:bg-primary/90 px-8 h-12 shadow-lg shadow-primary/20 text-base font-semibold"
                      onClick={() => handlePurchase()}
                      disabled={purchasing}
                    >
                      {purchasing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Buy Now
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <Footer />
      
      <PhoneNumberDialog
        open={phoneDialogOpen}
        onOpenChange={setPhoneDialogOpen}
        onSubmit={handlePhoneSubmit}
      />

      {selectedViewBook && (
        <EbookPDFViewer
          isOpen={viewerOpen}
          onClose={() => { setViewerOpen(false); setSelectedViewBook(null); }}
          ebookId={selectedViewBook.id}
          ebookTitle={selectedViewBook.title}
          hasAccess={selectedViewBook.hasAccess}
          previewPages={15}
          onPurchaseRequest={handlePurchaseFromViewer}
        />
      )}
    </div>
  );
}

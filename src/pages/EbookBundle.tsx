import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Plus,
  Minus,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEbookPayment } from '@/hooks/useEbookPayment';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { PhoneNumberDialog } from '@/components/payment/PhoneNumberDialog';

interface Ebook {
  id: string;
  title: string;
  description: string;
  category: string;
  order_index: number;
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

const categoryColors: Record<string, string> = {
  'Fundamentals of Design': 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  'Construction & Detailing': 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
  'Drawing & Representation': 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  'Specialized Buildings & Interiors': 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
  'Sustainable Design': 'from-green-500/20 to-green-600/10 border-green-500/30',
  'History & Reference': 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
};

export default function EbookBundle() {
  const navigate = useNavigate();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [pricingSettings, setPricingSettings] = useState<PricingSettings | null>(null);
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { initiatePayment, isLoading: purchasing } = useEbookPayment();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [ebooksRes, pricingRes] = await Promise.all([
      supabase.from('ebooks').select('*').eq('is_published', true).order('order_index'),
      supabase.from('ebook_pricing_settings').select('*').single()
    ]);
    
    if (ebooksRes.data) setEbooks(ebooksRes.data);
    if (pricingRes.data) setPricingSettings(pricingRes.data);
    setLoading(false);
  };

  // Dynamic tiered pricing based on admin settings
  const calculatePrice = (bookCount: number): { total: number; perBook: number; savings: number } => {
    if (bookCount === 0 || !pricingSettings) return { total: 0, perBook: 0, savings: 0 };
    
    let total = 0;
    const basePrice = pricingSettings.tier_1_price;
    
    for (let i = 1; i <= bookCount; i++) {
      if (i <= pricingSettings.tier_1_max_books) {
        total += pricingSettings.tier_1_price;
      } else if (i <= pricingSettings.tier_2_max_books) {
        total += pricingSettings.tier_2_price;
      } else if (i <= pricingSettings.tier_3_max_books) {
        total += pricingSettings.tier_3_price;
      } else {
        total += pricingSettings.tier_4_price;
      }
    }
    
    const fullPrice = bookCount * basePrice;
    const savings = fullPrice - total;
    const perBook = Math.round(total / bookCount);
    
    return { total, perBook, savings };
  };

  const categories = [...new Set(ebooks.map(e => e.category))];
  const totalBooks = ebooks.length;
  
  const toggleBook = (id: string) => {
    const newSelected = new Set(selectedBooks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBooks(newSelected);
  };

  const selectCategory = (category: string) => {
    const categoryBooks = ebooks.filter(e => e.category === category);
    const newSelected = new Set(selectedBooks);
    const allSelected = categoryBooks.every(b => selectedBooks.has(b.id));
    
    categoryBooks.forEach(b => {
      if (allSelected) {
        newSelected.delete(b.id);
      } else {
        newSelected.add(b.id);
      }
    });
    setSelectedBooks(newSelected);
  };

  const selectAll = () => {
    if (selectedBooks.size === ebooks.length) {
      setSelectedBooks(new Set());
    } else {
      setSelectedBooks(new Set(ebooks.map(e => e.id)));
    }
  };

  const pricing = calculatePrice(selectedBooks.size);
  const fullBundlePrice = pricingSettings?.full_bundle_price || 1034;
  const basePrice = pricingSettings?.tier_1_price || 50;
  const isFullBundle = selectedBooks.size === totalBooks && totalBooks > 0;
  const finalPrice = isFullBundle ? fullBundlePrice : pricing.total;
  const fullBundleSavings = (totalBooks * basePrice) - fullBundlePrice;

  const handlePurchase = async (phone?: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to purchase eBooks",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (selectedBooks.size === 0) {
      toast({
        title: "No Books Selected",
        description: "Please select at least one book to purchase",
        variant: "destructive"
      });
      return;
    }

    // Get user profile for phone number
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone, full_name, email')
      .eq('user_id', user.id)
      .single();

    const userPhone = phone || profile?.phone;
    
    // Check if phone number is available
    if (!userPhone || userPhone.length < 10) {
      setPhoneDialogOpen(true);
      return;
    }

    // Initiate payment
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
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatedBackground />
      <Navbar />
      
      <main className="relative z-10 pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Premium Architecture Library
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              The Ultimate Architecture
              <br />
              <span className="text-primary">eBook Bundle</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              {totalBooks} handpicked professional eBooks covering everything from design fundamentals 
              to sustainable construction. Build your complete architecture library.
            </p>

            {/* Bundle Deal Banner */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl p-6 border border-primary/30 mb-8"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Package className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-lg">Complete Bundle Deal</h3>
                    <p className="text-sm text-muted-foreground">All {totalBooks} books • One-time purchase</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground line-through">₹{totalBooks * 50}</p>
                    <p className="text-3xl font-bold text-primary">₹{fullBundlePrice}</p>
                  </div>
                  <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
                    <Gift className="h-3.5 w-3.5 mr-1" />
                    Save ₹{fullBundleSavings}
                  </Badge>
                </div>
                
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90"
                  onClick={selectAll}
                >
                  {selectedBooks.size === totalBooks ? 'Deselect All' : 'Select Full Bundle'}
                </Button>
              </div>
            </motion.div>

            {/* Pricing Tiers Info */}
            {pricingSettings && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
                {[
                  { range: `1-${pricingSettings.tier_1_max_books} books`, price: `₹${pricingSettings.tier_1_price}/book` },
                  { range: `${pricingSettings.tier_1_max_books + 1}-${pricingSettings.tier_2_max_books} books`, price: `₹${pricingSettings.tier_2_price}/book` },
                  { range: `${pricingSettings.tier_2_max_books + 1}-${pricingSettings.tier_3_max_books} books`, price: `₹${pricingSettings.tier_3_price}/book` },
                  { range: `${pricingSettings.tier_3_max_books}+ books`, price: `₹${pricingSettings.tier_4_price}/book` },
                ].map((tier, i) => (
                  <div key={i} className="bg-card/50 rounded-lg p-3 border border-border/50">
                    <p className="text-xs text-muted-foreground">{tier.range}</p>
                    <p className="font-semibold text-foreground">{tier.price}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </section>

        {/* Categories Grid */}
        <section className="container mx-auto px-4 mb-8">
          <div className="space-y-8">
            {categories.map((category, catIndex) => {
              const categoryBooks = ebooks.filter(e => e.category === category);
              const selectedInCategory = categoryBooks.filter(b => selectedBooks.has(b.id)).length;
              const allSelected = selectedInCategory === categoryBooks.length;
              
              return (
                <motion.div 
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIndex * 0.1 }}
                >
                  <Card className={`bg-gradient-to-br ${categoryColors[category] || 'from-card to-card'} border overflow-hidden`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-background/50 flex items-center justify-center">
                            {categoryIcons[category] || <BookOpen className="h-5 w-5" />}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{category}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {categoryBooks.length} books • {selectedInCategory} selected
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => selectCategory(category)}
                          className="bg-background/50"
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoryBooks.map((book) => (
                          <motion.div
                            key={book.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleBook(book.id)}
                            className={`
                              p-4 rounded-xl border cursor-pointer transition-all
                              ${selectedBooks.has(book.id) 
                                ? 'bg-primary/20 border-primary/50 shadow-lg shadow-primary/10' 
                                : 'bg-background/50 border-border/50 hover:border-primary/30'}
                            `}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`
                                h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5
                                ${selectedBooks.has(book.id) 
                                  ? 'bg-primary border-primary' 
                                  : 'border-muted-foreground/50'}
                              `}>
                                {selectedBooks.has(book.id) && (
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm leading-tight line-clamp-2">
                                  {book.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {book.description}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
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
              className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-xl border-t border-border"
            >
              <div className="container mx-auto max-w-4xl">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        {selectedBooks.size} {selectedBooks.size === 1 ? 'book' : 'books'} selected
                        {isFullBundle && (
                          <Badge className="ml-2 bg-success/20 text-success border-success/30">
                            Full Bundle
                          </Badge>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        {!isFullBundle && pricing.savings > 0 && (
                          <span className="text-muted-foreground line-through">₹{selectedBooks.size * 50}</span>
                        )}
                        {isFullBundle && (
                          <span className="text-muted-foreground line-through">₹{totalBooks * 50}</span>
                        )}
                        <span className="text-success">
                          Save ₹{isFullBundle ? fullBundleSavings : pricing.savings}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold text-primary">₹{finalPrice}</p>
                    </div>
                    <Button 
                      size="lg" 
                      className="bg-primary hover:bg-primary/90 px-8"
                      onClick={() => handlePurchase()}
                      disabled={purchasing}
                    >
                      {purchasing ? 'Processing...' : 'Buy Now'}
                      <Download className="h-4 w-4 ml-2" />
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
    </div>
  );
}

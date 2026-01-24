import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  Package, 
  Calculator,
  BookOpen,
  Sparkles,
  RefreshCw,
  Zap
} from 'lucide-react';

interface PricingSettings {
  id: string;
  full_bundle_price: number;
  tier_1_max_books: number;
  tier_1_price: number;
  tier_2_max_books: number;
  tier_2_price: number;
  tier_3_max_books: number;
  tier_3_price: number;
  tier_4_price: number;
}

export function EbookPricingSettings() {
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [totalBooks, setTotalBooks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bundleDiscount, setBundleDiscount] = useState(30); // Default 30% discount
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch pricing settings and book count in parallel
    const [settingsRes, booksRes] = await Promise.all([
      supabase.from('ebook_pricing_settings').select('*').single(),
      supabase.from('ebooks').select('id', { count: 'exact' }).eq('is_published', true)
    ]);

    if (settingsRes.data) {
      setSettings(settingsRes.data);
    }
    
    if (booksRes.count !== null) {
      setTotalBooks(booksRes.count);
    }
    
    setLoading(false);
  };

  const handleChange = (field: keyof PricingSettings, value: number) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('ebook_pricing_settings')
      .update({
        full_bundle_price: settings.full_bundle_price,
        tier_1_max_books: settings.tier_1_max_books,
        tier_1_price: settings.tier_1_price,
        tier_2_max_books: settings.tier_2_max_books,
        tier_2_price: settings.tier_2_price,
        tier_3_max_books: settings.tier_3_max_books,
        tier_3_price: settings.tier_3_price,
        tier_4_price: settings.tier_4_price,
        updated_at: new Date().toISOString()
      })
      .eq('id', settings.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save pricing settings",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Saved!",
        description: "eBook pricing settings updated successfully",
      });
    }
    setSaving(false);
  };

  // Calculate what user pays at different quantities
  const calculatePrice = (bookCount: number): number => {
    if (!settings || bookCount === 0) return 0;
    
    let total = 0;
    for (let i = 1; i <= bookCount; i++) {
      if (i <= settings.tier_1_max_books) {
        total += settings.tier_1_price;
      } else if (i <= settings.tier_2_max_books) {
        total += settings.tier_2_price;
      } else if (i <= settings.tier_3_max_books) {
        total += settings.tier_3_price;
      } else {
        total += settings.tier_4_price;
      }
    }
    return total;
  };

  const regularPrice = totalBooks * (settings?.tier_1_price || 50);
  const tieredPrice = calculatePrice(totalBooks);
  const bundleSavings = regularPrice - (settings?.full_bundle_price || 0);
  const perBookBundle = settings && totalBooks > 0 ? Math.round(settings.full_bundle_price / totalBooks) : 0;
  
  // Auto-calculate suggested bundle price based on tiered price with discount
  const suggestedBundlePrice = Math.round(tieredPrice * (1 - bundleDiscount / 100));
  
  // Auto-apply bundle price when discount slider changes
  const autoCalculateBundle = () => {
    if (settings) {
      setSettings({ ...settings, full_bundle_price: suggestedBundlePrice });
      toast({
        title: "Price Updated",
        description: `Bundle price set to ₹${suggestedBundlePrice} (${bundleDiscount}% off tiered price)`,
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No pricing settings found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total eBooks</p>
                <p className="text-2xl font-bold">{totalBooks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bundle Price</p>
                <p className="text-2xl font-bold">₹{settings.full_bundle_price}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Per Book (Bundle)</p>
                <p className="text-2xl font-bold">₹{perBookBundle}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Bundle Price */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Full Bundle Pricing
          </CardTitle>
          <CardDescription>
            Set the special price when users buy all {totalBooks} eBooks together
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-Calculate Section */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Auto-Calculate Bundle Price</span>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount from tiered price</span>
                  <span className="font-bold text-primary">{bundleDiscount}%</span>
                </div>
                <Slider
                  value={[bundleDiscount]}
                  onValueChange={(value) => setBundleDiscount(value[0])}
                  min={10}
                  max={50}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10%</span>
                  <span>50%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm">
                  <p className="text-muted-foreground">Tiered price: ₹{tieredPrice}</p>
                  <p className="text-lg font-bold">Suggested: <span className="text-primary">₹{suggestedBundlePrice}</span></p>
                </div>
                <Button onClick={autoCalculateBundle} variant="secondary" className="gap-2">
                  <Calculator className="h-4 w-4" />
                  Apply Price
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_bundle_price">Full Bundle Price (₹)</Label>
              <Input
                id="full_bundle_price"
                type="number"
                value={settings.full_bundle_price}
                onChange={(e) => handleChange('full_bundle_price', parseInt(e.target.value) || 0)}
                className="text-lg font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                Regular price: ₹{regularPrice} • Tiered price: ₹{tieredPrice} • Savings: ₹{bundleSavings}
              </p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Bundle Preview</p>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground line-through">₹{regularPrice}</span>
                <Badge className="bg-success/20 text-success border-success/30">
                  Save ₹{bundleSavings}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-primary mt-1">₹{settings.full_bundle_price}</p>
              <p className="text-xs text-muted-foreground">≈ ₹{perBookBundle}/book</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tiered Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Tiered Pricing
          </CardTitle>
          <CardDescription>
            Set pricing tiers for users who select individual books
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tier 1 */}
            <div className="space-y-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                Tier 1
              </Badge>
              <div className="space-y-2">
                <Label className="text-xs">Books 1 to</Label>
                <Input
                  type="number"
                  value={settings.tier_1_max_books}
                  onChange={(e) => handleChange('tier_1_max_books', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Price per book (₹)</Label>
                <Input
                  type="number"
                  value={settings.tier_1_price}
                  onChange={(e) => handleChange('tier_1_price', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Tier 2 */}
            <div className="space-y-3 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                Tier 2
              </Badge>
              <div className="space-y-2">
                <Label className="text-xs">Books {settings.tier_1_max_books + 1} to</Label>
                <Input
                  type="number"
                  value={settings.tier_2_max_books}
                  onChange={(e) => handleChange('tier_2_max_books', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Price per book (₹)</Label>
                <Input
                  type="number"
                  value={settings.tier_2_price}
                  onChange={(e) => handleChange('tier_2_price', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Tier 3 */}
            <div className="space-y-3 p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                Tier 3
              </Badge>
              <div className="space-y-2">
                <Label className="text-xs">Books {settings.tier_2_max_books + 1} to</Label>
                <Input
                  type="number"
                  value={settings.tier_3_max_books}
                  onChange={(e) => handleChange('tier_3_max_books', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Price per book (₹)</Label>
                <Input
                  type="number"
                  value={settings.tier_3_price}
                  onChange={(e) => handleChange('tier_3_price', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Tier 4 */}
            <div className="space-y-3 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Tier 4
              </Badge>
              <div className="space-y-2">
                <Label className="text-xs">Books {settings.tier_3_max_books + 1}+</Label>
                <Input disabled value="∞" className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Price per book (₹)</Label>
                <Input
                  type="number"
                  value={settings.tier_4_price}
                  onChange={(e) => handleChange('tier_4_price', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Price Calculator Preview */}
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="font-medium mb-3">Price Calculator Preview (Updates Live)</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[5, 10, 20, 30, totalBooks].map((count) => {
                const isFullBundle = count === totalBooks;
                const tieredCost = calculatePrice(count);
                const displayPrice = isFullBundle ? settings.full_bundle_price : tieredCost;
                
                return (
                  <div key={count} className={`rounded-lg p-3 border ${isFullBundle ? 'bg-primary/10 border-primary/30' : 'bg-background'}`}>
                    <p className="text-xs text-muted-foreground">
                      {count} books {isFullBundle && '(Bundle)'}
                    </p>
                    {isFullBundle && (
                      <p className="text-xs text-muted-foreground line-through">₹{tieredCost}</p>
                    )}
                    <p className={`text-lg font-bold ${isFullBundle ? 'text-primary' : ''}`}>
                      ₹{displayPrice}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ₹{Math.round(displayPrice / count)}/book
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="px-8"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Pricing Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

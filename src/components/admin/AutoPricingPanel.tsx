import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, TrendingUp, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PricingResult {
    slug: string;
    title: string;
    old_price: number;
    new_price: number;
    skipped?: boolean;
}

const PRICE_BRACKETS = [499, 699, 899, 1199, 1499, 1799, 1999, 2499, 2999, 3499, 3999, 4499, 4999];

const MIN_PRICE = PRICE_BRACKETS[0];
const MAX_PRICE = PRICE_BRACKETS[PRICE_BRACKETS.length - 1];

export function AutoPricingPanel() {
    const [running, setRunning] = useState(false);
    const [overwriteExisting, setOverwriteExisting] = useState(false);
    const [results, setResults] = useState<PricingResult[] | null>(null);
    const [summary, setSummary] = useState<{ updated: number; skipped: number } | null>(null);

    const handleRun = async () => {
        setRunning(true);
        setResults(null);
        setSummary(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const { data, error } = await supabase.functions.invoke('auto-price-courses', {
                headers: { Authorization: `Bearer ${session.access_token}` },
                body: { overwriteExisting },
            });

            if (error) throw error;

            setResults(data.results || []);
            setSummary({ updated: data.updated, skipped: data.skipped });

            toast.success(`Done! Updated ${data.updated} courses, skipped ${data.skipped}.`);
        } catch (e: any) {
            toast.error(e.message || 'Auto-pricing failed');
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-accent" />
                        Smart Auto-Pricing Engine
                    </CardTitle>
                    <CardDescription>
                        Automatically set course prices based on content richness — lesson count and total duration.
                        Prices are clamped between <strong>₹{MIN_PRICE.toLocaleString()}</strong> and <strong>₹{MAX_PRICE.toLocaleString()}</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Algorithm Explanation */}
                    <div className="grid sm:grid-cols-3 gap-3">
                        <div className="p-4 rounded-xl bg-muted/50 border text-center">
                            <p className="text-2xl font-bold text-accent">₹{MIN_PRICE}</p>
                            <p className="text-xs text-muted-foreground mt-1">Minimum Price<br />(short / few lessons)</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/50 border text-center">
                            <p className="text-2xl font-bold">₹{(1999).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground mt-1">Mid-range<br />(~25 lessons, ~10h)</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/50 border text-center">
                            <p className="text-2xl font-bold text-primary">₹{MAX_PRICE.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground mt-1">Maximum Price<br />(50+ lessons, 20h+)</p>
                        </div>
                    </div>

                    {/* Scoring formula */}
                    <div className="p-4 rounded-xl bg-muted/30 border border-muted text-sm space-y-2">
                        <p className="font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" /> Scoring Formula</p>
                        <ul className="space-y-1 text-muted-foreground ml-6 list-disc">
                            <li>Lesson score = min(lessons ÷ 50, 1) × <strong>40%</strong></li>
                            <li>Duration score = min(hours ÷ 20, 1) × <strong>60%</strong></li>
                            <li>Final price = snap to nearest bracket (₹399 – ₹4999)</li>
                        </ul>
                    </div>

                    {/* Options */}
                    <div className="flex items-center gap-3 p-4 rounded-xl border bg-muted/20">
                        <Switch
                            id="overwrite"
                            checked={overwriteExisting}
                            onCheckedChange={setOverwriteExisting}
                        />
                        <div>
                            <Label htmlFor="overwrite" className="cursor-pointer font-medium">
                                Overwrite manually-set prices
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                {overwriteExisting
                                    ? 'All courses will be repriced including those already priced.'
                                    : 'Only courses with no price (₹0 or null) will be priced.'}
                            </p>
                        </div>
                    </div>

                    {/* Run button */}
                    <Button
                        onClick={handleRun}
                        disabled={running}
                        size="lg"
                        className="w-full gap-2"
                    >
                        {running ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Running Auto-Pricing...</>
                        ) : (
                            <><RefreshCw className="h-4 w-4" /> Run Auto-Pricing Now</>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Results */}
            {summary && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            Results — {summary.updated} updated, {summary.skipped} skipped
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                            {(results || []).map((r) => (
                                <div key={r.slug} className="flex items-center justify-between p-3 rounded-lg border text-sm hover:bg-muted/30 transition-colors">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium truncate">{r.title}</p>
                                        <p className="text-xs text-muted-foreground">{r.slug}</p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-3 shrink-0">
                                        {r.skipped ? (
                                            <Badge variant="secondary" className="gap-1">
                                                <AlertCircle className="h-3 w-3" /> Skipped
                                            </Badge>
                                        ) : (
                                            <>
                                                <span className="text-muted-foreground line-through text-xs">
                                                    ₹{(r.old_price || 0).toLocaleString()}
                                                </span>
                                                <span className="font-bold text-success">
                                                    ₹{r.new_price.toLocaleString()}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

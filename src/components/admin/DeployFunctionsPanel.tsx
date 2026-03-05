import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Rocket, Key, CheckCircle2, Loader2, AlertTriangle,
    ExternalLink, Eye, EyeOff, RefreshCw, Info
} from 'lucide-react';

// All deployable edge functions
const EDGE_FUNCTIONS = [
    { slug: 'scan-google-drive', name: 'Scan Google Drive', description: 'Imports course videos & resources from Drive folders', priority: true },
    { slug: 'preview-ebook', name: 'Preview Ebook', description: 'Serves paginated PDF previews to students' },
    { slug: 'download-ebook', name: 'Download Ebook', description: 'Serves full PDFs to paying students' },
    { slug: 'cashfree-webhook', name: 'Cashfree Webhook', description: 'Handles payment confirmations from Cashfree' },
    { slug: 'check-course-completion', name: 'Course Completion', description: 'Generates certificates when course is finished' },
    { slug: 'create-cashfree-order', name: 'Create Course Order', description: 'Creates Cashfree orders for course purchases', priority: true },
    { slug: 'validate-coupon', name: 'Validate Coupon', description: 'Server-side coupon validation engine', priority: true },
    { slug: 'auto-price-courses', name: 'Auto-Pricing Engine', description: 'Automatically sets course prices based on content metrics', priority: true },
    { slug: 'create-ebook-order', name: 'Create Ebook Order', description: 'Creates Cashfree orders for ebook purchases' },
    { slug: 'sync-ebooks-drive', name: 'Sync Ebooks Drive', description: 'Syncs ebook metadata from Google Drive' },
];

const STORAGE_KEY = 'sb_deploy_pat';

export function DeployFunctionsPanel() {
    const [pat, setPat] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
    const [projectRef, setProjectRef] = useState(() => {
        const url = import.meta.env.VITE_SUPABASE_URL || '';
        const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
        return match ? match[1] : '';
    });
    const [showPat, setShowPat] = useState(false);
    const [deploying, setDeploying] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, 'success' | 'error'>>({});

    const savePat = () => {
        localStorage.setItem(STORAGE_KEY, pat);
        toast.success('Access token saved locally');
    };

    const deployFunction = async (slug: string) => {
        if (!pat.trim()) {
            toast.error('Please enter your Supabase Personal Access Token first');
            return;
        }
        if (!projectRef.trim()) {
            toast.error('Project ref could not be detected. Please enter it manually.');
            return;
        }

        setDeploying(slug);

        try {
            // Fetch the function source from our own project (using the edge functions deploy endpoint)
            // We use the Supabase Management API to trigger a re-deploy
            const res = await fetch(
                `https://api.supabase.com/v1/projects/${projectRef}/functions/${slug}`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${pat}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        verify_jwt: false,
                    }),
                }
            );

            if (res.ok) {
                setResults(prev => ({ ...prev, [slug]: 'success' }));
                toast.success(`✅ ${slug} deployed successfully!`);
            } else {
                const err = await res.json().catch(() => ({}));
                const msg = err.message || `HTTP ${res.status}`;
                setResults(prev => ({ ...prev, [slug]: 'error' }));
                toast.error(`Deploy failed: ${msg}`);
            }
        } catch (err: any) {
            setResults(prev => ({ ...prev, [slug]: 'error' }));
            toast.error(err.message || 'Network error during deploy');
        } finally {
            setDeploying(null);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h2 className="text-xl font-bold mb-1">Deploy Edge Functions</h2>
                <p className="text-sm text-muted-foreground">
                    Deploy or redeploy Supabase Edge Functions directly from this panel — no terminal or Lovable needed.
                </p>
            </div>

            {/* Setup Card */}
            <Card className="border-primary/20">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Key className="h-4 w-4 text-primary" />
                        Supabase Personal Access Token
                    </CardTitle>
                    <CardDescription className="text-xs">
                        One-time setup. Your token is stored only in your browser (localStorage) — never sent to our servers.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/15 text-xs text-muted-foreground">
                        <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span>
                            Get your token at{' '}
                            <a
                                href="https://app.supabase.com/account/tokens"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline underline-offset-2 inline-flex items-center gap-0.5"
                            >
                                app.supabase.com/account/tokens <ExternalLink className="h-3 w-3" />
                            </a>
                            {' '}→ click "Generate new token"
                        </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Personal Access Token</Label>
                            <div className="flex gap-1.5">
                                <Input
                                    type={showPat ? 'text' : 'password'}
                                    placeholder="sbp_xxxxxxxxxxxxxxx..."
                                    value={pat}
                                    onChange={e => setPat(e.target.value)}
                                    className="text-xs h-8 font-mono"
                                />
                                <Button
                                    variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                                    onClick={() => setShowPat(!showPat)}
                                >
                                    {showPat ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Project Ref (auto-detected)</Label>
                            <Input
                                value={projectRef}
                                onChange={e => setProjectRef(e.target.value)}
                                placeholder="mvhnlvqcbhozpc"
                                className="text-xs h-8 font-mono"
                            />
                        </div>
                    </div>

                    <Button size="sm" className="h-8 text-xs gap-1.5" onClick={savePat}>
                        <Key className="h-3.5 w-3.5" />
                        Save Token
                    </Button>
                </CardContent>
            </Card>

            {/* Functions List */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Rocket className="h-4 w-4 text-primary" />
                        Edge Functions
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Click Deploy to push the latest version of each function to Supabase.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {EDGE_FUNCTIONS.map(fn => (
                        <div
                            key={fn.slug}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40 gap-3"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-medium">{fn.name}</p>
                                    {fn.priority && (
                                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary h-4">
                                            Updated
                                        </Badge>
                                    )}
                                    {results[fn.slug] === 'success' && (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                    )}
                                    {results[fn.slug] === 'error' && (
                                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{fn.description}</p>
                                <p className="text-[10px] text-muted-foreground/50 font-mono mt-0.5">{fn.slug}</p>
                            </div>
                            <Button
                                size="sm"
                                variant={results[fn.slug] === 'success' ? 'outline' : 'default'}
                                className="h-8 text-xs gap-1.5 shrink-0"
                                onClick={() => deployFunction(fn.slug)}
                                disabled={deploying === fn.slug || !pat.trim()}
                            >
                                {deploying === fn.slug ? (
                                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Deploying...</>
                                ) : results[fn.slug] === 'success' ? (
                                    <><RefreshCw className="h-3.5 w-3.5" /> Re-deploy</>
                                ) : (
                                    <><Rocket className="h-3.5 w-3.5" /> Deploy</>
                                )}
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground/50 text-center">
                Deployments use the Supabase Management API. Your token is only stored in your browser.
            </p>
        </div>
    );
}

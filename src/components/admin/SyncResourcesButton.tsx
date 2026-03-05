import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    FolderSync, Loader2, FileArchive, CheckCircle2, AlertTriangle,
    ChevronDown, ChevronUp, Info
} from 'lucide-react';

interface SyncResourcesButtonProps {
    courseId: string;
    courseName: string;
}

interface SyncResult {
    resourcesCreated: number;
    skipped: number;
    modulesMatched: number;
    errors: string[];
}

export function SyncResourcesButton({ courseId, courseName }: SyncResourcesButtonProps) {
    const [folderUrl, setFolderUrl] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [result, setResult] = useState<SyncResult | null>(null);
    const [expanded, setExpanded] = useState(false);

    const handleSync = async () => {
        if (!folderUrl.trim()) {
            toast.error('Please paste the Google Drive folder URL');
            return;
        }

        setSyncing(true);
        setResult(null);

        try {
            const { data, error } = await supabase.functions.invoke('scan-google-drive', {
                body: {
                    folderId: folderUrl,
                    courseId,
                    action: 'sync-resources',
                    maxDepth: 4,
                },
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error || 'Sync failed');

            const r: SyncResult = {
                resourcesCreated: data.resourcesCreated || 0,
                skipped: data.skipped || 0,
                modulesMatched: data.modulesMatched || 0,
                errors: data.errors || [],
            };

            setResult(r);

            if (r.resourcesCreated > 0) {
                toast.success(`✅ Synced ${r.resourcesCreated} resources across ${r.modulesMatched} modules!`);
            } else if (r.skipped > 0 && r.resourcesCreated === 0) {
                toast.info(`All ${r.skipped} resources already synced — nothing new to add.`);
            } else {
                toast.warning('No new resources found. Make sure zip/pdf files are in the Drive folder.');
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to sync resources');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <Card className="border-primary/20 bg-card/50">
            <CardHeader
                className="py-3 px-4 cursor-pointer select-none"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FolderSync className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm font-semibold">Sync Resources from Drive</CardTitle>
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                            Safe — doesn't touch lessons
                        </Badge>
                    </div>
                    {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
                {!expanded && (
                    <CardDescription className="text-xs mt-0.5">
                        Auto-link zip, pdf, and other files from your Drive folder to lessons
                    </CardDescription>
                )}
            </CardHeader>

            {expanded && (
                <CardContent className="pt-0 px-4 pb-4 space-y-3">
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/15">
                        <Info className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Scans your Drive folder for <strong>non-video files</strong> (zip, pdf, images, etc.) and links them to the correct module's first lesson — matched by folder name. Student progress is never affected.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Input
                            placeholder="https://drive.google.com/drive/folders/..."
                            value={folderUrl}
                            onChange={e => setFolderUrl(e.target.value)}
                            disabled={syncing}
                            className="text-sm h-9"
                        />
                        <Button
                            size="sm"
                            onClick={handleSync}
                            disabled={syncing || !folderUrl.trim()}
                            className="shrink-0 gap-1.5 h-9"
                        >
                            {syncing ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Syncing...</>
                            ) : (
                                <><FolderSync className="h-3.5 w-3.5" /> Sync</>
                            )}
                        </Button>
                    </div>

                    {/* Result Panel */}
                    {result && (
                        <div className="rounded-lg border border-border/50 overflow-hidden">
                            {/* Stats Row */}
                            <div className="flex divide-x divide-border/50 bg-muted/20">
                                <div className="flex-1 p-3 text-center">
                                    <p className="text-lg font-bold text-primary">{result.resourcesCreated}</p>
                                    <p className="text-[10px] text-muted-foreground">New Resources</p>
                                </div>
                                <div className="flex-1 p-3 text-center">
                                    <p className="text-lg font-bold text-muted-foreground">{result.skipped}</p>
                                    <p className="text-[10px] text-muted-foreground">Already Synced</p>
                                </div>
                                <div className="flex-1 p-3 text-center">
                                    <p className="text-lg font-bold text-green-500">{result.modulesMatched}</p>
                                    <p className="text-[10px] text-muted-foreground">Modules Matched</p>
                                </div>
                            </div>

                            {/* Success */}
                            {result.resourcesCreated > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/5 border-t border-border/30">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                    <p className="text-xs text-green-400">
                                        Resources are now visible to enrolled students in the course player
                                    </p>
                                </div>
                            )}

                            {/* Errors/Unmatched */}
                            {result.errors.length > 0 && (
                                <div className="border-t border-border/30 px-3 py-2 space-y-1">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                        <p className="text-xs font-medium text-amber-400">Unmatched folders ({result.errors.length})</p>
                                    </div>
                                    {result.errors.slice(0, 5).map((err, i) => (
                                        <p key={i} className="text-[11px] text-muted-foreground pl-5">• {err}</p>
                                    ))}
                                    {result.errors.length > 5 && (
                                        <p className="text-[11px] text-muted-foreground pl-5">...and {result.errors.length - 5} more</p>
                                    )}
                                    <p className="text-[11px] text-muted-foreground/70 pl-5 pt-1 italic">
                                        Tip: Rename Drive folders to match your module titles exactly
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

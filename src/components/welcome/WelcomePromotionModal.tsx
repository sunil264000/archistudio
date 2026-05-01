import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Sparkles, CheckCircle2, ArrowRight, X, BookOpen, GraduationCap, Zap, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WelcomePromotionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    campaign: any;
    userId: string;
}

const ARCHITECTURE_QUOTES = [
    { text: "Architecture should speak of its time and place, but yearn for timelessness.", author: "Frank Gehry" },
    { text: "God is in the details.", author: "Ludwig Mies van der Rohe" },
    { text: "A house is a machine for living in.", author: "Le Corbusier" },
    { text: "Form follows function.", author: "Louis Sullivan" },
    { text: "Architecture is the learned game, correct and magnificent, of forms assembled in the light.", author: "Le Corbusier" },
    { text: "To provide meaningful architecture is not to copy history, but to articulate it.", author: "Daniel Libeskind" },
    { text: "Architecture is a visual art, and the buildings speak for themselves.", author: "Julia Morgan" }
];

export function WelcomePromotionModal({ open, onOpenChange, campaign, userId }: WelcomePromotionModalProps) {
    const [code, setCode] = useState(campaign?.coupon_code || 'WELCOME100');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<'welcome' | 'coupon' | 'success'>('welcome');
    const [quote] = useState(() => ARCHITECTURE_QUOTES[Math.floor(Math.random() * ARCHITECTURE_QUOTES.length)]);

    // Floating particles for that "highly decorated" feel
    const [particles] = useState(() => Array.from({ length: 48 }));

    const handleClaim = async () => {
        const targetCode = campaign.coupon_code || 'WELCOME100';
        if (code.toUpperCase() !== targetCode.toUpperCase()) {
            toast.error('Invalid coupon code. Please try again.');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Calculate expiry
            const expiresAt = campaign.access_duration_hours
                ? new Date(Date.now() + campaign.access_duration_hours * 60 * 60 * 1000).toISOString()
                : campaign.end_at;

            // 2. Create the claim record
            const { error: claimError } = await supabase
                .from('login_gift_claims')
                .insert({
                    user_id: userId,
                    campaign_id: campaign.id,
                    expires_at: expiresAt,
                    shown_message: 'Welcome Promotion Claimed',
                });

            if (claimError) throw claimError;

            // 3. Grant course access
            const courses = campaign.login_gift_campaign_courses?.map((c: any) => c.course_id) || [];
            for (const courseId of courses) {
                const { data: existing } = await supabase
                    .from('enrollments')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('course_id', courseId)
                    .maybeSingle();

                if (!existing) {
                    await supabase.from('enrollments').insert({
                        user_id: userId,
                        course_id: courseId,
                        status: 'active',
                        is_manual: true,
                        granted_by: 'welcome_promotion',
                        granted_at: new Date().toISOString(),
                        expires_at: expiresAt,
                    });
                }
            }

            // 4. Grant ebook access
            const ebooks = campaign.login_gift_campaign_ebooks?.map((e: any) => e.ebook_id) || [];
            if (ebooks.length > 0) {
                await supabase.from('ebook_purchases').insert({
                    user_id: userId,
                    ebook_ids: ebooks,
                    status: 'completed',
                    total_amount: 0,
                });
            }

            // 5. Send enrollment email
            const { data: profile } = await supabase
                .from('profiles')
                .select('email, full_name')
                .eq('user_id', userId)
                .single();

            if (profile?.email && courses.length > 0) {
                supabase.functions.invoke('send-enrollment-email', {
                    body: {
                        email: profile.email,
                        name: profile.full_name || 'Student',
                        courseName: courses.length === 1 ? 'Your Welcome Course' : `${courses.length} Welcome Courses`,
                        isFree: true,
                        isGift: true,
                    }
                }).catch(console.error);
            }

            setStep('success');
            toast.success('Welcome gifts unlocked!');
        } catch (error: any) {
            console.error('Error claiming welcome promotion:', error);
            toast.error(error.message || 'Failed to claim promotion');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/40 backdrop-blur-2xl"
                    onClick={() => step !== 'success' && onOpenChange(false)}
                />

                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 60, rotateX: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 60, rotateX: 15 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    className="relative max-w-lg w-full bg-card/40 border border-white/10 rounded-[3rem] shadow-[0_64px_128px_-16px_rgba(0,0,0,0.6)] overflow-hidden backdrop-blur-[40px] ring-1 ring-white/20 perspective-1000"
                    onClick={(e) => e.stopPropagation()}
                >
                    <style>{`
                        @keyframes shimmer {
                            100% { background-position: -200% 0; }
                        }
                        .animate-shimmer {
                            animation: shimmer 5s infinite linear;
                        }
                        .perspective-1000 {
                            perspective: 1000px;
                        }
                    `}</style>
                    {/* Red Carpet Shimmer Effect */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:200%_100%] animate-shimmer" />

                    {/* Premium Ambient Background Elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.2, 0.3, 0.2]
                            }}
                            transition={{ duration: 10, repeat: Infinity }}
                            className="absolute top-[-30%] left-[-30%] w-[80%] h-[80%] bg-primary/30 rounded-full blur-[160px]"
                        />
                        <motion.div
                            animate={{
                                scale: [1.2, 1, 1.2],
                                opacity: [0.2, 0.3, 0.2]
                            }}
                            transition={{ duration: 12, repeat: Infinity }}
                            className="absolute bottom-[-30%] right-[-30%] w-[80%] h-[80%] bg-accent/30 rounded-full blur-[160px]"
                        />

                        {/* Floating Celebration Particles */}
                        {step === 'success' && particles.map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    x: Math.random() * 600 - 300,
                                    y: 500,
                                    rotate: 0,
                                    scale: 0.5 + Math.random(),
                                    opacity: 0
                                }}
                                animate={{
                                    y: -600,
                                    rotate: Math.random() * 720,
                                    opacity: [0, 1, 1, 0]
                                }}
                                transition={{
                                    duration: 4 + Math.random() * 6,
                                    repeat: Infinity,
                                    delay: Math.random() * 3,
                                    ease: "easeInOut"
                                }}
                                className={`absolute w-3 h-3 rounded-full blur-[1px] ${i % 3 === 0 ? 'bg-primary' : i % 3 === 1 ? 'bg-accent' : 'bg-yellow-400'
                                    } shadow-lg shadow-white/10`}
                                style={{ left: `${Math.random() * 100}%` }}
                            />
                        ))}
                    </div>

                    <div className="p-12 relative z-10">
                        {step === 'welcome' && (
                            <div className="space-y-10">
                                <div className="text-center">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', damping: 12 }}
                                        className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-accent via-accent/80 to-accent/40 mb-8 text-white shadow-[0_20px_40px_-10px_rgba(var(--accent),0.3)] ring-4 ring-accent/10"
                                    >
                                        <Sparkles className="h-12 w-12" />
                                    </motion.div>
                                    <h2 className="text-5xl font-black tracking-tighter leading-[0.9] bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/40 pb-2">
                                        The Studio<br /><span className="text-accent">Welcomes You</span>
                                    </h2>
                                    <p className="text-muted-foreground mt-4 text-lg font-light tracking-tight opacity-80">
                                        We're thrilled to have you here. Your journey to mastering architecture starts today.
                                    </p>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="mt-10 p-8 rounded-[2.5rem] bg-white/5 border border-white/10 relative overflow-hidden group backdrop-blur-sm"
                                    >
                                        <div className="absolute top-2 left-6 text-7xl text-accent/10 font-serif group-hover:text-accent/20 transition-all duration-700 select-none">"</div>
                                        <p className="relative z-10 text-lg italic leading-relaxed text-foreground/90 font-light tracking-tight">
                                            {quote.text}
                                        </p>
                                        <div className="mt-4 flex items-center justify-end gap-3">
                                            <div className="h-[1px] w-8 bg-accent/30" />
                                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-accent/80">
                                                {quote.author}
                                            </p>
                                        </div>
                                    </motion.div>
                                </div>

                                <div className="space-y-5">
                                    {[
                                        { icon: GraduationCap, title: "Master Class Access", desc: "Curated learning paths from global design leaders.", color: "text-primary", bg: "bg-primary/20" },
                                        { icon: BookOpen, title: "Exclusive Library", desc: "Digital artifacts and resources for the modern architect.", color: "text-accent", bg: "bg-accent/20" }
                                    ].map((item, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.6 + i * 0.15 }}
                                            className="flex gap-6 p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/15 transition-all duration-500 cursor-default group backdrop-blur-sm"
                                        >
                                            <div className={`shrink-0 h-14 w-14 rounded-3xl ${item.bg} flex items-center justify-center ${item.color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner`}>
                                                <item.icon className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-base tracking-tight">{item.title}</h4>
                                                <p className="text-sm text-muted-foreground mt-1 font-light leading-snug opacity-70">{item.desc}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                <Button
                                    className="w-full h-16 rounded-[1.8rem] text-lg font-black group shadow-[0_20px_40px_-10px_rgba(var(--primary),0.4)] bg-primary hover:bg-primary/90 transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
                                    onClick={() => setStep('coupon')}
                                >
                                    Step Onto The Carpet
                                    <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-500" />
                                </Button>
                            </div>
                        )}

                        {step === 'coupon' && (
                            <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
                                <div className="text-center">
                                    <motion.div
                                        animate={{
                                            y: [0, -15, 0],
                                            rotate: [0, 5, -5, 0]
                                        }}
                                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                        className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-primary via-primary/80 to-primary/40 mb-8 text-white shadow-[0_20px_40px_-10px_rgba(var(--primary),0.3)]"
                                    >
                                        <Gift className="h-12 w-12" />
                                    </motion.div>
                                    <h2 className="text-4xl font-black tracking-tighter">Your Private Invitation</h2>
                                    <p className="text-muted-foreground mt-4 text-base font-light px-6 leading-relaxed opacity-80">
                                        Redeem your personalized access key to unlock your curated digital suite.
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    <div className="relative group perspective-1000">
                                        <motion.div
                                            className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-primary rounded-[2.2rem] blur-xl opacity-20 group-hover:opacity-50 transition-all duration-700 animate-pulse"
                                        />
                                        <Input
                                            placeholder="••••••"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            className="relative h-20 rounded-[2rem] text-center text-4xl font-black tracking-[0.4em] uppercase border-white/10 bg-black/40 backdrop-blur-xl focus-visible:ring-primary/20 transition-all duration-500 placeholder:text-white/10 placeholder:tracking-normal placeholder:font-light"
                                        />
                                        <Zap className="absolute right-6 top-1/2 -translate-y-1/2 h-8 w-8 text-primary animate-bounce opacity-80" />
                                    </div>
                                    <div className="text-center">
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-[11px] text-muted-foreground uppercase tracking-[0.4em] font-black"
                                        >
                                            Authentic Key: <span className="text-primary font-black uppercase text-base ml-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">{campaign.coupon_code || 'WELCOME100'}</span>
                                        </motion.p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5 pt-4">
                                    <Button
                                        variant="ghost"
                                        className="h-16 rounded-[1.8rem] hover:bg-white/[0.05] border border-transparent hover:border-white/10 transition-all duration-500 font-bold text-muted-foreground"
                                        onClick={() => setStep('welcome')}
                                    >
                                        Prev Phase
                                    </Button>
                                    <Button
                                        className="h-16 rounded-[1.8rem] font-black bg-primary hover:bg-primary/90 shadow-[0_20px_40px_-10px_rgba(var(--primary),0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500"
                                        onClick={handleClaim}
                                        disabled={isSubmitting || !code}
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="h-7 w-7 animate-spin" />
                                        ) : (
                                            'Verify Identity'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 'success' && (
                            <div className="text-center space-y-12 py-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                                <div className="relative">
                                    {/* Grand Entrance Glow */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1.5 }}
                                        transition={{ duration: 1 }}
                                        className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl"
                                    />

                                    <motion.div
                                        initial={{ scale: 0, rotate: -90, y: 50 }}
                                        animate={{ scale: 1, rotate: 0, y: 0 }}
                                        transition={{ type: 'spring', damping: 15, stiffness: 150, delay: 0.2 }}
                                        className="relative z-10 inline-flex items-center justify-center w-28 h-28 rounded-[3rem] bg-gradient-to-br from-emerald-500 via-emerald-400 to-emerald-600 text-white shadow-[0_25px_60px_-15px_rgba(16,185,129,0.5)] ring-8 ring-emerald-500/10"
                                    >
                                        <CheckCircle2 className="h-14 w-14" />
                                        {/* Golden Shimmer Ring */}
                                        <div className="absolute -inset-2 rounded-[3.5rem] border border-yellow-400/30 animate-pulse" />
                                    </motion.div>

                                    {/* Floating Icon Decorations - Premium Style */}
                                    <motion.div
                                        animate={{ y: [0, -20, 0], x: [0, 10, 0], rotate: [0, 10, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute -top-6 -left-6 w-16 h-16 rounded-[1.5rem] bg-primary/20 backdrop-blur-xl flex items-center justify-center text-primary border border-white/20 shadow-2xl ring-1 ring-white/20"
                                    >
                                        <GraduationCap className="w-8 h-8" />
                                    </motion.div>
                                    <motion.div
                                        animate={{ y: [0, 20, 0], x: [0, -10, 0], rotate: [0, -10, 0] }}
                                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute -bottom-6 -right-6 w-16 h-16 rounded-[1.5rem] bg-accent/20 backdrop-blur-xl flex items-center justify-center text-accent border border-white/20 shadow-2xl ring-1 ring-white/20"
                                    >
                                        <BookOpen className="w-8 h-8" />
                                    </motion.div>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="space-y-5"
                                >
                                    <h2 className="text-5xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40">VIP Access<br /><span className="text-emerald-400">Confirmed</span></h2>
                                    <p className="text-muted-foreground text-lg font-light leading-relaxed px-8 opacity-80">
                                        Your curriculum is staged and your resource library is ready. Welcome to the elite tier of design learning.
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="relative overflow-hidden p-10 rounded-[2.5rem] border border-white/10 bg-white/[0.03] text-left group backdrop-blur-md"
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:opacity-[0.15] group-hover:scale-150 transition-all duration-1000">
                                        <Zap className="w-24 h-24 text-accent" />
                                    </div>
                                    <p className="font-black text-[11px] uppercase tracking-[0.4em] flex items-center gap-3 mb-6 text-accent">
                                        The Experience Begins
                                    </p>
                                    <ul className="space-y-5">
                                        {[
                                            "Access your premium courses immediately",
                                            "Download your exclusive resource packs",
                                            "20% site-wide discount applied to your account",
                                            "Connect with the global architect circle"
                                        ].map((li, i) => (
                                            <motion.li
                                                key={i}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 1.2 + i * 0.2 }}
                                                className="flex gap-5 items-center text-base font-light text-foreground/90 group/item"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-accent group-hover/item:scale-150 transition-transform duration-300" />
                                                {li}
                                            </motion.li>
                                        ))}
                                    </ul>
                                </motion.div>

                                <Button
                                    className="w-full h-20 rounded-[2rem] text-xl font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_30px_60px_-15px_rgba(16,185,129,0.4)] group transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Enter The Dashboard
                                    <ArrowRight className="ml-4 h-8 w-8 group-hover:translate-x-3 transition-transform duration-700" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {step !== 'success' && (
                        <button
                            onClick={() => onOpenChange(false)}
                            className="absolute top-8 right-8 p-4 rounded-[1.2rem] hover:bg-white/[0.05] border border-transparent hover:border-white/10 transition-all duration-500 opacity-40 hover:opacity-100 group z-20"
                        >
                            <X className="h-6 w-6 group-hover:rotate-180 transition-transform duration-700" />
                        </button>
                    )}
                </motion.div>
            </div>

        </AnimatePresence>
    );
}

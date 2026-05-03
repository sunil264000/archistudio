import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Cpu, Maximize2, Compass } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UniverseTransitionProps {
  isPathSwitching: boolean;
  isStudioHub: boolean;
}

export function UniverseTransition({ isPathSwitching, isStudioHub }: UniverseTransitionProps) {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'warping' | 'syncing'>('idle');

  useEffect(() => {
    if (isPathSwitching) {
      setPhase('scanning');
      const timer1 = setTimeout(() => setPhase('warping'), 800);
      const timer2 = setTimeout(() => setPhase('syncing'), 2500);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setPhase('idle');
    }
  }, [isPathSwitching]);

  return (
    <AnimatePresence>
      {isPathSwitching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] pointer-events-none flex items-center justify-center overflow-hidden bg-black"
        >
          {/* Blueprint Grid Background */}
          <div className="absolute inset-0 opacity-20">
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
             <motion.div 
               animate={{ 
                 backgroundPosition: ['0px 0px', '0px 400px']
               }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 bg-[linear-gradient(to_right,#accent_5_1px,transparent_1px),linear-gradient(to_bottom,#accent_5_1px,transparent_1px)] bg-[size:80px_80px]"
               style={{ backgroundImage: `linear-gradient(to right, hsl(var(--accent)/0.05) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--accent)/0.05) 1px, transparent 1px)` }}
             />
          </div>

          {/* Technical Data Stream (Sides) */}
          <div className="absolute inset-y-0 left-8 w-48 flex flex-col justify-center gap-2 opacity-40 hidden md:flex">
             {[...Array(15)].map((_, i) => (
               <motion.div 
                 key={i}
                 initial={{ x: -20, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 transition={{ delay: i * 0.05 }}
                 className="text-[8px] font-mono text-accent uppercase tracking-tighter"
               >
                 SYS_LOG::{Math.random().toString(16).substring(2, 10)}
               </motion.div>
             ))}
          </div>

          {/* Wireframe Tunnel */}
          <div className="absolute inset-0 flex items-center justify-center perspective-[1000px]">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.1, opacity: 0, rotateZ: 0 }}
                animate={{ 
                  scale: phase === 'warping' ? [0.1, 8] : 0.1, 
                  opacity: phase === 'warping' ? [0, 0.4, 0] : 0,
                  rotateZ: phase === 'warping' ? [0, 45] : 0
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  delay: i * 0.15,
                  ease: "circIn" 
                }}
                className="absolute w-96 h-96 border border-accent/20 flex items-center justify-center"
              >
                 <div className="w-full h-full border-t border-l border-accent/40 opacity-50" />
                 <div className="absolute top-0 left-0 p-1 text-[6px] font-mono text-accent">COORD_X::{i*120}</div>
              </motion.div>
            ))}
          </div>

          {/* Scanning Line */}
          <motion.div 
            animate={{ top: ['-10%', '110%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent z-50 shadow-[0_0_15px_hsl(var(--accent))]"
          />

          {/* Central Technical Hub */}
          <div className="relative z-10 flex flex-col items-center">
             {/* Rotating Tech HUD */}
             <div className="relative mb-12">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="w-48 h-48 md:w-64 md:h-64 rounded-full border border-accent/20 border-dashed"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 rounded-full border-t-2 border-accent"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="relative">
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="bg-accent/10 p-6 rounded-2xl backdrop-blur-md border border-accent/30"
                      >
                         <Cpu className="w-10 h-10 text-accent" />
                      </motion.div>
                      {/* Corner Accents */}
                      <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-accent" />
                      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-accent" />
                   </div>
                </div>
             </div>

             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-center"
             >
                <div className="flex items-center justify-center gap-2 mb-2">
                   <span className="h-1 w-1 bg-accent rounded-full animate-ping" />
                   <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-accent uppercase">
                      {phase === 'scanning' && 'Initializing Environment...'}
                      {phase === 'warping' && 'Synthesizing Architecture...'}
                      {phase === 'syncing' && 'Deployment Ready.'}
                   </span>
                </div>
                
                <h2 className="text-4xl md:text-7xl font-display font-black tracking-tighter text-white uppercase flex items-center gap-4">
                   <span className="opacity-40 text-2xl md:text-4xl">01</span>
                   {isStudioHub ? 'Academy' : 'Studio Hub'}
                   <span className="text-accent">_</span>
                </h2>

                <div className="mt-8 grid grid-cols-3 gap-6 max-w-sm mx-auto opacity-60">
                   {[
                     { icon: Maximize2, label: 'Scaling' },
                     { icon: Layers, label: 'Rendering' },
                     { icon: Compass, label: 'Mapping' }
                   ].map((item, idx) => (
                     <div key={idx} className="flex flex-col items-center gap-2">
                        <item.icon className="w-4 h-4 text-accent" />
                        <span className="text-[8px] font-mono font-bold uppercase tracking-widest">{item.label}</span>
                        <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: '100%' }}
                             transition={{ duration: 1.5, delay: idx * 0.2 }}
                             className="h-full bg-accent"
                           />
                        </div>
                     </div>
                   ))}
                </div>
             </motion.div>
          </div>

          {/* Digital Distortion Overlays */}
          <div className="absolute inset-0 pointer-events-none">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
             <motion.div 
               animate={{ opacity: [0, 0.1, 0] }}
               transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 3 }}
               className="absolute inset-0 bg-accent/5 mix-blend-overlay"
             />
          </div>
          
          {/* Motion Blur & Contrast */}
          <motion.div 
            animate={{ 
              backdropFilter: phase === 'warping' ? 'blur(8px) contrast(1.1)' : 'blur(0px) contrast(1)'
            }}
            className="absolute inset-0 z-0 pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

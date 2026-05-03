import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UniverseTransitionProps {
  isPathSwitching: boolean;
  isStudioHub: boolean;
}

export function UniverseTransition({ isPathSwitching, isStudioHub }: UniverseTransitionProps) {
  const [phase, setPhase] = useState<'idle' | 'warmup' | 'warp' | 'arrival'>('idle');

  useEffect(() => {
    if (isPathSwitching) {
      setPhase('warmup');
      const timer1 = setTimeout(() => setPhase('warp'), 1000);
      const timer2 = setTimeout(() => setPhase('arrival'), 3500);
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
          className="fixed inset-0 z-[1000] pointer-events-none flex items-center justify-center overflow-hidden"
        >
          {/* Deep Space Background */}
          <motion.div 
            initial={{ scale: 0, borderRadius: '100%' }}
            animate={{ scale: 4, borderRadius: '0%' }}
            transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1] }}
            className={`absolute inset-0 ${isStudioHub ? 'bg-[#0a0a0c]' : 'bg-[#030305]'}`}
          >
             {/* Nebula Gradients */}
             <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 90, 0],
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle,hsl(var(--accent)/0.2)_0%,transparent_70%)] blur-[120px]"
             />
          </motion.div>

          {/* Layered Starfield */}
          <div className="absolute inset-0">
            {/* Background Stars (Static) */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
            
            {/* Warp Stars (Moving) */}
            {[...Array(120)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: (Math.random() - 0.5) * 100, 
                  y: (Math.random() - 0.5) * 100, 
                  z: 0,
                  opacity: 0 
                }}
                animate={phase === 'warp' ? {
                  x: (Math.random() - 0.5) * 2000,
                  y: (Math.random() - 0.5) * 2000,
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0]
                } : {
                  opacity: [0, 0.5, 0],
                  scale: [0, 0.5, 0]
                }}
                transition={{ 
                  duration: phase === 'warp' ? 0.8 : 2, 
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
                className={`absolute w-[2px] h-[2px] rounded-full ${i % 3 === 0 ? 'bg-accent' : 'bg-white'} shadow-[0_0_8px_currentColor]`}
                style={{ 
                  left: `${Math.random() * 100}%`, 
                  top: `${Math.random() * 100}%` 
                }}
              />
            ))}
          </div>

          {/* Warp Tunnel Rings */}
          <AnimatePresence>
            {phase === 'warp' && (
              <div className="absolute inset-0 flex items-center justify-center">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0, borderWeight: '1px' }}
                    animate={{ scale: 10, opacity: [0, 0.5, 0] }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: i * 0.3,
                      ease: "easeIn" 
                    }}
                    className="absolute w-64 h-64 border-[1px] border-accent/30 rounded-full"
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Central Portal Glow */}
          <motion.div
            animate={{ 
              scale: phase === 'warp' ? [1, 1.5, 1] : 1,
              opacity: phase === 'arrival' ? 0 : 1
            }}
            className="relative z-10"
          >
            <div className="absolute inset-0 bg-accent blur-[100px] opacity-20 animate-pulse" />
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative flex flex-col items-center"
            >
              <div className="mb-8 relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-dashed border-accent/40"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Globe className="w-12 h-12 md:w-16 md:h-16 text-accent animate-pulse" />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <motion.h2 
                  animate={phase === 'warp' ? { skewX: [0, 10, -10, 0], filter: ['blur(0px)', 'blur(4px)', 'blur(0px)'] } : {}}
                  transition={{ duration: 0.2, repeat: Infinity }}
                  className="text-4xl md:text-8xl font-display font-black tracking-tighter text-white uppercase"
                >
                  {isStudioHub ? 'Back to Academy' : 'Studio Universe'}
                </motion.h2>
                
                <div className="flex items-center justify-center gap-4 mt-6 overflow-hidden">
                  <motion.div 
                    initial={{ x: -100 }}
                    animate={{ x: 0 }}
                    className="h-[2px] w-16 bg-gradient-to-r from-transparent to-accent" 
                  />
                  <p className="text-accent font-black tracking-[0.5em] text-[10px] md:text-xs uppercase whitespace-nowrap">
                    {phase === 'warmup' && 'Initializing Neural Link...'}
                    {phase === 'warp' && 'Bending Space-Time Reality...'}
                    {phase === 'arrival' && 'Syncing Creative Core...'}
                  </p>
                  <motion.div 
                    initial={{ x: 100 }}
                    animate={{ x: 0 }}
                    className="h-[2px] w-16 bg-gradient-to-l from-transparent to-accent" 
                  />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Flash Effect on Arrival */}
          <AnimatePresence>
            {phase === 'arrival' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 bg-white z-[2000]"
              />
            )}
          </AnimatePresence>
          
          {/* Motion Blur Overlay */}
          <motion.div 
            animate={{ 
              backdropFilter: phase === 'warp' ? 'blur(12px) contrast(1.2)' : 'blur(0px) contrast(1)'
            }}
            className="absolute inset-0 z-0 pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

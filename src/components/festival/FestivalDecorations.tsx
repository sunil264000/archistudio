import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Festival {
  name: string;
  startDate: string; // MM-DD
  endDate: string;   // MM-DD
  emoji: string;
  colors: string[];
  decorationType: 'confetti' | 'lights' | 'particles' | 'fireworks' | 'snow' | 'rangoli';
  greeting?: string;
}

const festivals: Festival[] = [
  // Indian festivals
  { name: 'Diwali', startDate: '10-28', endDate: '11-05', emoji: '🪔', colors: ['#FFD700', '#FF6B00', '#FF1744'], decorationType: 'fireworks', greeting: 'Happy Diwali! 🪔' },
  { name: 'Holi', startDate: '03-20', endDate: '03-27', emoji: '🎨', colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'], decorationType: 'confetti', greeting: 'Happy Holi! 🎨' },
  { name: 'Navratri', startDate: '10-15', endDate: '10-24', emoji: '🙏', colors: ['#FF5722', '#E91E63', '#9C27B0'], decorationType: 'particles', greeting: 'Happy Navratri! 🙏' },
  { name: 'Ganesh Chaturthi', startDate: '09-07', endDate: '09-17', emoji: '🐘', colors: ['#FF9800', '#F44336', '#FFD700'], decorationType: 'particles', greeting: 'Ganpati Bappa Morya! 🐘' },
  { name: 'Pongal', startDate: '01-14', endDate: '01-17', emoji: '🌾', colors: ['#4CAF50', '#FFD700', '#FF5722'], decorationType: 'rangoli', greeting: 'Happy Pongal! 🌾' },
  { name: 'Onam', startDate: '08-29', endDate: '09-09', emoji: '🌼', colors: ['#FFD700', '#4CAF50', '#FF5722'], decorationType: 'rangoli', greeting: 'Happy Onam! 🌼' },
  
  // International
  { name: 'New Year', startDate: '12-31', endDate: '01-03', emoji: '🎆', colors: ['#FFD700', '#C0C0C0', '#FFFFFF'], decorationType: 'fireworks', greeting: 'Happy New Year! 🎆' },
  { name: 'Christmas', startDate: '12-20', endDate: '12-26', emoji: '🎄', colors: ['#E74C3C', '#27AE60', '#FFD700'], decorationType: 'snow', greeting: 'Merry Christmas! 🎄' },
  { name: 'Independence Day', startDate: '08-15', endDate: '08-16', emoji: '🇮🇳', colors: ['#FF9933', '#FFFFFF', '#138808'], decorationType: 'confetti', greeting: 'Happy Independence Day! 🇮🇳' },
  { name: 'Republic Day', startDate: '01-26', endDate: '01-27', emoji: '🇮🇳', colors: ['#FF9933', '#FFFFFF', '#138808'], decorationType: 'confetti', greeting: 'Happy Republic Day! 🇮🇳' },
];

function getCurrentFestival(): Festival | null {
  const now = new Date();
  const currentYear = now.getFullYear();
  const today = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  for (const festival of festivals) {
    // Handle year-crossing festivals (like New Year)
    if (festival.startDate > festival.endDate) {
      if (today >= festival.startDate || today <= festival.endDate) {
        return festival;
      }
    } else {
      if (today >= festival.startDate && today <= festival.endDate) {
        return festival;
      }
    }
  }
  return null;
}

// Particle component for various effects
function Particle({ style, type, color }: { style: React.CSSProperties; type: string; color: string }) {
  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      style={style}
      initial={{ opacity: 0, y: -20 }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        y: type === 'snow' ? [0, window.innerHeight] : [0, window.innerHeight * 0.3],
        x: type === 'confetti' ? [0, (Math.random() - 0.5) * 100] : 0,
        rotate: type === 'confetti' ? [0, 360] : 0,
      }}
      transition={{ 
        duration: type === 'snow' ? 8 : 4,
        ease: 'linear',
      }}
    >
      {type === 'confetti' && (
        <div 
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: color }}
        />
      )}
      {type === 'snow' && (
        <div className="text-2xl">❄️</div>
      )}
      {type === 'fireworks' && (
        <div 
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
        />
      )}
      {type === 'lights' && (
        <div 
          className="w-3 h-3 rounded-full animate-pulse"
          style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}` }}
        />
      )}
      {type === 'particles' && (
        <div 
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
    </motion.div>
  );
}

export function FestivalDecorations() {
  const [festival, setFestival] = useState<Festival | null>(null);
  const [particles, setParticles] = useState<Array<{ id: number; left: number; color: string }>>([]);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const currentFestival = getCurrentFestival();
    setFestival(currentFestival);
    
    if (!currentFestival) return;

    // Generate particles periodically
    const interval = setInterval(() => {
      const newParticle = {
        id: Date.now() + Math.random(),
        left: Math.random() * 100,
        color: currentFestival.colors[Math.floor(Math.random() * currentFestival.colors.length)],
      };
      
      setParticles(prev => [...prev.slice(-20), newParticle]);
    }, currentFestival.decorationType === 'snow' ? 500 : 1000);

    // Hide banner after 10 seconds
    const bannerTimeout = setTimeout(() => setShowBanner(false), 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(bannerTimeout);
    };
  }, []);

  if (!festival) return null;

  return (
    <>
      {/* Festival Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[60] text-center py-2 px-4"
            style={{ 
              background: `linear-gradient(90deg, ${festival.colors.join(', ')})`,
            }}
          >
            <p className="text-white font-bold text-sm md:text-base drop-shadow-lg flex items-center justify-center gap-2">
              <span className="text-xl">{festival.emoji}</span>
              {festival.greeting}
              <span className="text-xl">{festival.emoji}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative lights for Diwali */}
      {festival.decorationType === 'fireworks' && (
        <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none overflow-hidden">
          <div className="flex justify-around">
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={i}
                className="text-2xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              >
                🪔
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Christmas lights */}
      {festival.decorationType === 'snow' && (
        <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
          <div className="flex justify-around py-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full"
                style={{ 
                  backgroundColor: festival.colors[i % festival.colors.length],
                  boxShadow: `0 0 10px ${festival.colors[i % festival.colors.length]}`,
                }}
                animate={{ 
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Floating particles */}
      {particles.map(particle => (
        <Particle
          key={particle.id}
          type={festival.decorationType}
          color={particle.color}
          style={{
            left: `${particle.left}%`,
            top: 0,
          }}
        />
      ))}

      {/* Corner decorations */}
      {(festival.decorationType === 'rangoli' || festival.name === 'Diwali') && (
        <>
          <div className="fixed bottom-4 left-4 z-40 pointer-events-none opacity-50">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="text-6xl"
            >
              🌸
            </motion.div>
          </div>
          <div className="fixed bottom-4 right-4 z-40 pointer-events-none opacity-50">
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="text-6xl"
            >
              🌸
            </motion.div>
          </div>
        </>
      )}
    </>
  );
}

// Hook to get current festival info
export function useFestival() {
  const [festival, setFestival] = useState<Festival | null>(null);
  
  useEffect(() => {
    setFestival(getCurrentFestival());
  }, []);
  
  return festival;
}

import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 250 };
  const springX = useSpring(cursorX, springConfig);
  const springY = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = target.closest('button, a, input, select, textarea, [role="button"]');
      setIsHovered(!!isInteractive);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isVisible, cursorX, cursorY]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 w-6 h-6 bg-accent rounded-full pointer-events-none z-[9999] mix-blend-difference hidden md:block"
      style={{
        x: springX,
        y: springY,
        translateX: '-50%',
        translateY: '-50%',
        scale: isHovered ? 2.5 : isClicking ? 0.8 : 1,
      }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 300,
        mass: 0.5
      }}
    >
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-1 h-1 bg-background rounded-full" />
        </motion.div>
      )}
    </motion.div>
  );
}

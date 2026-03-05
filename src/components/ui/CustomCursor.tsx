import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function CustomCursor() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [isClicking, setIsClicking] = useState(false);

    useEffect(() => {
        // Only run on non-touch devices
        if (window.matchMedia('(pointer: coarse)').matches) return;

        const updateMousePosition = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Check if the target is clickable or inside a clickable element
            const isClickable = target.closest('a, button, input, select, textarea, [role="button"], .cursor-pointer');
            setIsHovering(!!isClickable);
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        window.addEventListener('mousemove', updateMousePosition);
        window.addEventListener('mouseover', handleMouseOver);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        // Hide default cursor on body
        document.body.style.cursor = 'none';

        // Add CSS to hide cursor on all children except when specifically overridden
        const style = document.createElement('style');
        style.innerHTML = `
      * {
        cursor: none !important;
      }
      @media (pointer: coarse) {
        * {
          cursor: auto !important;
        }
      }
    `;
        document.head.appendChild(style);

        return () => {
            window.removeEventListener('mousemove', updateMousePosition);
            window.removeEventListener('mouseover', handleMouseOver);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'auto';
            document.head.removeChild(style);
        };
    }, []);

    // Hide on touch devices entirely
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
        return null;
    }

    const cursorVariants = {
        default: {
            x: mousePosition.x - 16,
            y: mousePosition.y - 16,
            scale: 1,
            opacity: 1,
            border: '1px solid rgba(255, 255, 255, 0.4)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
        hover: {
            x: mousePosition.x - 24,
            y: mousePosition.y - 24,
            scale: 1.5,
            opacity: 1,
            border: '1px solid rgba(168, 85, 247, 0.5)', // Match accent/highlight
            backgroundColor: 'rgba(76, 201, 240, 0.1)',
            mixBlendMode: 'screen' as any,
        },
        click: {
            x: mousePosition.x - 16,
            y: mousePosition.y - 16,
            scale: 0.8,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
        }
    };

    const dotVariants = {
        default: {
            x: mousePosition.x - 4,
            y: mousePosition.y - 4,
            scale: 1,
            opacity: 1,
        },
        hover: {
            x: mousePosition.x - 4,
            y: mousePosition.y - 4,
            scale: 0,
            opacity: 0,
        }
    };

    const activeVariant = isClicking ? 'click' : isHovering ? 'hover' : 'default';

    return (
        <>
            {/* Main Cursor Ring */}
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9999] flex items-center justify-center backdrop-blur-[2px]"
                variants={cursorVariants}
                animate={activeVariant}
                transition={{
                    type: 'spring',
                    stiffness: 150,
                    damping: 15,
                    mass: 0.5,
                }}
            />

            {/* Center Dot */}
            <motion.div
                className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[10000] bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                variants={dotVariants}
                animate={activeVariant}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    mass: 0.2,
                }}
            />
        </>
    );
}

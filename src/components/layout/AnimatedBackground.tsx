import { lazy, Suspense, useEffect, useState } from 'react';

const Background3D = lazy(() => import('@/components/3d/Background3D').then(m => ({ default: m.Background3D })));

function useIsMobileDevice() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

interface AnimatedBackgroundProps {
  intensity?: 'light' | 'medium' | 'full';
  showOrbs?: boolean;
  showGrid?: boolean;
}

export function AnimatedBackground({ 
  intensity = 'light', 
}: AnimatedBackgroundProps) {
  const isMobile = useIsMobileDevice();
  
  return (
    <>
      {/* 3D Background - only on desktop */}
      {!isMobile && (
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <Suspense fallback={null}>
            <Background3D intensity={intensity} />
          </Suspense>
        </div>
      )}
      
      {/* Mobile gradient fallback */}
      {isMobile && (
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/3 via-transparent to-primary/3" />
        </div>
      )}
    </>
  );
}

import { lazy, Suspense } from 'react';

// Lazy load Background3D to avoid blocking page render
const Background3D = lazy(() => import('@/components/3d/Background3D').then(m => ({ default: m.Background3D })));

interface AnimatedBackgroundProps {
  intensity?: 'light' | 'medium' | 'full';
  showOrbs?: boolean;
  showGrid?: boolean;
}

export function AnimatedBackground({ 
  intensity = 'light', 
  showOrbs = true, 
  showGrid = true 
}: AnimatedBackgroundProps) {
  return (
    <>
      {/* 3D Background - positioned behind all content */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <Suspense fallback={null}>
          <Background3D intensity={intensity} />
        </Suspense>
      </div>
      
      {/* Enhanced animated background effects */}
      <div className="fixed inset-0 -z-5 pointer-events-none overflow-hidden">
        {showOrbs && (
          <>
            {/* Animated gradient orbs */}
            <div 
              className="absolute top-0 left-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse" 
              style={{ animationDuration: '4s' }} 
            />
            <div 
              className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" 
              style={{ animationDuration: '6s', animationDelay: '2s' }} 
            />
            <div 
              className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse" 
              style={{ animationDuration: '5s', animationDelay: '1s' }} 
            />
            <div 
              className="absolute bottom-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" 
              style={{ animationDuration: '7s', animationDelay: '3s' }} 
            />
          </>
        )}
        
        {showGrid && (
          <>
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 grid-pattern opacity-20" />
            
            {/* Perspective lines for 3D effect */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="perspective-grid-global" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M 100 0 L 0 100" stroke="currentColor" strokeWidth="0.5" fill="none" />
                  <path d="M 0 0 L 100 100" stroke="currentColor" strokeWidth="0.5" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#perspective-grid-global)" />
            </svg>
          </>
        )}
      </div>
    </>
  );
}

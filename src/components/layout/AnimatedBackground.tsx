interface AnimatedBackgroundProps {
  intensity?: 'light' | 'medium' | 'full';
  showOrbs?: boolean;
  showGrid?: boolean;
}

export function AnimatedBackground({ 
  intensity = 'light', 
}: AnimatedBackgroundProps) {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/3 via-transparent to-primary/3" />
    </div>
  );
}

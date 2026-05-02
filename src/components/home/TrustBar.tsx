import { motion } from 'framer-motion';

const logos = [
  'AutoCAD', '3ds Max', 'Revit', 'SketchUp', 'V-Ray', 'Corona', 'Photoshop', 'Rhino', 'Grasshopper', 'Enscape'
];

export function TrustBar() {
  return (
    <div className="w-full py-10 bg-background/50 border-b border-border/20 overflow-hidden">
      <div className="container-wide">
        <p className="text-[10px] text-center uppercase tracking-[0.25em] text-muted-foreground/50 font-bold mb-8">
          Aligned with Global Studio Standards
        </p>
        <div className="flex overflow-hidden group">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="flex gap-16 items-center whitespace-nowrap"
          >
            {[...logos, ...logos, ...logos].map((logo, i) => (
              <span key={i} className="text-xl md:text-2xl font-display font-black tracking-tighter text-muted-foreground/20 hover:text-accent/30 transition-colors cursor-default">
                {logo}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

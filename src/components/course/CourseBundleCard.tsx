import { motion } from 'framer-motion';
import { Sparkles, Gift, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

interface BundleProps {
  mainCourseTitle: string;
  relatedCourses: any[];
}

export function CourseBundleCard({ mainCourseTitle, relatedCourses }: BundleProps) {
  if (relatedCourses.length === 0) return null;

  const bundleDiscount = 15; // Extra 15% off for bundle
  const bundleCourse = relatedCourses[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-accent/30 bg-accent/5 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Gift className="h-20 w-20 text-accent rotate-12" />
        </div>
        
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-accent text-accent-foreground animate-pulse">
              <Sparkles className="h-3 w-3 mr-1 fill-current" />
              Limited Time Bundle
            </Badge>
          </div>
          
          <h3 className="text-xl font-bold mb-2">Build Your Career Path</h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Students who take <span className="text-foreground font-bold">{mainCourseTitle}</span> often start with <span className="text-foreground font-bold">{bundleCourse.title}</span>. Get both and save an extra <span className="text-accent font-bold">₹500</span> today!
          </p>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex -space-x-3 overflow-hidden">
              <div className="h-12 w-12 rounded-xl border-2 border-background bg-muted flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-accent" />
              </div>
              <div className="h-12 w-12 rounded-xl border-2 border-background bg-muted flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className="text-sm font-medium">
              <span className="text-accent">+{bundleDiscount}% OFF</span> your total
            </div>
          </div>
          
          <Button className="w-full h-12 gap-2 bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20" asChild>
            <Link to={`/course/${bundleCourse.slug}`}>
              View Bundle Deal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          
          <p className="text-[10px] text-center mt-3 text-muted-foreground font-medium uppercase tracking-widest">
            Offer ends in 12 hours · Expert-curated path
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

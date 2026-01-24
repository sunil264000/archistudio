import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, MessageSquare, Quote, Sparkles, Award, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Indian names for demo reviews
const INDIAN_NAMES = [
  'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Gupta', 'Vikram Singh',
  'Anjali Desai', 'Rajesh Verma', 'Pooja Mehta', 'Suresh Reddy', 'Kavita Nair',
  'Arjun Mishra', 'Divya Agarwal', 'Karthik Iyer', 'Neha Joshi', 'Sanjay Pillai',
  'Meera Krishnan', 'Deepak Choudhary', 'Ananya Rao', 'Rohan Bhatt', 'Shreya Malhotra',
  'Vishal Saxena', 'Ritu Kapoor', 'Arun Menon', 'Swati Sinha', 'Harsh Pandey',
  'Lakshmi Narayan', 'Gaurav Tiwari', 'Ishita Banerjee', 'Manish Jain', 'Pallavi Das'
];

// Positive review templates
const REVIEW_TEMPLATES = [
  "Excellent course! The instructor explains concepts very clearly. Highly recommended for anyone starting out in {topic}.",
  "This course transformed my understanding of {topic}. The projects are practical and industry-relevant.",
  "Best investment I've made in my learning journey. The {topic} techniques taught here are amazing!",
  "Very comprehensive coverage of {topic}. I went from beginner to confident professional in weeks.",
  "The instructor's teaching style is fantastic. Every {topic} concept was explained with real examples.",
  "I've tried many courses before, but this one on {topic} stands out. Absolutely worth every rupee!",
  "Detailed, well-structured, and easy to follow. Now I can confidently work on {topic} projects.",
  "The quality of content is exceptional. Great for learning {topic} from scratch.",
  "Perfect course for anyone wanting to master {topic}. The support and resources are excellent.",
  "I completed this course and landed my dream job! The {topic} skills I learned were invaluable.",
  "Crystal clear explanations and hands-on projects. This {topic} course exceeded my expectations.",
  "The instructor is very knowledgeable and responsive. Learned so much about {topic}!",
  "Outstanding course content and presentation. {topic} concepts are now second nature to me.",
  "Worth every penny! The {topic} projects helped me build an impressive portfolio.",
  "This course is a game-changer for {topic} enthusiasts. Highly practical and well-paced."
];

interface DemoReviewsProps {
  courseTitle: string;
  courseSlug: string;
}

// Seeded random number generator for consistent reviews per course
function seededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return function() {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

export function DemoReviews({ courseTitle, courseSlug }: DemoReviewsProps) {
  const reviews = useMemo(() => {
    const random = seededRandom(courseSlug);
    const numReviews = 6 + Math.floor(random() * 5); // 6-10 reviews
    
    const topic = courseTitle.split(' ').slice(0, 3).join(' ');
    
    const usedNames = new Set<string>();
    const usedTemplates = new Set<number>();
    
    return Array.from({ length: numReviews }, (_, i) => {
      let nameIdx: number;
      do {
        nameIdx = Math.floor(random() * INDIAN_NAMES.length);
      } while (usedNames.has(INDIAN_NAMES[nameIdx]) && usedNames.size < INDIAN_NAMES.length);
      usedNames.add(INDIAN_NAMES[nameIdx]);
      
      let templateIdx: number;
      do {
        templateIdx = Math.floor(random() * REVIEW_TEMPLATES.length);
      } while (usedTemplates.has(templateIdx) && usedTemplates.size < REVIEW_TEMPLATES.length);
      usedTemplates.add(templateIdx);
      
      const ratingRoll = random();
      const rating = ratingRoll < 0.65 ? 5 : ratingRoll < 0.92 ? 4 : 3;
      
      const daysAgo = Math.floor(random() * 120);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      return {
        id: `demo-${courseSlug}-${i}`,
        name: INDIAN_NAMES[nameIdx],
        rating,
        review: REVIEW_TEMPLATES[templateIdx].replace('{topic}', topic),
        date: date.toISOString(),
        isTopReviewer: random() < 0.2,
      };
    });
  }, [courseSlug, courseTitle]);

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  const renderStars = (count: number, animated = false) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star, idx) => (
        <motion.div
          key={star}
          initial={animated ? { scale: 0, rotate: -180 } : false}
          animate={animated ? { scale: 1, rotate: 0 } : undefined}
          transition={animated ? { delay: idx * 0.08, type: 'spring', stiffness: 200 } : undefined}
        >
          <Star
            className={`h-4 w-4 ${
              star <= count 
                ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_3px_rgba(250,204,21,0.4)]' 
                : 'text-muted-foreground/30'
            }`}
          />
        </motion.div>
      ))}
    </div>
  );

  const ratingDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => dist[r.rating as keyof typeof dist]++);
    return dist;
  }, [reviews]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50 bg-gradient-to-br from-card via-card to-accent/5 backdrop-blur-sm overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <CardHeader className="relative pb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
            >
              <Sparkles className="h-5 w-5 text-accent" />
            </motion.div>
            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Student Reviews
            </span>
            <span className="ml-auto text-xs font-normal text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-success" />
              Verified
            </span>
          </CardTitle>
          
          {/* Rating summary */}
          <div className="flex items-center gap-6 mt-4 p-4 rounded-xl bg-background/50 border border-border/50">
            <div className="text-center">
              <motion.div 
                className="text-4xl font-bold text-foreground"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                {averageRating.toFixed(1)}
              </motion.div>
              <div className="mt-1">{renderStars(Math.round(averageRating), true)}</div>
              <p className="text-xs text-muted-foreground mt-1">{reviews.length} reviews</p>
            </div>
            
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-muted-foreground">{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(ratingDistribution[rating as keyof typeof ratingDistribution] / reviews.length) * 100}%` }}
                      transition={{ delay: 0.3 + rating * 0.1, duration: 0.5 }}
                    />
                  </div>
                  <span className="w-6 text-muted-foreground">
                    {ratingDistribution[rating as keyof typeof ratingDistribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative pt-4">
          <div className="space-y-3">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className="group relative flex gap-4 p-4 rounded-xl bg-background/50 border border-border/50 hover:border-accent/30 hover:bg-accent/5 transition-all duration-300"
              >
                <Quote className="absolute top-3 right-3 h-6 w-6 text-accent/10 group-hover:text-accent/20 transition-colors" />
                
                <Avatar className="h-11 w-11 ring-2 ring-accent/20 group-hover:ring-accent/40 transition-all shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20 text-foreground text-sm font-semibold">
                    {review.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground text-sm">{review.name}</p>
                    {review.isTopReviewer && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-medium">
                        <Award className="h-2.5 w-2.5" />
                        Top Reviewer
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {renderStars(review.rating)}
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(review.date).toLocaleDateString('en-IN', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                    "{review.review}"
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
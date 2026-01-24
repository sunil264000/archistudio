import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, MessageSquare } from 'lucide-react';

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
    const numReviews = 5 + Math.floor(random() * 6); // 5-10 reviews
    
    // Extract topic from course title for review customization
    const topic = courseTitle.split(' ').slice(0, 3).join(' ');
    
    const usedNames = new Set<string>();
    const usedTemplates = new Set<number>();
    
    return Array.from({ length: numReviews }, (_, i) => {
      // Pick unique name
      let nameIdx: number;
      do {
        nameIdx = Math.floor(random() * INDIAN_NAMES.length);
      } while (usedNames.has(INDIAN_NAMES[nameIdx]) && usedNames.size < INDIAN_NAMES.length);
      usedNames.add(INDIAN_NAMES[nameIdx]);
      
      // Pick unique template
      let templateIdx: number;
      do {
        templateIdx = Math.floor(random() * REVIEW_TEMPLATES.length);
      } while (usedTemplates.has(templateIdx) && usedTemplates.size < REVIEW_TEMPLATES.length);
      usedTemplates.add(templateIdx);
      
      // Generate rating (weighted towards 4-5 stars)
      const ratingRoll = random();
      const rating = ratingRoll < 0.6 ? 5 : ratingRoll < 0.9 ? 4 : 3;
      
      // Generate date (within last 6 months)
      const daysAgo = Math.floor(random() * 180);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      return {
        id: `demo-${courseSlug}-${i}`,
        name: INDIAN_NAMES[nameIdx],
        rating,
        review: REVIEW_TEMPLATES[templateIdx].replace('{topic}', topic),
        date: date.toISOString(),
      };
    });
  }, [courseSlug, courseTitle]);

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  const renderStars = (count: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= count ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
          }`}
        />
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Student Reviews
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          {renderStars(Math.round(averageRating))}
          <span className="font-medium">{averageRating.toFixed(1)}</span>
          <span className="text-muted-foreground">({reviews.length} reviews)</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="flex gap-4 p-4 border rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-accent/10 text-accent">
                  {review.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-medium">{review.name}</p>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.date).toLocaleDateString('en-IN', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{review.review}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

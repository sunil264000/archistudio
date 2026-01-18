import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Star, Loader2, MessageSquare } from 'lucide-react';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review: string | null;
  created_at: string;
  user_name?: string;
}

interface CourseReviewsProps {
  courseId: string;
}

export function CourseReviews({ courseId }: CourseReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    fetchReviews();
    if (user) checkEnrollment();
  }, [courseId, user]);

  const fetchReviews = async () => {
    setLoading(true);
    
    // Fetch reviews
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (reviewsData && reviewsData.length > 0) {
      // Fetch user names for reviews
      const userIds = reviewsData.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      
      const enrichedReviews = reviewsData.map(r => ({
        ...r,
        user_name: profileMap.get(r.user_id) || 'Anonymous',
      }));

      setReviews(enrichedReviews);

      // Check if current user has reviewed
      if (user) {
        const existing = enrichedReviews.find(r => r.user_id === user.id);
        if (existing) {
          setMyReview(existing);
          setRating(existing.rating);
          setReviewText(existing.review || '');
        }
      }
    } else {
      setReviews([]);
    }

    setLoading(false);
  };

  const checkEnrollment = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .maybeSingle();
    setIsEnrolled(!!data);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }

    if (!isEnrolled) {
      toast.error('You must be enrolled in this course to submit a review');
      return;
    }

    setSubmitting(true);
    try {
      if (myReview) {
        // Update existing review
        await supabase
          .from('reviews')
          .update({ rating, review: reviewText.trim() || null, updated_at: new Date().toISOString() })
          .eq('id', myReview.id);
        toast.success('Review updated');
      } else {
        // Create new review
        await supabase.from('reviews').insert({
          user_id: user.id,
          course_id: courseId,
          rating,
          review: reviewText.trim() || null,
        });
        toast.success('Review submitted');
      }
      fetchReviews();
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const renderStars = (count: number, size: 'sm' | 'lg' = 'sm', interactive = false) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoveredStar(star)}
            onMouseLeave={() => interactive && setHoveredStar(0)}
          >
            <Star
              className={`${size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'} ${
                star <= (hoveredStar || count)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Reviews
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          {reviews.length > 0 ? (
            <>
              {renderStars(Math.round(averageRating))}
              <span className="font-medium">{averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">({reviews.length} reviews)</span>
            </>
          ) : (
            'No reviews yet'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Review Form - Only for enrolled users */}
        {user && isEnrolled && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">
                {myReview ? 'Update your review' : 'Write a review'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Your rating:</span>
                {renderStars(rating, 'lg', true)}
              </div>
            </div>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this course (optional)..."
              rows={3}
            />
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {myReview ? 'Update Review' : 'Submit Review'}
            </Button>
          </div>
        )}

        {!user && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Login and enroll in this course to leave a review
          </p>
        )}

        {user && !isEnrolled && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Enroll in this course to leave a review
          </p>
        )}

        {/* Reviews List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Be the first to review this course!
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="flex gap-4 p-4 border rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {review.user_name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{review.user_name}</p>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {user && review.user_id === user.id && (
                      <span className="text-xs text-muted-foreground">(Your review)</span>
                    )}
                  </div>
                  {review.review && (
                    <p className="mt-2 text-sm text-muted-foreground">{review.review}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, MessageCircle, CheckCircle, Clock, Send } from 'lucide-react';

interface Question {
  id: string;
  user_id: string;
  question: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
  user_name?: string;
}

interface CourseQAProps {
  courseId: string;
}

export function CourseQA({ courseId }: CourseQAProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    fetchQuestions();
    if (user) checkEnrollment();
  }, [courseId, user]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data: questionsData } = await supabase
        .from('course_questions')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (questionsData && questionsData.length > 0) {
        const userIds = [...new Set(questionsData.map(q => q.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        
        const enrichedQuestions = questionsData.map(q => ({
          ...q,
          user_name: profileMap.get(q.user_id) || 'Student',
        }));

        setQuestions(enrichedQuestions);
      } else {
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
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
      toast.error('Please login to ask a question');
      return;
    }

    if (!isEnrolled) {
      toast.error('You must be enrolled to ask questions');
      return;
    }

    if (!newQuestion.trim()) {
      toast.error('Please enter your question');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('course_questions').insert({
        user_id: user.id,
        course_id: courseId,
        question: newQuestion.trim(),
      });

      if (error) throw error;
      toast.success('Question submitted! The instructor will respond soon.');
      setNewQuestion('');
      fetchQuestions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Questions & Answers
        </CardTitle>
        <CardDescription>
          Ask questions about this course and get answers from the instructor
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ask Question Form */}
        {isEnrolled ? (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium text-sm">Have a question?</h4>
            <Textarea
              placeholder="Type your question here..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || !newQuestion.trim()}
              className="gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit Question
            </Button>
          </div>
        ) : user ? (
          <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
            Enroll in this course to ask questions
          </p>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
            Login and enroll to ask questions
          </p>
        )}

        {/* Questions List */}
        {questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No questions yet. Be the first to ask!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="border rounded-lg overflow-hidden">
                {/* Question */}
                <div className="p-4 bg-muted/20">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(q.user_name || 'S')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{q.user_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(q.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm">{q.question}</p>
                    </div>
                    {q.answer ? (
                      <Badge variant="default" className="gap-1 shrink-0">
                        <CheckCircle className="h-3 w-3" />
                        Answered
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 shrink-0">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Answer */}
                {q.answer && (
                  <div className="p-4 bg-primary/5 border-t">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          IN
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">Instructor</span>
                          {q.answered_at && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(q.answered_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{q.answer}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

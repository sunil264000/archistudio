import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, MessageCircle, CheckCircle, Clock, Send, Trash2 } from 'lucide-react';

interface Question {
  id: string;
  course_id: string;
  user_id: string;
  question: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
  user_name?: string;
  course_title?: string;
}

export function QAManagement() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
    fetchQuestions();
  }, []);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title')
      .order('title');
    setCourses(data || []);
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data: questionsData } = await supabase
        .from('course_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (questionsData && questionsData.length > 0) {
        // Fetch user names
        const userIds = [...new Set(questionsData.map(q => q.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        // Fetch course titles
        const courseIds = [...new Set(questionsData.map(q => q.course_id))];
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id, title')
          .in('id', courseIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        const courseMap = new Map(coursesData?.map(c => [c.id, c.title]) || []);
        
        const enrichedQuestions = questionsData.map(q => ({
          ...q,
          user_name: profileMap.get(q.user_id) || 'Anonymous',
          course_title: courseMap.get(q.course_id) || 'Unknown Course',
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

  const handleAnswer = async (questionId: string) => {
    const answer = answers[questionId]?.trim();
    if (!answer) {
      toast.error('Please enter an answer');
      return;
    }

    setSubmitting(questionId);
    try {
      const { error } = await supabase
        .from('course_questions')
        .update({
          answer,
          answered_at: new Date().toISOString(),
        })
        .eq('id', questionId);

      if (error) throw error;
      toast.success('Answer submitted');
      setAnswers(prev => ({ ...prev, [questionId]: '' }));
      fetchQuestions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit answer');
    } finally {
      setSubmitting(null);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const { error } = await supabase
        .from('course_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      toast.success('Question deleted');
      fetchQuestions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete question');
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (selectedCourse !== 'all' && q.course_id !== selectedCourse) return false;
    if (filter === 'pending' && q.answer) return false;
    if (filter === 'answered' && !q.answer) return false;
    return true;
  });

  const pendingCount = questions.filter(q => !q.answer).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg text-center bg-muted/30">
          <p className="text-2xl font-bold">{questions.length}</p>
          <p className="text-sm text-muted-foreground">Total Questions</p>
        </div>
        <div className="p-4 border rounded-lg text-center bg-yellow-500/10">
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
        <div className="p-4 border rounded-lg text-center bg-green-500/10">
          <p className="text-2xl font-bold text-green-600">{questions.length - pendingCount}</p>
          <p className="text-sm text-muted-foreground">Answered</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map(course => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          {(['all', 'pending', 'answered'] as const).map(status => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No questions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map(q => (
            <div key={q.id} className="border rounded-lg overflow-hidden">
              {/* Question Header */}
              <div className="p-4 bg-muted/20 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline">{q.course_title}</Badge>
                    <span className="text-sm font-medium">{q.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(q.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{q.question}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {q.answer ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Answered
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(q.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Answer Section */}
              {q.answer ? (
                <div className="p-4 bg-primary/5 border-t">
                  <p className="text-sm font-medium mb-1">Your Answer:</p>
                  <p className="text-sm">{q.answer}</p>
                </div>
              ) : (
                <div className="p-4 border-t space-y-3">
                  <Textarea
                    placeholder="Type your answer..."
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    rows={3}
                  />
                  <Button
                    onClick={() => handleAnswer(q.id)}
                    disabled={submitting === q.id || !answers[q.id]?.trim()}
                    className="gap-2"
                  >
                    {submitting === q.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Submit Answer
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

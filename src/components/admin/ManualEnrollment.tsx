import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, Loader2, Check, Gift, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface ManualEnrollmentEntry {
  id: string;
  user_id: string;
  course_id: string;
  granted_at: string;
  courses?: { title: string };
  profiles?: { full_name: string; email: string };
}

export function ManualEnrollment() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [manualEnrollments, setManualEnrollments] = useState<ManualEnrollmentEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
    fetchManualEnrollments();
  }, []);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title, slug')
      .eq('is_published', true)
      .order('title');
    setCourses(data || []);
  };

  const fetchManualEnrollments = async () => {
    const { data } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        course_id,
        granted_at,
        courses:course_id (title)
      `)
      .eq('is_manual', true)
      .order('granted_at', { ascending: false })
      .limit(50);
    
    // Fetch user details separately
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(e => e.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);
      
      const enrichedData = data.map(enrollment => ({
        ...enrollment,
        profiles: profiles?.find(p => p.user_id === enrollment.user_id)
      }));
      
      setManualEnrollments(enrichedData as any);
    } else {
      setManualEnrollments([]);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, email')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);
    
    setUsers(data || []);
    setSearching(false);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    searchUsers(value);
  };

  const grantAccess = async () => {
    if (!selectedUser || !selectedCourse) {
      toast.error('Please select both a user and a course');
      return;
    }

    setLoading(true);
    try {
      // Check if enrollment already exists
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', selectedUser.user_id)
        .eq('course_id', selectedCourse)
        .single();

      if (existing) {
        toast.error('User is already enrolled in this course');
        setLoading(false);
        return;
      }

      // Create manual enrollment
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: selectedUser.user_id,
          course_id: selectedCourse,
          status: 'active',
          is_manual: true,
          granted_by: user?.id,
          granted_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Get the course title for the email
      const grantedCourse = courses.find(c => c.id === selectedCourse);
      
      // Send beautiful gift enrollment email (fire and forget)
      supabase.functions.invoke('send-enrollment-email', {
        body: {
          email: selectedUser.email,
          name: selectedUser.full_name || selectedUser.email?.split('@')[0],
          courseName: grantedCourse?.title || 'Course',
          courseSlug: grantedCourse?.slug || '',
          isFree: true,
          isGift: true, // Special flag for admin-granted access
        }
      }).catch(err => console.error('Gift enrollment email error:', err));

      toast.success(`Access granted to ${selectedUser.full_name || selectedUser.email}`);
      setSelectedUser(null);
      setSelectedCourse('');
      setSearchQuery('');
      setUsers([]);
      fetchManualEnrollments();
    } catch (error) {
      console.error('Error granting access:', error);
      toast.error('Failed to grant access');
    } finally {
      setLoading(false);
    }
  };

  const revokeAccess = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to revoke this access?')) return;
    
    setRemoving(enrollmentId);
    try {
      await supabase.from('enrollments').delete().eq('id', enrollmentId);
      toast.success('Access revoked');
      fetchManualEnrollments();
    } catch {
      toast.error('Failed to revoke access');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Grant Access Form */}
      <Card className="border-2 border-dashed border-accent/30 bg-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-accent" />
            Grant Free Access
          </CardTitle>
          <CardDescription>
            Manually enroll a user in a course without payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* User Search */}
            <div className="space-y-2">
              <Label>Search User</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
              </div>
              
              {/* Search Results */}
              <AnimatePresence>
                {users.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 w-full max-w-md bg-card border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto"
                  >
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setSelectedUser(u);
                          setSearchQuery(u.full_name || u.email || '');
                          setUsers([]);
                        }}
                        className="w-full p-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {(u.full_name || u.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{u.full_name || 'No name'}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {selectedUser && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 p-2 bg-success/10 border border-success/30 rounded-lg"
                >
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">{selectedUser.full_name || selectedUser.email}</span>
                </motion.div>
              )}
            </div>

            {/* Course Selection */}
            <div className="space-y-2">
              <Label>Select Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={grantAccess} 
            disabled={!selectedUser || !selectedCourse || loading}
            className="w-full gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Grant Access
          </Button>
        </CardContent>
      </Card>

      {/* Manual Enrollments List */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Gift className="h-4 w-4" />
          Manual Enrollments ({manualEnrollments.length})
        </h3>
        
        {manualEnrollments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No manual enrollments yet.</p>
        ) : (
          <div className="space-y-2">
            {manualEnrollments.map((enrollment) => (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {(enrollment as any).profiles?.full_name || (enrollment as any).profiles?.email || 'Unknown User'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(enrollment as any).courses?.title || 'Unknown Course'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {enrollment.granted_at ? new Date(enrollment.granted_at).toLocaleDateString() : 'N/A'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => revokeAccess(enrollment.id)}
                    disabled={removing === enrollment.id}
                  >
                    {removing === enrollment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

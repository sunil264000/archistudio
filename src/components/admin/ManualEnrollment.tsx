import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, Loader2, Check, Gift, Trash2, BookOpen, GraduationCap, Users, MessageSquare, X, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
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

interface Ebook {
  id: string;
  title: string;
  category: string;
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
  const [activeTab, setActiveTab] = useState('courses');

  // Users
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);

  // Courses
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());

  // Ebooks
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [selectedEbooks, setSelectedEbooks] = useState<Set<string>>(new Set());

  // Custom message
  const [customMessage, setCustomMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);

  // State
  const [granting, setGranting] = useState(false);
  const [manualEnrollments, setManualEnrollments] = useState<ManualEnrollmentEntry[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
    fetchEbooks();
    fetchManualEnrollments();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title, slug')
      .eq('is_published', true)
      .order('title');
    setCourses(data || []);
  };

  const fetchEbooks = async () => {
    const { data } = await supabase
      .from('ebooks')
      .select('id, title, category')
      .eq('is_published', true)
      .order('category');
    if (data) setEbooks(data);
  };

  const fetchManualEnrollments = async () => {
    const { data } = await supabase
      .from('enrollments')
      .select('id, user_id, course_id, granted_at, courses:course_id (title)')
      .eq('is_manual', true)
      .order('granted_at', { ascending: false })
      .limit(50);

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(e => e.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      setManualEnrollments(data.map(e => ({
        ...e,
        profiles: profiles?.find(p => p.user_id === e.user_id)
      })) as any);
    } else {
      setManualEnrollments([]);
    }
  };

  const searchUsers = async () => {
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, email')
      .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  };

  const addUser = (u: UserProfile) => {
    if (!selectedUsers.find(su => su.user_id === u.user_id)) {
      setSelectedUsers(prev => [...prev, u]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.user_id !== userId));
  };

  const toggleCourse = (id: string) => {
    setSelectedCourses(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllCourses = () => {
    setSelectedCourses(prev =>
      prev.size === courses.length ? new Set() : new Set(courses.map(c => c.id))
    );
  };

  const toggleEbook = (id: string) => {
    setSelectedEbooks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllEbooks = () => {
    setSelectedEbooks(prev =>
      prev.size === ebooks.length ? new Set() : new Set(ebooks.map(e => e.id))
    );
  };

  const ebookCategories = useMemo(() => [...new Set(ebooks.map(e => e.category))], [ebooks]);

  const totalSelections = activeTab === 'courses' ? selectedCourses.size : selectedEbooks.size;

  const grantAccess = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }
    if (activeTab === 'courses' && selectedCourses.size === 0) {
      toast.error('Please select at least one course');
      return;
    }
    if (activeTab === 'ebooks' && selectedEbooks.size === 0) {
      toast.error('Please select at least one eBook');
      return;
    }

    setGranting(true);
    try {
      if (activeTab === 'courses') {
        await grantCourseAccess();
      } else {
        await grantEbookAccess();
      }

      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">🎉 Access Granted Successfully!</p>
          <p className="text-sm">
            {selectedUsers.length} user(s) × {totalSelections} {activeTab === 'courses' ? 'course(s)' : 'eBook(s)'}
          </p>
          {customMessage && <p className="text-xs text-muted-foreground italic">Custom message included</p>}
        </div>
      );

      // Reset
      setSelectedUsers([]);
      setSelectedCourses(new Set());
      setSelectedEbooks(new Set());
      setCustomMessage('');
      setShowMessageInput(false);
      setSearchQuery('');
      if (activeTab === 'courses') fetchManualEnrollments();
    } catch (error: any) {
      console.error('Grant access error:', error);
      toast.error(error.message || 'Failed to grant access');
    } finally {
      setGranting(false);
    }
  };

  const grantCourseAccess = async () => {
    const courseIds = Array.from(selectedCourses);

    for (const u of selectedUsers) {
      // Check existing enrollments
      const { data: existing } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', u.user_id)
        .in('course_id', courseIds);

      const existingIds = new Set(existing?.map(e => e.course_id) || []);
      const newCourseIds = courseIds.filter(id => !existingIds.has(id));

      if (newCourseIds.length > 0) {
        const { error } = await supabase.from('enrollments').insert(
          newCourseIds.map(cid => ({
            user_id: u.user_id,
            course_id: cid,
            status: 'active',
            is_manual: true,
            granted_by: user?.id,
            granted_at: new Date().toISOString(),
          }))
        );
        if (error) throw error;

        // Send email for each course (fire and forget)
        for (const cid of newCourseIds) {
          const course = courses.find(c => c.id === cid);
          supabase.functions.invoke('send-enrollment-email', {
            body: {
              email: u.email,
              name: u.full_name || u.email?.split('@')[0],
              courseName: course?.title || 'Course',
              courseSlug: course?.slug || '',
              isFree: true,
              isGift: true,
              customMessage: customMessage || undefined,
            }
          }).catch(err => console.error('Email error:', err));
        }
      }
    }
  };

  const grantEbookAccess = async () => {
    const ebookIdsArray = Array.from(selectedEbooks);

    for (const u of selectedUsers) {
      const { data: existingPurchase } = await supabase
        .from('ebook_purchases')
        .select('id, ebook_ids')
        .eq('user_id', u.user_id)
        .eq('status', 'completed')
        .single();

      if (existingPurchase) {
        const mergedIds = [...new Set([...(existingPurchase.ebook_ids || []), ...ebookIdsArray])];
        const { error } = await supabase
          .from('ebook_purchases')
          .update({ ebook_ids: mergedIds, updated_at: new Date().toISOString() })
          .eq('id', existingPurchase.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ebook_purchases')
          .insert({
            user_id: u.user_id,
            ebook_ids: ebookIdsArray,
            total_amount: 0,
            status: 'completed',
            is_full_bundle: selectedEbooks.size === ebooks.length,
          });
        if (error) throw error;
      }

      // Send gift email
      const selectedBookTitles = ebooks.filter(e => selectedEbooks.has(e.id)).map(e => e.title);
      supabase.functions.invoke('send-ebook-gift-email', {
        body: {
          email: u.email,
          name: u.full_name || '',
          bookCount: selectedEbooks.size,
          bookTitles: selectedBookTitles,
          isFullBundle: selectedEbooks.size === ebooks.length,
          customMessage: customMessage || undefined,
        }
      }).catch(err => console.error('Gift email error:', err));
    }
  };

  const revokeAccess = async (enrollmentId: string) => {
    if (!confirm('Revoke this access?')) return;
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
      {/* Header */}
      <Card className="border-2 border-dashed border-accent/30 bg-accent/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-accent" />
            Bulk Access Manager
          </CardTitle>
          <CardDescription>
            Grant free access to multiple users for courses & eBooks at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Step 1: User Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4" />
              Step 1: Select Users
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
            </div>

            {/* Search dropdown */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="border rounded-lg shadow-lg bg-card max-h-48 overflow-y-auto"
                >
                  {searchResults.map(u => (
                    <button
                      key={u.user_id}
                      onClick={() => addUser(u)}
                      className="w-full p-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium shrink-0">
                        {(u.full_name || u.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{u.full_name || 'No name'}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      {selectedUsers.find(su => su.user_id === u.user_id) && (
                        <Check className="h-4 w-4 text-primary ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected users chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(u => (
                  <Badge key={u.user_id} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                    <span className="text-xs">{u.full_name || u.email}</span>
                    <button
                      onClick={() => removeUser(u.user_id)}
                      className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Badge variant="outline" className="text-xs">
                  {selectedUsers.length} selected
                </Badge>
              </div>
            )}
          </div>

          {/* Step 2: Select Content */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <GraduationCap className="h-4 w-4" />
              Step 2: Select Content
            </Label>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="courses" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Courses ({selectedCourses.size})
                </TabsTrigger>
                <TabsTrigger value="ebooks" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  eBooks ({selectedEbooks.size})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="courses" className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{selectedCourses.size} of {courses.length} courses</span>
                  <Button variant="outline" size="sm" onClick={toggleAllCourses}>
                    {selectedCourses.size === courses.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <ScrollArea className="h-[250px] border rounded-lg p-2">
                  <div className="space-y-1">
                    {courses.map(course => (
                      <div
                        key={course.id}
                        onClick={() => toggleCourse(course.id)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                          selectedCourses.has(course.id) ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox checked={selectedCourses.has(course.id)} onCheckedChange={() => toggleCourse(course.id)} />
                        <span className="text-sm line-clamp-1">{course.title}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="ebooks" className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{selectedEbooks.size} of {ebooks.length} eBooks</span>
                  <Button variant="outline" size="sm" onClick={toggleAllEbooks}>
                    {selectedEbooks.size === ebooks.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <ScrollArea className="h-[250px] border rounded-lg p-2">
                  <div className="space-y-3">
                    {ebookCategories.map(category => {
                      const categoryBooks = ebooks.filter(e => e.category === category);
                      return (
                        <div key={category}>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            {category} ({categoryBooks.length})
                          </p>
                          <div className="space-y-1">
                            {categoryBooks.map(ebook => (
                              <div
                                key={ebook.id}
                                onClick={() => toggleEbook(ebook.id)}
                                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                                  selectedEbooks.has(ebook.id) ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
                                }`}
                              >
                                <Checkbox checked={selectedEbooks.has(ebook.id)} onCheckedChange={() => toggleEbook(ebook.id)} />
                                <span className="text-sm line-clamp-1">{ebook.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Step 3: Custom Message (optional) */}
          <div className="space-y-2">
            {!showMessageInput ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMessageInput(true)}
                className="gap-2 text-muted-foreground"
              >
                <MessageSquare className="h-4 w-4" />
                Add custom message (optional)
              </Button>
            ) : (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <Label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <MessageSquare className="h-4 w-4" />
                  Custom Message
                </Label>
                <Textarea
                  placeholder="Write a personal message that will be included in the notification email..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                />
                <Button variant="ghost" size="sm" onClick={() => { setShowMessageInput(false); setCustomMessage(''); }} className="mt-1 text-xs">
                  Remove message
                </Button>
              </motion.div>
            )}
          </div>

          {/* Grant Button */}
          <motion.div
            className={`p-4 rounded-xl border-2 transition-colors ${
              selectedUsers.length > 0 && totalSelections > 0
                ? 'border-primary/50 bg-primary/5'
                : 'border-muted bg-muted/30'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  selectedUsers.length > 0 && totalSelections > 0 ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  <Sparkles className={`h-6 w-6 ${
                    selectedUsers.length > 0 && totalSelections > 0 ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {selectedUsers.length} user(s) × {totalSelections} {activeTab === 'courses' ? 'course(s)' : 'eBook(s)'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {customMessage ? 'Custom message included' : 'No custom message'}
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={grantAccess}
                disabled={selectedUsers.length === 0 || totalSelections === 0 || granting}
                className="gap-2 min-w-[160px]"
              >
                {granting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Granting...</>
                ) : (
                  <><Gift className="h-4 w-4" /> Grant Access</>
                )}
              </Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Enrollment History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Recent Manual Enrollments ({manualEnrollments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {manualEnrollments.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 text-sm">No manual enrollments yet.</p>
          ) : (
            <div className="space-y-2">
              {manualEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <Gift className="h-4 w-4 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {(enrollment as any).profiles?.full_name || (enrollment as any).profiles?.email || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(enrollment as any).courses?.title || 'Unknown Course'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {enrollment.granted_at ? new Date(enrollment.granted_at).toLocaleDateString() : 'N/A'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => revokeAccess(enrollment.id)} disabled={removing === enrollment.id}>
                      {removing === enrollment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

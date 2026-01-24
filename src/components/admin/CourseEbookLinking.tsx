import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Link2, 
  Loader2, 
  BookOpen, 
  GraduationCap,
  Save,
  Unlink,
  Gift
} from 'lucide-react';

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

interface CourseEbookLink {
  course_id: string;
  ebook_id: string;
}

export function CourseEbookLinking() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [links, setLinks] = useState<CourseEbookLink[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [coursesRes, ebooksRes, linksRes] = await Promise.all([
      supabase.from('courses').select('id, title, slug').eq('is_published', true).order('title'),
      supabase.from('ebooks').select('id, title, category').eq('is_published', true).order('category').order('title'),
      supabase.from('course_ebook_links').select('course_id, ebook_id'),
    ]);

    if (coursesRes.data) setCourses(coursesRes.data);
    if (ebooksRes.data) setEbooks(ebooksRes.data);
    if (linksRes.data) setLinks(linksRes.data);
    setLoading(false);
  };

  const getLinkedEbooks = (courseId: string) => {
    return links.filter(l => l.course_id === courseId).map(l => l.ebook_id);
  };

  const toggleEbookLink = async (ebookId: string) => {
    if (!selectedCourse) return;
    
    const isLinked = links.some(l => l.course_id === selectedCourse && l.ebook_id === ebookId);
    
    setSaving(true);
    try {
      if (isLinked) {
        // Remove link
        const { error } = await supabase
          .from('course_ebook_links')
          .delete()
          .eq('course_id', selectedCourse)
          .eq('ebook_id', ebookId);
        
        if (error) throw error;
        setLinks(links.filter(l => !(l.course_id === selectedCourse && l.ebook_id === ebookId)));
      } else {
        // Add link
        const { error } = await supabase
          .from('course_ebook_links')
          .insert({ course_id: selectedCourse, ebook_id: ebookId });
        
        if (error) throw error;
        setLinks([...links, { course_id: selectedCourse, ebook_id: ebookId }]);
      }
      
      toast({ 
        title: isLinked ? "Unlinked" : "Linked", 
        description: isLinked ? "eBook removed from course bundle" : "eBook added to course bundle" 
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const linkAllEbooks = async () => {
    if (!selectedCourse) return;
    
    setSaving(true);
    try {
      const existingLinks = getLinkedEbooks(selectedCourse);
      const newLinks = ebooks
        .filter(e => !existingLinks.includes(e.id))
        .map(e => ({ course_id: selectedCourse, ebook_id: e.id }));
      
      if (newLinks.length > 0) {
        const { error } = await supabase
          .from('course_ebook_links')
          .insert(newLinks);
        
        if (error) throw error;
        setLinks([...links, ...newLinks]);
        toast({ title: "All Linked!", description: `Added ${newLinks.length} eBooks to course` });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const unlinkAllEbooks = async () => {
    if (!selectedCourse) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('course_ebook_links')
        .delete()
        .eq('course_id', selectedCourse);
      
      if (error) throw error;
      setLinks(links.filter(l => l.course_id !== selectedCourse));
      toast({ title: "All Unlinked", description: "Removed all eBooks from course" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const selectedLinkedCount = selectedCourse ? getLinkedEbooks(selectedCourse).length : 0;
  const linkedEbookIds = selectedCourse ? getLinkedEbooks(selectedCourse) : [];

  // Group ebooks by category
  const ebooksByCategory = ebooks.reduce((acc, ebook) => {
    if (!acc[ebook.category]) acc[ebook.category] = [];
    acc[ebook.category].push(ebook);
    return acc;
  }, {} as Record<string, Ebook[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Course-eBook Bundle Linking
        </CardTitle>
        <CardDescription>
          Link eBooks to courses. Students who purchase a course will automatically get access to linked eBooks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Course Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Course</label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a course to configure..." />
            </SelectTrigger>
            <SelectContent>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>{course.title}</span>
                    {getLinkedEbooks(course.id).length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {getLinkedEbooks(course.id).length} eBooks
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Course Info */}
        {selectedCourse && (
          <>
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {selectedLinkedCount} eBooks linked
                </span>
                <span className="text-sm text-muted-foreground">
                  (included free with course purchase)
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={linkAllEbooks}
                  disabled={saving || selectedLinkedCount === ebooks.length}
                >
                  Link All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={unlinkAllEbooks}
                  disabled={saving || selectedLinkedCount === 0}
                >
                  <Unlink className="h-4 w-4 mr-1" />
                  Unlink All
                </Button>
              </div>
            </div>

            {/* eBooks List by Category */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {Object.entries(ebooksByCategory).map(([category, categoryEbooks]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {categoryEbooks.map(ebook => {
                      const isLinked = linkedEbookIds.includes(ebook.id);
                      return (
                        <div 
                          key={ebook.id}
                          onClick={() => toggleEbookLink(ebook.id)}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                            ${isLinked 
                              ? 'bg-success/10 border-success/30' 
                              : 'bg-card hover:bg-muted/50 border-border'}
                          `}
                        >
                          <Checkbox 
                            checked={isLinked} 
                            onCheckedChange={() => toggleEbookLink(ebook.id)}
                            className="pointer-events-none"
                          />
                          <span className="text-sm flex-1 truncate">{ebook.title}</span>
                          {isLinked && (
                            <Badge variant="secondary" className="bg-success/20 text-success text-xs">
                              Included
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!selectedCourse && (
          <div className="text-center py-8 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Select a course to manage its eBook bundle</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
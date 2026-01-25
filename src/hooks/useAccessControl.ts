import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AccessType = 'full' | 'partial' | 'gift' | 'launch_free' | 'none';

export interface CourseAccessInfo {
  hasAccess: boolean;
  accessType: AccessType;
  isEnrolled: boolean;
  enrollmentExpiry: string | null;
  unlockedModuleIds: string[];
  unlockedLessonIds: string[];
  unlockedPercent: number;
  giftExpiry: string | null;
  launchFreeExpiry: string | null;
  canPurchase: boolean;
}

export function useAccessControl(userId: string | undefined, courseId: string | undefined) {
  const [accessInfo, setAccessInfo] = useState<CourseAccessInfo>({
    hasAccess: false,
    accessType: 'none',
    isEnrolled: false,
    enrollmentExpiry: null,
    unlockedModuleIds: [],
    unlockedLessonIds: [],
    unlockedPercent: 0,
    giftExpiry: null,
    launchFreeExpiry: null,
    canPurchase: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !courseId) {
      setLoading(false);
      return;
    }
    checkAccess();
  }, [userId, courseId]);

  const checkAccess = async () => {
    if (!userId || !courseId) return;
    
    setLoading(true);
    try {
      const now = new Date().toISOString();

      // 1. Check full enrollment
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id, status, expires_at')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('status', 'active')
        .maybeSingle();

      if (enrollment) {
        const isExpired = enrollment.expires_at && new Date(enrollment.expires_at) < new Date();
        if (!isExpired) {
          setAccessInfo({
            hasAccess: true,
            accessType: 'full',
            isEnrolled: true,
            enrollmentExpiry: enrollment.expires_at,
            unlockedModuleIds: [],
            unlockedLessonIds: [],
            unlockedPercent: 100,
            giftExpiry: null,
            launchFreeExpiry: null,
            canPurchase: false,
          });
          setLoading(false);
          return;
        }
      }

      // 2. Check gift access via login_gift_claims
      const { data: giftClaim } = await supabase
        .from('login_gift_claims')
        .select(`
          expires_at,
          campaign:login_gift_campaigns!inner(
            id,
            login_gift_campaign_courses(course_id)
          )
        `)
        .eq('user_id', userId)
        .gte('expires_at', now)
        .maybeSingle();

      if (giftClaim) {
        const campaignCourses = giftClaim.campaign?.login_gift_campaign_courses || [];
        const hasGiftForCourse = campaignCourses.some((cc: any) => cc.course_id === courseId);
        
        if (hasGiftForCourse) {
          setAccessInfo({
            hasAccess: true,
            accessType: 'gift',
            isEnrolled: true,
            enrollmentExpiry: null,
            unlockedModuleIds: [],
            unlockedLessonIds: [],
            unlockedPercent: 100,
            giftExpiry: giftClaim.expires_at,
            launchFreeExpiry: null,
            canPurchase: true,
          });
          setLoading(false);
          return;
        }
      }

      // 3. Check launch free access
      const { data: launchFree } = await supabase
        .from('launch_free_courses')
        .select('end_at')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .lte('start_at', now)
        .maybeSingle();

      if (launchFree) {
        const isExpired = launchFree.end_at && new Date(launchFree.end_at) < new Date();
        if (!isExpired) {
          setAccessInfo({
            hasAccess: true,
            accessType: 'launch_free',
            isEnrolled: false,
            enrollmentExpiry: null,
            unlockedModuleIds: [],
            unlockedLessonIds: [],
            unlockedPercent: 100,
            giftExpiry: null,
            launchFreeExpiry: launchFree.end_at,
            canPurchase: true,
          });
          setLoading(false);
          return;
        }
      }

      // 4. Check EMI/partial access via user_module_access
      const { data: moduleAccess } = await supabase
        .from('user_module_access')
        .select('module_id, expires_at')
        .eq('user_id', userId)
        .eq('course_id', courseId);

      // 4b. Check lesson-level access via user_lesson_access
      const { data: lessonAccess } = await supabase
        .from('user_lesson_access')
        .select('lesson_id, expires_at')
        .eq('user_id', userId)
        .eq('course_id', courseId);

      const validModuleAccess = (moduleAccess || []).filter(
        ma => !ma.expires_at || new Date(ma.expires_at) >= new Date()
      );
      const validLessonAccess = (lessonAccess || []).filter(
        la => !la.expires_at || new Date(la.expires_at) >= new Date()
      );

      if (validModuleAccess.length > 0 || validLessonAccess.length > 0) {
        // Get total modules to calculate percent
        const { count: totalModules } = await supabase
          .from('modules')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', courseId);

        const { count: totalLessons } = await supabase
          .from('lessons')
          .select('*, modules!inner(course_id)', { count: 'exact', head: true })
          .eq('modules.course_id', courseId);

        // Calculate combined percent (modules count more heavily)
        const modulePercent = totalModules 
          ? (validModuleAccess.length / totalModules) * 100
          : 0;
        const lessonPercent = totalLessons && validLessonAccess.length > 0
          ? (validLessonAccess.length / totalLessons) * 100
          : 0;
        
        // Use whichever is higher, but cap at 99 for partial
        const unlockedPercent = Math.min(Math.max(Math.round(modulePercent), Math.round(lessonPercent)), 99);

        setAccessInfo({
          hasAccess: true,
          accessType: 'partial',
          isEnrolled: false,
          enrollmentExpiry: null,
          unlockedModuleIds: validModuleAccess.map(ma => ma.module_id),
          unlockedLessonIds: validLessonAccess.map(la => la.lesson_id),
          unlockedPercent,
          giftExpiry: null,
          launchFreeExpiry: null,
          canPurchase: true,
        });
        setLoading(false);
        return;
      }

      // 5. No access
      setAccessInfo({
        hasAccess: false,
        accessType: 'none',
        isEnrolled: false,
        enrollmentExpiry: null,
        unlockedModuleIds: [],
        unlockedLessonIds: [],
        unlockedPercent: 0,
        giftExpiry: null,
        launchFreeExpiry: null,
        canPurchase: true,
      });
    } catch (error) {
      console.error('Error checking access:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasModuleAccess = (moduleId: string): boolean => {
    if (accessInfo.accessType === 'full' || accessInfo.accessType === 'gift' || accessInfo.accessType === 'launch_free') {
      return true;
    }
    if (accessInfo.accessType === 'partial') {
      return accessInfo.unlockedModuleIds.includes(moduleId);
    }
    return false;
  };

  const hasLessonAccess = (lessonId: string, moduleId?: string): boolean => {
    if (accessInfo.accessType === 'full' || accessInfo.accessType === 'gift' || accessInfo.accessType === 'launch_free') {
      return true;
    }
    if (accessInfo.accessType === 'partial') {
      // Check direct lesson access first
      if (accessInfo.unlockedLessonIds.includes(lessonId)) {
        return true;
      }
      // Then check if the parent module is unlocked
      if (moduleId && accessInfo.unlockedModuleIds.includes(moduleId)) {
        return true;
      }
    }
    return false;
  };

  return {
    ...accessInfo,
    loading,
    hasModuleAccess,
    hasLessonAccess,
    refetch: checkAccess,
  };
}

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AccessType, CourseAccessInfo } from './useAccessControl';

/**
 * A variant of useAccessControl that works with course slugs instead of IDs.
 * Useful for CourseCard and other components that only have the slug.
 */
export function useAccessControlBySlug(userId: string | undefined, courseSlug: string | undefined) {
  const [accessInfo, setAccessInfo] = useState<CourseAccessInfo>({
    hasAccess: false,
    accessType: 'none',
    isEnrolled: false,
    enrollmentExpiry: null,
    unlockedModuleIds: [],
    unlockedPercent: 0,
    giftExpiry: null,
    launchFreeExpiry: null,
    canPurchase: true,
  });
  const [loading, setLoading] = useState(true);
  const [courseId, setCourseId] = useState<string | null>(null);

  // First, resolve the course ID from slug
  useEffect(() => {
    if (!courseSlug) {
      setLoading(false);
      return;
    }

    const fetchCourseId = async () => {
      const { data } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', courseSlug)
        .single();
      
      setCourseId(data?.id || null);
    };

    fetchCourseId();
  }, [courseSlug]);

  // Then check access with the resolved ID
  useEffect(() => {
    if (!userId || !courseId) {
      if (!courseSlug) setLoading(false);
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
            unlockedPercent: 100,
            giftExpiry: null,
            launchFreeExpiry: null,
            canPurchase: false,
          });
          setLoading(false);
          return;
        }
      }

      // 2. Check gift access
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
            unlockedPercent: 100,
            giftExpiry: null,
            launchFreeExpiry: launchFree.end_at,
            canPurchase: true,
          });
          setLoading(false);
          return;
        }
      }

      // 4. Check EMI/partial access
      const { data: moduleAccess } = await supabase
        .from('user_module_access')
        .select('module_id, expires_at')
        .eq('user_id', userId)
        .eq('course_id', courseId);

      if (moduleAccess && moduleAccess.length > 0) {
        const validAccess = moduleAccess.filter(
          ma => !ma.expires_at || new Date(ma.expires_at) >= new Date()
        );
        
        if (validAccess.length > 0) {
          const { count: totalModules } = await supabase
            .from('modules')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', courseId);

          const unlockedPercent = totalModules 
            ? Math.round((validAccess.length / totalModules) * 100)
            : 0;

          setAccessInfo({
            hasAccess: true,
            accessType: 'partial',
            isEnrolled: false,
            enrollmentExpiry: null,
            unlockedModuleIds: validAccess.map(ma => ma.module_id),
            unlockedPercent,
            giftExpiry: null,
            launchFreeExpiry: null,
            canPurchase: true,
          });
          setLoading(false);
          return;
        }
      }

      // 5. No access
      setAccessInfo({
        hasAccess: false,
        accessType: 'none',
        isEnrolled: false,
        enrollmentExpiry: null,
        unlockedModuleIds: [],
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

  return {
    ...accessInfo,
    loading,
    courseId,
    refetch: checkAccess,
  };
}

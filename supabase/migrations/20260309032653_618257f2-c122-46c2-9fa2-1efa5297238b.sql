
-- Update cleanup trigger to include new social tables
CREATE OR REPLACE FUNCTION public.cleanup_user_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.user_follows WHERE follower_id = OLD.id OR following_id = OLD.id;
  DELETE FROM public.user_achievements WHERE user_id = OLD.id;
  DELETE FROM public.user_completed_tasks WHERE user_id = OLD.id;
  DELETE FROM public.usernames WHERE user_id = OLD.id;
  DELETE FROM public.community_feed WHERE user_id = OLD.id;
  DELETE FROM public.challenge_votes WHERE user_id = OLD.id;
  DELETE FROM public.challenge_submissions WHERE user_id = OLD.id;
  DELETE FROM public.studio_project_tasks WHERE user_id = OLD.id;
  DELETE FROM public.studio_project_milestones WHERE user_id = OLD.id;
  DELETE FROM public.competition_votes WHERE user_id = OLD.id;
  DELETE FROM public.competition_submissions WHERE user_id = OLD.id;
  DELETE FROM public.internship_applications WHERE user_id = OLD.id;
  DELETE FROM public.internships WHERE posted_by = OLD.id;
  DELETE FROM public.portfolios WHERE user_id = OLD.id;
  DELETE FROM public.forum_votes WHERE user_id = OLD.id;
  DELETE FROM public.forum_answers WHERE user_id = OLD.id;
  DELETE FROM public.forum_topics WHERE user_id = OLD.id;
  DELETE FROM public.sheet_critique_upvotes WHERE user_id = OLD.id;
  DELETE FROM public.sheet_critiques WHERE user_id = OLD.id;
  DELETE FROM public.sheet_reviews WHERE user_id = OLD.id;
  DELETE FROM public.studio_project_comments WHERE user_id = OLD.id;
  DELETE FROM public.studio_project_timeline WHERE user_id = OLD.id;
  DELETE FROM public.studio_project_notes WHERE user_id = OLD.id;
  DELETE FROM public.studio_project_files WHERE user_id = OLD.id;
  DELETE FROM public.studio_projects WHERE user_id = OLD.id;
  DELETE FROM public.user_onboarding_intake WHERE user_id = OLD.id;
  DELETE FROM public.user_sessions WHERE user_id = OLD.id;
  DELETE FROM public.user_discount_timers WHERE user_id = OLD.id;
  DELETE FROM public.user_lesson_access WHERE user_id = OLD.id;
  DELETE FROM public.user_module_access WHERE user_id = OLD.id;
  DELETE FROM public.abandoned_carts WHERE user_id = OLD.id;
  DELETE FROM public.download_requests WHERE user_id = OLD.id;
  DELETE FROM public.progress WHERE user_id = OLD.id;
  DELETE FROM public.notes WHERE user_id = OLD.id;
  DELETE FROM public.bookmarks WHERE user_id = OLD.id;
  DELETE FROM public.certificates WHERE user_id = OLD.id;
  DELETE FROM public.enrollments WHERE user_id = OLD.id;
  DELETE FROM public.payments WHERE user_id = OLD.id;
  DELETE FROM public.emi_payments WHERE user_id = OLD.id;
  DELETE FROM public.ebook_purchases WHERE user_id = OLD.id;
  DELETE FROM public.reviews WHERE user_id = OLD.id;
  DELETE FROM public.course_questions WHERE user_id = OLD.id;
  DELETE FROM public.referrals WHERE referrer_id = OLD.id;
  DELETE FROM public.notifications WHERE user_id = OLD.id;
  DELETE FROM public.ai_chat_history WHERE user_id = OLD.id;
  DELETE FROM public.live_activity WHERE user_id = OLD.id;
  DELETE FROM public.activity_history WHERE user_id = OLD.id;
  DELETE FROM public.purchase_attempts WHERE user_id = OLD.id;
  DELETE FROM public.login_gift_claims WHERE user_id = OLD.id;
  DELETE FROM public.support_tickets WHERE user_id = OLD.id;
  DELETE FROM public.analytics_events WHERE user_id = OLD.id;
  DELETE FROM public.user_roles WHERE user_id = OLD.id;
  DELETE FROM public.profiles WHERE user_id = OLD.id;
  RETURN OLD;
END;
$function$;

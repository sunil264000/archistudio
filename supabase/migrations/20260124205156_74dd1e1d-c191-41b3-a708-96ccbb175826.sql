-- Table to link courses with eBooks
CREATE TABLE public.course_ebook_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  ebook_id UUID NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(course_id, ebook_id)
);

-- Enable RLS
ALTER TABLE public.course_ebook_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage course-ebook links" 
ON public.course_ebook_links 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view course-ebook links" 
ON public.course_ebook_links 
FOR SELECT 
USING (true);

-- Add drive_folder_url to ebooks table for Google Drive sync
ALTER TABLE public.ebooks 
ADD COLUMN IF NOT EXISTS drive_folder_url TEXT,
ADD COLUMN IF NOT EXISTS drive_file_id TEXT;

-- Create a function to grant ebook access when course is purchased
CREATE OR REPLACE FUNCTION public.grant_ebook_access_on_enrollment()
RETURNS TRIGGER AS $$
DECLARE
  linked_ebook_ids UUID[];
  existing_purchase_id UUID;
BEGIN
  -- Only proceed for active enrollments
  IF NEW.status = 'active' THEN
    -- Get all ebook IDs linked to this course
    SELECT ARRAY_AGG(ebook_id) INTO linked_ebook_ids
    FROM public.course_ebook_links
    WHERE course_id = NEW.course_id;
    
    -- If there are linked ebooks, create or update purchase record
    IF linked_ebook_ids IS NOT NULL AND array_length(linked_ebook_ids, 1) > 0 THEN
      -- Check if user already has a completed purchase
      SELECT id INTO existing_purchase_id
      FROM public.ebook_purchases
      WHERE user_id = NEW.user_id AND status = 'completed'
      LIMIT 1;
      
      IF existing_purchase_id IS NOT NULL THEN
        -- Update existing purchase to include new ebooks (merge arrays)
        UPDATE public.ebook_purchases
        SET ebook_ids = (
          SELECT ARRAY(
            SELECT DISTINCT unnest(ebook_ids || linked_ebook_ids)
          )
        ),
        updated_at = now()
        WHERE id = existing_purchase_id;
      ELSE
        -- Create new completed purchase with linked ebooks (free via course)
        INSERT INTO public.ebook_purchases (user_id, ebook_ids, total_amount, status, is_full_bundle)
        VALUES (NEW.user_id, linked_ebook_ids, 0, 'completed', false)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic ebook access
DROP TRIGGER IF EXISTS trigger_grant_ebook_access ON public.enrollments;
CREATE TRIGGER trigger_grant_ebook_access
AFTER INSERT OR UPDATE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.grant_ebook_access_on_enrollment();

-- Add updated_at column to ebook_purchases if missing
ALTER TABLE public.ebook_purchases 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
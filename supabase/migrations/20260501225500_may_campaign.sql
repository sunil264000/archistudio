-- Add flash sale tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS flash_sale_expires_at timestamptz DEFAULT NULL;

-- Create the MAY2026 campaign
DO $$ 
DECLARE 
    campaign_id UUID;
    course_id UUID;
BEGIN
    -- Get the course ID for 'corona-architecture-rendering-scratch'
    SELECT id INTO course_id FROM public.courses WHERE slug = 'corona-architecture-rendering-scratch' LIMIT 1;
    
    IF course_id IS NOT NULL THEN
        -- Insert the campaign
        INSERT INTO public.login_gift_campaigns (
            name, 
            cta_text, 
            custom_messages, 
            eligible_users, 
            start_at, 
            end_at, 
            is_active, 
            is_welcome_promotion, 
            coupon_code
        ) VALUES (
            'May Mega Gift 2026',
            'Claim Your Gift',
            ARRAY['Welcome to the May Mega Event! Enjoy your free course and a 10-minute flash sale!'],
            'all',
            '2024-05-01 00:00:00+00',
            '2026-05-07 23:59:59+00',
            true,
            false,
            'MAY2026'
        ) RETURNING id INTO campaign_id;

        -- Link the course to the campaign
        INSERT INTO public.login_gift_campaign_courses (campaign_id, course_id)
        VALUES (campaign_id, course_id);
    END IF;
END $$;

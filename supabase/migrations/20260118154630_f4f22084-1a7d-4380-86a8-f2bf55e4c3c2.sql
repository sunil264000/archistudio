-- Seed a minimal set of published courses required for purchase flow testing
-- (Backend courses table is currently empty, so payment/enrollment cannot resolve course UUID)

INSERT INTO public.courses (slug, title, short_description, description, level, is_published, is_featured, duration_hours, total_lessons, price_inr, price_usd)
SELECT * FROM (
  VALUES
    (
      'corona-architecture-rendering-scratch',
      'Corona Renderer Architecture Rendering from Scratch',
      'Master Corona Renderer for stunning architectural visualizations from the ground up.',
      'Dive deep into Corona Renderer and learn to create breathtaking architectural visualizations. This comprehensive course takes you from basic setup to advanced rendering techniques, covering lighting, materials, camera settings, and post-production. Perfect for architects and 3D artists looking to elevate their rendering skills.',
      'beginner',
      true,
      true,
      18,
      45,
      7499,
      89
    ),
    (
      'animation-corona-vray-3ds-max',
      'Animation with Corona & V-Ray in 3ds Max',
      'Create stunning animated architectural walkthroughs and presentations.',
      'Learn the art of architectural animation using Corona and V-Ray in 3ds Max. Master camera animation, lighting transitions, material animation, and export settings for professional-quality architectural walkthroughs that will impress your clients.',
      'intermediate',
      true,
      false,
      14,
      32,
      6499,
      79
    ),
    (
      'corona-9-architectural-lighting-workshop',
      'Corona 9 + 3ds Max Architectural Lighting Workshop',
      'Master architectural lighting techniques with Corona 9 and 3ds Max.',
      'Unlock the secrets of professional architectural lighting with this intensive workshop. Learn to create mood, atmosphere, and photorealistic results using Corona 9''s advanced lighting features. Covers daylight, artificial lighting, HDRI, and mixed lighting scenarios.',
      'intermediate',
      true,
      true,
      12,
      28,
      5999,
      69
    ),
    (
      'interior-lighting-corona-vray-zero-advanced',
      'Interior Lighting - Corona and V-Ray from Zero to Advanced',
      'Complete guide to interior lighting with Corona and V-Ray renderers.',
      'Transform your interior renders with professional lighting techniques. This course covers both Corona and V-Ray workflows, teaching you to create natural daylight, warm artificial lighting, and dramatic mood lighting that brings interiors to life.',
      'beginner',
      true,
      false,
      16,
      40,
      6499,
      79
    ),
    (
      'lighting-mastery-vray-6',
      'Lighting Mastery in V-Ray 6',
      'Become a V-Ray 6 lighting expert with advanced techniques.',
      'Take your V-Ray skills to the next level with this advanced lighting course. Master V-Ray 6''s powerful lighting tools, including Light Mix, Light Gen, and advanced GI settings to create stunning photorealistic renders.',
      'advanced',
      true,
      false,
      10,
      24,
      7499,
      89
    )
) AS v(slug, title, short_description, description, level, is_published, is_featured, duration_hours, total_lessons, price_inr, price_usd)
WHERE NOT EXISTS (SELECT 1 FROM public.courses c WHERE c.slug = v.slug);

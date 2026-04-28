-- Seed Fake Profiles, Jobs, and Reviews (Indian Names)

DO $$
DECLARE
  -- Worker UUIDs
  w1 UUID := 'c0000000-0000-0000-0000-000000000001';
  w2 UUID := 'c0000000-0000-0000-0000-000000000002';
  w3 UUID := 'c0000000-0000-0000-0000-000000000003';
  w4 UUID := 'c0000000-0000-0000-0000-000000000004';
  w5 UUID := 'c0000000-0000-0000-0000-000000000005';
  w6 UUID := 'c0000000-0000-0000-0000-000000000006';
  w7 UUID := 'c0000000-0000-0000-0000-000000000007';
  w8 UUID := 'c0000000-0000-0000-0000-000000000008';

  -- Client UUID
  c1 UUID := 'd0000000-0000-0000-0000-000000000001';
  c2 UUID := 'd0000000-0000-0000-0000-000000000002';

  -- Job UUIDs
  j1 UUID := 'e0000000-0000-0000-0000-000000000001';
  j2 UUID := 'e0000000-0000-0000-0000-000000000002';
  j3 UUID := 'e0000000-0000-0000-0000-000000000003';
  j4 UUID := 'e0000000-0000-0000-0000-000000000004';
  j5 UUID := 'e0000000-0000-0000-0000-000000000005';
  j6 UUID := 'e0000000-0000-0000-0000-000000000006';
  j7 UUID := 'e0000000-0000-0000-0000-000000000007';

  -- Proposal UUIDs
  p1 UUID := 'f0000000-0000-0000-0000-000000000001';
  p2 UUID := 'f0000000-0000-0000-0000-000000000002';
  p3 UUID := 'f0000000-0000-0000-0000-000000000003';
  p4 UUID := 'f0000000-0000-0000-0000-000000000004';
  p5 UUID := 'f0000000-0000-0000-0000-000000000005';
  p6 UUID := 'f0000000-0000-0000-0000-000000000006';

  -- Contract UUIDs
  ct1 UUID := 'a0000000-0000-0000-0000-000000000001';
  ct2 UUID := 'a0000000-0000-0000-0000-000000000002';
  ct3 UUID := 'a0000000-0000-0000-0000-000000000003';
  ct4 UUID := 'a0000000-0000-0000-0000-000000000004';
  ct5 UUID := 'a0000000-0000-0000-0000-000000000005';
  ct6 UUID := 'a0000000-0000-0000-0000-000000000006';

BEGIN
  -- 1. Insert into auth.users
  INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES
    (w1, 'authenticated', 'authenticated', 'rahul.s@fake.archistudio.shop', 'fake_hash', now(), now(), now()),
    (w2, 'authenticated', 'authenticated', 'priya.p@fake.archistudio.shop', 'fake_hash', now(), now(), now()),
    (w3, 'authenticated', 'authenticated', 'amit.k@fake.archistudio.shop', 'fake_hash', now(), now(), now()),
    (w4, 'authenticated', 'authenticated', 'sneha.r@fake.archistudio.shop', 'fake_hash', now(), now(), now()),
    (w5, 'authenticated', 'authenticated', 'vikram.s@fake.archistudio.shop', 'fake_hash', now(), now(), now()),
    (w6, 'authenticated', 'authenticated', 'anjali.d@fake.archistudio.shop', 'fake_hash', now(), now(), now()),
    (w7, 'authenticated', 'authenticated', 'rohit.v@fake.archistudio.shop', 'fake_hash', now(), now(), now()),
    (w8, 'authenticated', 'authenticated', 'neha.j@fake.archistudio.shop', 'fake_hash', now(), now(), now()),
    (c1, 'authenticated', 'authenticated', 'client1@fake.archistudio.shop', 'fake_hash', now(), now(), now()),
    (c2, 'authenticated', 'authenticated', 'client2@fake.archistudio.shop', 'fake_hash', now(), now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- 2. Insert into public.profiles
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES
    (w1, 'Rahul Sharma', 'student'),
    (w2, 'Priya Patel', 'student'),
    (w3, 'Amit Kumar', 'student'),
    (w4, 'Sneha Reddy', 'student'),
    (w5, 'Vikram Singh', 'student'),
    (w6, 'Anjali Desai', 'student'),
    (w7, 'Rohit Verma', 'student'),
    (w8, 'Neha Joshi', 'student'),
    (c1, 'Design Studios LLC', 'student'),
    (c2, 'Global Architecture Partners', 'student')
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Insert into public.worker_profiles
  INSERT INTO public.worker_profiles (user_id, display_name, headline, bio, skills, experience_level, hourly_rate, availability, location, total_jobs_completed, total_earnings, average_rating, total_reviews, is_active)
  VALUES
    (w1, 'Rahul Sharma', 'Expert 3D Modeler & Visualizer', 'I specialize in photorealistic 3D rendering and architectural visualization using 3ds Max, V-Ray, and Lumion. Over 5 years of experience delivering high-quality renders.', ARRAY['3D Modeling', 'Rendering', '3ds Max', 'V-Ray', 'Lumion'], 'advanced', 1500.00, 'available', 'Mumbai, India', 24, 120000.00, 4.9, 15, true),
    (w2, 'Priya Patel', 'BIM Coordinator & Revit Specialist', 'Expert in Revit Architecture and MEP. I help studios transition to BIM and create clash-free, highly detailed LOD 400 models.', ARRAY['BIM', 'Revit', 'AutoCAD', 'Navisworks'], 'advanced', 1200.00, 'available', 'Ahmedabad, India', 18, 95000.00, 4.8, 12, true),
    (w3, 'Amit Kumar', 'Senior Draftsman & AutoCAD Expert', 'Fast, accurate, and reliable AutoCAD drafting for residential and commercial projects. I provide detailed floor plans, elevations, and sections.', ARRAY['AutoCAD', 'Drafting', '2D Plans', 'Detailing'], 'intermediate', 800.00, 'available', 'Delhi, India', 45, 85000.00, 4.7, 28, true),
    (w4, 'Sneha Reddy', 'Landscape Architecture & Concept Design', 'Passionate landscape designer with a focus on sustainable and ecological designs. Proficient in Rhino, SketchUp, and Photoshop for beautiful presentations.', ARRAY['Landscape', 'Rhino', 'SketchUp', 'Photoshop'], 'intermediate', 1000.00, 'available', 'Bangalore, India', 12, 60000.00, 5.0, 8, true),
    (w5, 'Vikram Singh', 'Interior Architecture & Detailing', 'Interior designer specializing in modern, minimalist spaces. I provide complete sets of working drawings, material boards, and 3D mockups.', ARRAY['Interior Design', 'SketchUp', 'AutoCAD', 'Enscape'], 'advanced', 1400.00, 'busy', 'Pune, India', 30, 150000.00, 4.9, 20, true),
    (w6, 'Anjali Desai', 'Parametric Designer & Rhino/Grasshopper', 'Computational designer pushing the boundaries of geometry. I create complex parametric scripts for facades, structures, and pavilions.', ARRAY['Rhino', 'Grasshopper', 'Parametric Design', 'Python'], 'advanced', 2000.00, 'available', 'Hyderabad, India', 8, 80000.00, 4.8, 5, true),
    (w7, 'Rohit Verma', 'Junior Architect & 3D Artist', 'Architecture student offering fresh, modern designs and high-quality 3D renders using SketchUp and Twinmotion. Budget-friendly and fast delivery.', ARRAY['SketchUp', 'Twinmotion', 'Concept Design'], 'beginner', 500.00, 'available', 'Chennai, India', 5, 10000.00, 4.5, 3, true),
    (w8, 'Neha Joshi', 'Residential Floor Plan Expert', 'I love designing functional, vastu-compliant homes. I can turn your rough sketches into professional 2D floor plans.', ARRAY['Residential', 'AutoCAD', 'Vastu'], 'intermediate', 750.00, 'available', 'Jaipur, India', 15, 35000.00, 4.6, 10, true)
  ON CONFLICT (user_id) DO NOTHING;

  -- 4. Insert into public.worker_portfolio_items
  INSERT INTO public.worker_portfolio_items (worker_id, title, description, category, skills)
  SELECT id, 'Modern Luxury Villa Concept', 'A stunning 3D visualization of a coastal villa.', '3D Rendering', ARRAY['3ds Max', 'V-Ray', 'Photoshop'] FROM public.worker_profiles WHERE user_id = w1
  UNION ALL
  SELECT id, 'Commercial Office Complex', 'Full LOD 350 Revit model for clash detection and BOQ.', 'BIM Modeling', ARRAY['Revit', 'BIM'] FROM public.worker_profiles WHERE user_id = w2
  UNION ALL
  SELECT id, 'Residential Apartment Construction Set', 'Complete set of AutoCAD 2D drawings including electrical and plumbing.', 'Drafting', ARRAY['AutoCAD', 'Detailing'] FROM public.worker_profiles WHERE user_id = w3
  UNION ALL
  SELECT id, 'Eco-Resort Landscape Masterplan', 'Concept design for a sustainable resort in Kerala.', 'Landscape Design', ARRAY['Rhino', 'Photoshop'] FROM public.worker_profiles WHERE user_id = w4
  UNION ALL
  SELECT id, 'Minimalist Studio Apartment Interior', 'Interior visualization and working drawings.', 'Interior Design', ARRAY['SketchUp', 'Enscape'] FROM public.worker_profiles WHERE user_id = w5
  UNION ALL
  SELECT id, 'Parametric Pavilion Facade', 'Grasshopper script for a dynamic responsive facade system.', 'Parametric Design', ARRAY['Rhino', 'Grasshopper'] FROM public.worker_profiles WHERE user_id = w6;

  -- 5. Insert Fake Jobs
  INSERT INTO public.marketplace_jobs (id, client_id, title, description, category, skills_required, budget_type, budget_min, budget_max, status, visibility, proposals_count, awarded_proposal_id)
  VALUES
    (j1, c1, 'Need photorealistic renders for a 4BHK apartment', 'We are looking for an expert 3D visualizer to create 5 high-quality interior renders for a luxury apartment project in Mumbai.', '3D Rendering', ARRAY['3ds Max', 'V-Ray'], 'fixed', 15000, 20000, 'completed', 'public', 15, p1),
    (j2, c2, 'Convert 2D CAD drawings to Revit BIM Model', 'Need an experienced BIM modeler to convert our existing 2D AutoCAD hospital plans into a Revit model (LOD 300).', 'BIM Modeling', ARRAY['Revit', 'BIM'], 'range', 30000, 50000, 'completed', 'public', 8, p2),
    (j3, c1, 'Urgent: AutoCAD drafting for residential elevations', 'Need detailed 2D elevations and sections for a 2-story house. We will provide the floor plans.', 'Drafting', ARRAY['AutoCAD', '2D Plans'], 'fixed', 5000, 8000, 'completed', 'public', 22, p3),
    (j4, c2, 'Landscape concept design for a boutique hotel', 'Looking for a creative landscape architect to design the outdoor spaces, pool area, and gardens for a small hotel.', 'Landscape Design', ARRAY['SketchUp', 'Photoshop'], 'fixed', 25000, 30000, 'completed', 'public', 12, p4),
    (j5, c1, 'Interior design and detailing for a cafe', 'Require full interior design services including mood boards, 3D views, and working drawings for a 1500 sqft cafe.', 'Interior Design', ARRAY['Interior Design', 'AutoCAD', 'SketchUp'], 'fixed', 40000, 50000, 'completed', 'public', 18, p5),
    (j6, c2, 'Grasshopper script for a complex canopy', 'Need a parametric designer to create a Grasshopper script to generate a timber waffle structure canopy.', 'Parametric Design', ARRAY['Rhino', 'Grasshopper'], 'hourly', 1500, 2500, 'completed', 'public', 5, p6),
    (j7, c1, 'Looking for an architect for a modern farmhouse', 'We are in the early stages and need concept designs, moodboards, and a few rough 3D models.', 'Concept Design', ARRAY['Concept Design', 'SketchUp'], 'fixed', 10000, 15000, 'open', 'public', 0, NULL)
  ON CONFLICT (id) DO NOTHING;

  -- 6. Insert Fake Proposals
  INSERT INTO public.job_proposals (id, job_id, worker_id, bid_amount, delivery_days, cover_message, status)
  VALUES
    (p1, j1, w1, 18000, 5, 'Hi, I have extensively worked on luxury interiors. I can deliver 4K renders in 5 days.', 'accepted'),
    (p2, j2, w2, 45000, 14, 'I am a Revit specialist with hospital project experience. Let us discuss the BIM execution plan.', 'accepted'),
    (p3, j3, w3, 6000, 2, 'I can start immediately. My CAD drawings are highly detailed and layered properly.', 'accepted'),
    (p4, j4, w4, 28000, 10, 'I love boutique hospitality projects! I can create a lush, sustainable landscape concept for you.', 'accepted'),
    (p5, j5, w5, 48000, 20, 'I specialize in F&B interiors. I will provide a complete set of GFC drawings along with stunning visuals.', 'accepted'),
    (p6, j6, w6, 20000, 7, 'I am an expert in computational design and have done similar timber waffle scripts recently.', 'accepted')
  ON CONFLICT (id) DO NOTHING;

  -- 7. Insert Fake Contracts
  INSERT INTO public.marketplace_contracts (id, job_id, proposal_id, client_id, worker_id, agreed_amount, platform_fee_amount, worker_payout, delivery_days, status, payment_status)
  VALUES
    (ct1, j1, p1, c1, w1, 18000, 2700, 15300, 5, 'completed', 'released'),
    (ct2, j2, p2, c2, w2, 45000, 6750, 38250, 14, 'completed', 'released'),
    (ct3, j3, p3, c1, w3, 6000, 900, 5100, 2, 'completed', 'released'),
    (ct4, j4, p4, c2, w4, 28000, 4200, 23800, 10, 'completed', 'released'),
    (ct5, j5, p5, c1, w5, 48000, 7200, 40800, 20, 'completed', 'released'),
    (ct6, j6, p6, c2, w6, 20000, 3000, 17000, 7, 'completed', 'released')
  ON CONFLICT (id) DO NOTHING;

  -- 8. Insert Fake Reviews (Client to Worker)
  INSERT INTO public.marketplace_reviews (contract_id, reviewer_id, reviewee_id, direction, rating, comment)
  VALUES
    (ct1, c1, w1, 'client_to_worker', 5, 'Rahul is exceptional! The renders were photorealistic and he delivered a day before the deadline. Highly recommend.'),
    (ct2, c2, w2, 'client_to_worker', 5, 'Priya managed the Revit model perfectly. Very clean family structures and great communication.'),
    (ct3, c1, w3, 'client_to_worker', 4, 'Fast drafting work, Amit was responsive and made the revisions quickly.'),
    (ct4, c2, w4, 'client_to_worker', 5, 'Sneha brought fantastic creative ideas to the landscape design. The presentation boards were beautiful.'),
    (ct5, c1, w5, 'client_to_worker', 5, 'Vikram handled the cafe interior flawlessly. The detailed drawings saved us a lot of time during construction.'),
    (ct6, c2, w6, 'client_to_worker', 5, 'Anjali is a Grasshopper wizard. The script was clean, well-organized, and exactly what we needed.')
  ON CONFLICT (contract_id, direction) DO NOTHING;

  -- Note: The trigger `trg_worker_rating` will automatically update the `total_reviews` and `average_rating` in `worker_profiles`.

END $$;

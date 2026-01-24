
-- Create ebooks table
CREATE TABLE public.ebooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  file_url TEXT,
  cover_image_url TEXT,
  price_single INTEGER NOT NULL DEFAULT 50,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ebook purchases table
CREATE TABLE public.ebook_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ebook_ids UUID[] NOT NULL,
  total_amount INTEGER NOT NULL,
  discount_applied INTEGER DEFAULT 0,
  is_full_bundle BOOLEAN DEFAULT false,
  payment_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_purchases ENABLE ROW LEVEL SECURITY;

-- RLS for ebooks (public read, admin write)
CREATE POLICY "Anyone can view published ebooks" 
ON public.ebooks FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can manage ebooks" 
ON public.ebooks FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS for purchases
CREATE POLICY "Users can view their own purchases" 
ON public.ebook_purchases FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchases" 
ON public.ebook_purchases FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases" 
ON public.ebook_purchases FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert all the ebooks
INSERT INTO public.ebooks (title, description, category, order_index) VALUES
-- Category I: Fundamentals
('Architecture Form, Space, and Order', 'Essential guide to understanding architectural form and spatial relationships', 'Fundamentals of Design', 1),
('Fundamental Concepts of Architecture', 'Core architectural principles by Albanb Janson and Florian', 'Fundamentals of Design', 2),
('100 Site Analysis Essentials', 'An Architect''s comprehensive guide to site analysis', 'Fundamentals of Design', 3),
('Graphical Anatomy by Atelier Bow Wow', 'Visual exploration of architectural anatomy', 'Fundamentals of Design', 4),
('A Studio Guide to Interior Design', 'Complete interior design studio reference', 'Fundamentals of Design', 5),

-- Category II: Construction & Detailing
('Building Construction Handbook (12th Ed)', 'Chudley and Greeno''s comprehensive construction reference', 'Construction & Detailing', 6),
('Architect''s Handbook of Construction Detailing', 'Professional detailing guide for architects', 'Construction & Detailing', 7),
('Architectural Detailing: Function, Constructibility, Aesthetics', 'Mastering the art of architectural details', 'Construction & Detailing', 8),
('Exterior Building Enclosure', 'Complete guide to building envelope design', 'Construction & Detailing', 9),
('Estimating in Building Construction', 'Professional construction cost estimation', 'Construction & Detailing', 10),
('Brick Work by Laurie Baker', 'Traditional brickwork techniques and design', 'Construction & Detailing', 11),
('Neufert Architects'' Data', 'The essential architectural data reference', 'Construction & Detailing', 12),
('Architectural Graphic Standards', 'Industry-standard graphic conventions', 'Construction & Detailing', 13),
('Architect''s Room Design Data Handbook', 'Room-by-room design specifications', 'Construction & Detailing', 14),

-- Category III: Drawing & Representation
('Design Drawing by Francis D.K. Ching', 'Master architectural drawing techniques', 'Drawing & Representation', 15),
('Francis D. K. Ching Complete Works', 'Comprehensive architectural illustration', 'Drawing & Representation', 16),
('Architectural Drafting Design', 'Professional drafting methodology', 'Drawing & Representation', 17),
('Architectural Drafting for Beginners', 'Step-by-step drafting guide by Alan Jefferies', 'Drawing & Representation', 18),
('Construction Graphics', 'Visual communication in construction by Keith A. Bisharat', 'Drawing & Representation', 19),
('Drawing for Landscape Architects', 'Construction and Design Manual', 'Drawing & Representation', 20),
('Draw Like an Artist: 100 Buildings', 'Step-by-step architectural drawing guide', 'Drawing & Representation', 21),
('Drawing and Designing with Confidence', 'A step-by-step professional guide', 'Drawing & Representation', 22),
('Drawing for Architects', 'Explore concepts, define elements', 'Drawing & Representation', 23),

-- Category IV: Specialized Buildings
('Designing Interior Architecture', 'Professional interior architecture guide', 'Specialized Buildings & Interiors', 24),
('Designing Interiors by Rosemary Kilmer', 'Complete interior design methodology', 'Specialized Buildings & Interiors', 25),
('100 Restaurant Design Principles', 'F&B space design essentials', 'Specialized Buildings & Interiors', 26),
('Apartment Buildings: New Concepts', 'Modern residential design approaches', 'Specialized Buildings & Interiors', 27),
('Courtyard Houses - A Housing Typology', 'Traditional and modern courtyard design', 'Specialized Buildings & Interiors', 28),
('Graphic Guide to Residential Design', 'Visual residential planning eBook', 'Specialized Buildings & Interiors', 29),
('Guidelines for Hospital Design & Construction', 'Healthcare facility design standards', 'Specialized Buildings & Interiors', 30),
('Healing the Hospital Environment', 'Therapeutic healthcare design', 'Specialized Buildings & Interiors', 31),
('Basics Interior Design: Exhibition', 'Exhibition space design fundamentals', 'Specialized Buildings & Interiors', 32),
('Exhibition Design: An Introduction', 'Creating impactful exhibition spaces', 'Specialized Buildings & Interiors', 33),
('Basics Interior Design: Retail', 'Retail space design principles', 'Specialized Buildings & Interiors', 34),
('Designing the Department Store', 'Large-scale retail architecture', 'Specialized Buildings & Interiors', 35),
('Display, Commercial Space & Sign Design', 'Commercial interior design guide', 'Specialized Buildings & Interiors', 36),

-- Category V: Sustainable Design
('Climate Responsive Architecture', 'Design handbook for energy efficiency', 'Sustainable Design', 37),
('Design with Climate', 'Bioclimatic approach to regional architecture', 'Sustainable Design', 38),
('Environmental Science in Building', 'Building physics and environmental systems', 'Sustainable Design', 39),
('Sustainable Construction', 'Green Building Design and Delivery', 'Sustainable Design', 40),
('Handbook of Biophilic City Planning', 'Nature-integrated urban design by Timothy Beatley', 'Sustainable Design', 41),

-- Category VI: History & Legal
('100 20th-Century Buildings', 'Iconic buildings by Twentieth Century Society', 'History & Reference', 42),
('Encyclopaedia of Indian Temple Architecture', 'Complete guide to Indian temple design', 'History & Reference', 43),
('Architect''s Legal Handbook', 'The Law for Architects - Essential legal reference', 'History & Reference', 44),
('Architectural Record - October 2025', 'Latest industry trends and projects', 'History & Reference', 45),
('Building Design + Construction 2010', 'Industry insights and case studies', 'History & Reference', 46),
('Commercial Design Trends Magazine Vol 25', 'Contemporary commercial design', 'History & Reference', 47);

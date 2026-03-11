
-- Studio Rooms
CREATE TABLE public.studio_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT NOT NULL DEFAULT 'general',
  cover_image_url TEXT,
  mentor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mentor_name TEXT,
  max_members INTEGER DEFAULT 30,
  deadline TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active studio rooms"
  ON public.studio_rooms FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can create studio rooms"
  ON public.studio_rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their rooms"
  ON public.studio_rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their rooms"
  ON public.studio_rooms FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Studio Room Members
CREATE TABLE public.studio_room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.studio_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.studio_room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view room members"
  ON public.studio_room_members FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can join rooms"
  ON public.studio_room_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON public.studio_room_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Studio Room Reviews / Discussions
CREATE TABLE public.studio_room_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.studio_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  review_type TEXT NOT NULL DEFAULT 'discussion',
  image_url TEXT,
  parent_id UUID REFERENCES public.studio_room_reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_room_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view room reviews"
  ON public.studio_room_reviews FOR SELECT
  USING (true);

CREATE POLICY "Members can post reviews"
  ON public.studio_room_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.studio_room_members WHERE room_id = studio_room_reviews.room_id AND user_id = auth.uid())
  );

CREATE POLICY "Authors can delete their reviews"
  ON public.studio_room_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.studio_room_reviews;

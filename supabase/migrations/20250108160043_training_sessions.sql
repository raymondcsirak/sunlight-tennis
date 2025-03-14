-- Creare tabel coaches
CREATE TABLE coaches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  image_url TEXT,
  specialization TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserare antrenori din pagina de landing cu URL-uri corecte
INSERT INTO coaches (name, role, image_url, specialization) VALUES
  ('Alex Popescu', 'Head Coach', 'https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/coach-1.jpg', 'Lorem ipsum dolor sit amet'),
  ('Maria Ionescu', 'Junior Coach', 'https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/coach-2.jpg', 'Consectetur adipiscing elit'),
  ('Stefan Popa', 'Performance Coach', 'https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/coach-3.jpg', 'Sed do eiusmod tempor');

-- Creare tabel training_sessions
CREATE TABLE training_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coach_id UUID REFERENCES coaches(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Asigurare ca nu exista sesiuni overlapping pentru acelasi antrenor
  CONSTRAINT no_overlapping_sessions EXCLUDE USING gist (
    coach_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
); 
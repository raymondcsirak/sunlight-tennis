-- Adaugare campuri legate de antrenori in tabelul profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_coach BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS hourly_rate INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Actualizare randuri existente care sunt antrenori (daca exista) cu valoarea default de 50 lei pe ora
UPDATE profiles
SET hourly_rate = 50
WHERE is_coach = true;

-- Adaugare politica pentru a permite citirea profilurilor antrenorilor
CREATE POLICY "Anyone can view coach profiles"
ON profiles FOR SELECT
USING (is_coach = true);

-- Adaugare politica pentru a permite antrenorilor sa actualizeze propriul profil
CREATE POLICY "Coaches can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id AND is_coach = true)
WITH CHECK (auth.uid() = id AND is_coach = true);
-- Drop existing tables and types if they exist
DROP TABLE IF EXISTS match_statistics CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS match_request_responses CASCADE;
DROP TABLE IF EXISTS match_requests CASCADE;
DROP TYPE IF EXISTS match_status CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS request_visibility CASCADE;

-- Match Request System
CREATE TYPE request_status AS ENUM ('open', 'pending', 'confirmed', 'cancelled');
CREATE TYPE request_visibility AS ENUM ('public', 'skill_level', 'private');

-- Helper function to convert skill_level enum to integer
CREATE OR REPLACE FUNCTION skill_level_to_int(s skill_level)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE s
    WHEN '1' THEN 1
    WHEN '2' THEN 2
    WHEN '3' THEN 3
    WHEN '4' THEN 4
    WHEN '5' THEN 5
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE TABLE match_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  duration INTERVAL NOT NULL,
  skill_level_min INTEGER,
  skill_level_max INTEGER,
  court_preference UUID REFERENCES courts(id),
  visibility request_visibility DEFAULT 'skill_level',
  status request_status DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT valid_skill_range CHECK (skill_level_min <= skill_level_max),
  CONSTRAINT valid_skill_levels CHECK (
    skill_level_min BETWEEN 1 AND 5 AND
    skill_level_max BETWEEN 1 AND 5
  )
);

CREATE TABLE match_request_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES match_requests(id) NOT NULL,
  responder_id UUID REFERENCES auth.users(id) NOT NULL,
  status request_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT unique_response UNIQUE(request_id, responder_id)
);

-- Match History
CREATE TYPE match_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

CREATE TABLE matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  player1_id UUID REFERENCES auth.users(id) NOT NULL,
  player2_id UUID REFERENCES auth.users(id) NOT NULL,
  winner_id UUID REFERENCES auth.users(id),
  score TEXT,
  status match_status DEFAULT 'scheduled',
  xp_awarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT different_players CHECK (player1_id != player2_id),
  CONSTRAINT valid_winner CHECK (
    winner_id IS NULL OR 
    winner_id = player1_id OR 
    winner_id = player2_id
  )
);

-- Match Statistics
CREATE TABLE match_statistics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) NOT NULL,
  player_id UUID REFERENCES auth.users(id) NOT NULL,
  aces INTEGER DEFAULT 0,
  double_faults INTEGER DEFAULT 0,
  first_serve_percentage INTEGER,
  winners INTEGER DEFAULT 0,
  unforced_errors INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT valid_percentages CHECK (
    first_serve_percentage BETWEEN 0 AND 100
  ),
  CONSTRAINT valid_counts CHECK (
    aces >= 0 AND
    double_faults >= 0 AND
    winners >= 0 AND
    unforced_errors >= 0
  )
);

-- Enable RLS
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_request_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_statistics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view public and skill level match requests"
  ON match_requests FOR SELECT
  USING (
    visibility = 'public' OR
    (visibility = 'skill_level' AND EXISTS (
      SELECT 1 FROM player_skills ps
      WHERE ps.user_id = auth.uid()
      AND (
        (skill_level_to_int(ps.forehand_level) + skill_level_to_int(ps.backhand_level) + skill_level_to_int(ps.serve_level)) / 3
        BETWEEN skill_level_min AND skill_level_max
      )
    ))
  );

CREATE POLICY "Users can create match requests"
  ON match_requests FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their own requests"
  ON match_requests FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Users can view responses to their requests"
  ON match_request_responses FOR SELECT
  USING (
    auth.uid() IN (
      SELECT creator_id FROM match_requests WHERE id = request_id
    ) OR responder_id = auth.uid()
  );

CREATE POLICY "Users can respond to visible requests"
  ON match_request_responses FOR INSERT
  WITH CHECK (
    responder_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM match_requests
      WHERE id = request_id
      AND status = 'open'
      AND (visibility = 'public' OR
           (visibility = 'skill_level' AND EXISTS (
             SELECT 1 FROM player_skills ps
             WHERE ps.user_id = auth.uid()
             AND (
               (skill_level_to_int(ps.forehand_level) + skill_level_to_int(ps.backhand_level) + skill_level_to_int(ps.serve_level)) / 3
               BETWEEN skill_level_min AND skill_level_max
             )
           )))
    )
  );

CREATE POLICY "Users can view their matches"
  ON matches FOR SELECT
  USING (
    auth.uid() IN (player1_id, player2_id)
  );

CREATE POLICY "Users can view their match statistics"
  ON match_statistics FOR SELECT
  USING (
    auth.uid() = player_id OR
    auth.uid() IN (
      SELECT player1_id FROM matches m WHERE m.id = match_id
      UNION
      SELECT player2_id FROM matches m WHERE m.id = match_id
    )
  );

-- Triggers
CREATE TRIGGER update_match_requests_updated_at
  BEFORE UPDATE ON match_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_match_request_responses_updated_at
  BEFORE UPDATE ON match_request_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at(); 
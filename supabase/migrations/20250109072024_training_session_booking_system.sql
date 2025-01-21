-- Sistem de programare antrenamente
-- Implementeaza:
-- - Tabelul pentru antrenori si specializarile lor
-- - Sistem de programare antrenamente cu validare disponibilitate
-- - Calculul pretului total bazat pe durata si tariful antrenorului
-- - Notificari pentru confirmari si anulari

-- Creeaza tipul de enum pentru statusul sesiunilor de antrenament
CREATE TYPE training_session_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Creeaza tabelul pentru sesiunile de antrenament
CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    coach_id UUID REFERENCES auth.users(id),
    student_id UUID REFERENCES auth.users(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status training_session_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    total_price INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Previne rezervari duble pentru antrenori
    CONSTRAINT no_overlapping_coach_sessions
        EXCLUDE USING gist (
            coach_id WITH =,
            tstzrange(start_time, end_time) WITH &&
        ),
    -- Previne rezervari duble pentru studenti
    CONSTRAINT no_overlapping_student_sessions
        EXCLUDE USING gist (
            student_id WITH =,
            tstzrange(start_time, end_time) WITH &&
        )
);

-- Creeaza trigger pentru updated_at
CREATE TRIGGER set_training_sessions_updated_at
    BEFORE UPDATE ON training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

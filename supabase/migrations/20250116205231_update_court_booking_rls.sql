-- Sterge politici existente
DROP POLICY IF EXISTS "Users can view their own bookings" ON court_bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON court_bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON court_bookings;

-- Creeaza noile politici
CREATE POLICY "Anyone can view confirmed bookings"
    ON court_bookings FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own bookings"
    ON court_bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
    ON court_bookings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

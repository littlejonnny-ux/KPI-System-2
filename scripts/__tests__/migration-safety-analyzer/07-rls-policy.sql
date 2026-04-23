-- Fixture: L2 RLS POLICY — expect BLOCK (no marker)
CREATE POLICY "users_select" ON users FOR SELECT USING (auth.uid() = id);

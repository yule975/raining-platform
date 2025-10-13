-- Fix permissions for assignments and submissions tables

-- Grant basic permissions to anon role for assignments table
GRANT SELECT ON assignments TO anon;
GRANT SELECT ON assignments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON assignments TO authenticated;

-- Grant basic permissions to anon role for submissions table
GRANT SELECT ON submissions TO anon;
GRANT SELECT ON submissions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON submissions TO authenticated;

-- Create RLS policies for assignments table
DROP POLICY IF EXISTS "assignments_select_policy" ON assignments;
CREATE POLICY "assignments_select_policy" ON assignments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "assignments_insert_policy" ON assignments;
CREATE POLICY "assignments_insert_policy" ON assignments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "assignments_update_policy" ON assignments;
CREATE POLICY "assignments_update_policy" ON assignments
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "assignments_delete_policy" ON assignments;
CREATE POLICY "assignments_delete_policy" ON assignments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for submissions table
DROP POLICY IF EXISTS "submissions_select_policy" ON submissions;
CREATE POLICY "submissions_select_policy" ON submissions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "submissions_insert_policy" ON submissions;
CREATE POLICY "submissions_insert_policy" ON submissions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "submissions_update_policy" ON submissions;
CREATE POLICY "submissions_update_policy" ON submissions
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "submissions_delete_policy" ON submissions;
CREATE POLICY "submissions_delete_policy" ON submissions
    FOR DELETE USING (auth.role() = 'authenticated');
-- Fix training_sessions RLS policy to allow INSERT operations

-- Drop existing policies that might be blocking INSERT
DROP POLICY IF EXISTS "Allow public read access to training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Allow authenticated users full access to training sessions" ON training_sessions;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON training_sessions TO authenticated;
GRANT SELECT ON training_sessions TO anon;

-- Create new policies that allow INSERT operations
CREATE POLICY "Allow public read access to training sessions" ON training_sessions
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users full access to training sessions" ON training_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'training_sessions';
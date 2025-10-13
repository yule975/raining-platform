-- Check current permissions for assignments and submissions tables
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('assignments', 'submissions');

-- Grant permissions to anon role for reading assignments and submissions
GRANT SELECT ON assignments TO anon;
GRANT SELECT ON submissions TO anon;

-- Grant full permissions to authenticated role
GRANT ALL PRIVILEGES ON assignments TO authenticated;
GRANT ALL PRIVILEGES ON submissions TO authenticated;

-- Check RLS policies for assignments table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('assignments', 'submissions');

-- Create basic RLS policies if they don't exist
-- For assignments: allow authenticated users to read all assignments
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'assignments' 
        AND policyname = 'assignments_select_policy'
    ) THEN
        CREATE POLICY assignments_select_policy ON assignments
            FOR SELECT TO authenticated
            USING (true);
    END IF;
END $$;

-- For submissions: allow authenticated users to read all submissions
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'submissions' 
        AND policyname = 'submissions_select_policy'
    ) THEN
        CREATE POLICY submissions_select_policy ON submissions
            FOR SELECT TO authenticated
            USING (true);
    END IF;
END $$;

-- Allow authenticated users to insert/update/delete assignments (for admin users)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'assignments' 
        AND policyname = 'assignments_all_policy'
    ) THEN
        CREATE POLICY assignments_all_policy ON assignments
            FOR ALL TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Allow authenticated users to insert/update submissions
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'submissions' 
        AND policyname = 'submissions_all_policy'
    ) THEN
        CREATE POLICY submissions_all_policy ON submissions
            FOR ALL TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;
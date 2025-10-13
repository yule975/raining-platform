-- Create submissions view to point to assignment_submissions table
-- This fixes the table name mismatch issue in the API calls

-- Create view for submissions
CREATE OR REPLACE VIEW submissions AS
SELECT 
  id,
  assignment_id,
  student_id,
  content,
  file_url,
  status,
  submitted_at,
  graded_at,
  grade,
  feedback,
  created_at,
  updated_at
FROM assignment_submissions;

-- Grant permissions to the view
GRANT SELECT, INSERT, UPDATE, DELETE ON submissions TO authenticated;
GRANT SELECT ON submissions TO anon;

-- Enable RLS on the view
ALTER VIEW submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the submissions view
CREATE POLICY "Users can view their own submissions" ON submissions
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Users can insert their own submissions" ON submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Users can update their own submissions" ON submissions
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "Admins can view all submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all submissions" ON submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create trigger to handle INSERT/UPDATE/DELETE operations on the view
CREATE OR REPLACE FUNCTION handle_submissions_view()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO assignment_submissions (
      assignment_id, student_id, content, file_url, status, submitted_at
    ) VALUES (
      NEW.assignment_id, NEW.student_id, NEW.content, NEW.file_url, NEW.status, NEW.submitted_at
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE assignment_submissions SET
      assignment_id = NEW.assignment_id,
      student_id = NEW.student_id,
      content = NEW.content,
      file_url = NEW.file_url,
      status = NEW.status,
      submitted_at = NEW.submitted_at,
      graded_at = NEW.graded_at,
      grade = NEW.grade,
      feedback = NEW.feedback,
      updated_at = NEW.updated_at
    WHERE id = NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM assignment_submissions WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for the view
CREATE TRIGGER submissions_view_trigger
  INSTEAD OF INSERT OR UPDATE OR DELETE ON submissions
  FOR EACH ROW EXECUTE FUNCTION handle_submissions_view();
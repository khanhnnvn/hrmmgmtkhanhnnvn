/*
  # Fix RLS policies for anonymous access

  1. Candidates Table
    - Allow anonymous users to INSERT candidate applications
    - Allow HR/Admin to SELECT and UPDATE candidates
  
  2. Positions Table  
    - Allow anonymous users to SELECT open positions
    - Allow HR/Admin to manage all positions

  3. Security
    - Enable RLS on both tables
    - Create specific policies for anon role
    - Maintain proper access control for authenticated users
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Allow anon insert for candidates" ON candidates;
DROP POLICY IF EXISTS "Allow HR/Admin read candidates" ON candidates;
DROP POLICY IF EXISTS "Allow HR/Admin update candidates" ON candidates;
DROP POLICY IF EXISTS "allow_anon_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_public_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "Allow anon insert for candidates" ON candidates;

DROP POLICY IF EXISTS "allow_public_read_open_positions" ON positions;
DROP POLICY IF EXISTS "allow_hr_admin_read_all_positions" ON positions;
DROP POLICY IF EXISTS "allow_admin_manage_positions" ON positions;

-- Ensure RLS is enabled
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- Candidates table policies
CREATE POLICY "anon_can_insert_candidates"
  ON candidates
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "hr_admin_can_read_candidates"
  ON candidates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN')
      AND users.status = 'ACTIVE'
    )
  );

CREATE POLICY "hr_admin_can_update_candidates"
  ON candidates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN')
      AND users.status = 'ACTIVE'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN')
      AND users.status = 'ACTIVE'
    )
  );

-- Positions table policies
CREATE POLICY "anon_can_read_open_positions"
  ON positions
  FOR SELECT
  TO anon
  USING (is_open = true);

CREATE POLICY "authenticated_can_read_open_positions"
  ON positions
  FOR SELECT
  TO authenticated
  USING (is_open = true);

CREATE POLICY "hr_admin_can_read_all_positions"
  ON positions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN')
      AND users.status = 'ACTIVE'
    )
  );

CREATE POLICY "admin_can_manage_positions"
  ON positions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
      AND users.status = 'ACTIVE'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
      AND users.status = 'ACTIVE'
    )
  );

-- Insert sample positions if none exist
INSERT INTO positions (title, department, description, is_open)
SELECT 'Software Developer', 'IT', 'Develop and maintain software applications', true
WHERE NOT EXISTS (SELECT 1 FROM positions WHERE title = 'Software Developer');

INSERT INTO positions (title, department, description, is_open)
SELECT 'Frontend Developer', 'IT', 'Build user interfaces and web applications', true
WHERE NOT EXISTS (SELECT 1 FROM positions WHERE title = 'Frontend Developer');

INSERT INTO positions (title, department, description, is_open)
SELECT 'Backend Developer', 'IT', 'Develop server-side applications and APIs', true
WHERE NOT EXISTS (SELECT 1 FROM positions WHERE title = 'Backend Developer');
/*
  # Fix RLS policy for candidates table

  1. Security Changes
    - Drop existing conflicting policies on candidates table
    - Create new policy allowing anonymous users to insert candidates
    - Maintain existing policies for authenticated users

  This fixes the 401 error when submitting candidate applications.
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "allow_anon_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_hr_admin_read_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_hr_admin_update_candidates" ON candidates;

-- Create policy to allow anonymous users to insert candidates
CREATE POLICY "Allow anon insert for candidates"
  ON candidates
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow HR/Admin to read all candidates
CREATE POLICY "Allow HR/Admin read candidates"
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

-- Create policy to allow HR/Admin to update candidates
CREATE POLICY "Allow HR/Admin update candidates"
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
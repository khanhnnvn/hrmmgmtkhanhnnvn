/*
  # Fix RLS policy for candidates table to allow anonymous submissions

  1. Security Changes
    - Drop existing restrictive policies on candidates table
    - Create new policy allowing anonymous users to insert candidates
    - Maintain existing policies for authenticated users to read/update
  
  2. Changes Made
    - Allow anonymous (anon) role to INSERT into candidates table
    - Keep HR/Admin permissions for SELECT and UPDATE operations
    - Ensure public application form works without authentication
*/

-- Drop existing policies that might be blocking anonymous access
DROP POLICY IF EXISTS "anon_can_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "hr_admin_can_read_candidates" ON candidates;
DROP POLICY IF EXISTS "hr_admin_can_update_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_anonymous_candidate_submissions" ON candidates;

-- Create policy to allow anonymous users to submit applications
CREATE POLICY "allow_anon_insert_candidates"
  ON candidates
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow HR/Admin to read all candidates
CREATE POLICY "allow_hr_admin_read_candidates"
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
CREATE POLICY "allow_hr_admin_update_candidates"
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
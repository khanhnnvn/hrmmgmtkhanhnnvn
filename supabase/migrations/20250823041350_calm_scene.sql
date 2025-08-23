/*
  # Fix RLS Policy for Candidates Table

  1. Security Changes
    - Drop existing conflicting policies on candidates table
    - Create new policy to allow anonymous users to insert candidate applications
    - Ensure HR/Admin can still manage candidates
    - Keep other table policies intact

  2. Changes Made
    - Allow anonymous (anon) role to INSERT into candidates table
    - Allow authenticated HR/Admin users to SELECT and UPDATE candidates
    - Simple and clear policy structure to avoid conflicts
*/

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "allow_anonymous_candidate_submission" ON candidates;
DROP POLICY IF EXISTS "allow_authenticated_candidate_submission" ON candidates;
DROP POLICY IF EXISTS "allow_hr_admin_read_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_hr_admin_update_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_public_candidate_submission" ON candidates;

-- Create simple, clear policy for anonymous candidate submissions
CREATE POLICY "anon_can_insert_candidates"
  ON candidates
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow HR and Admin to read all candidates
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

-- Allow HR and Admin to update candidates
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
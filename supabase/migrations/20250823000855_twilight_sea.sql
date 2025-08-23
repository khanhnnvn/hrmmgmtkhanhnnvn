/*
  # Fix RLS policy for candidate submissions

  1. Security Changes
    - Allow anonymous users to insert candidates (for public application form)
    - Allow authenticated users to insert candidates
    - Maintain existing read policies for HR/Admin roles

  2. Notes
    - This enables the public candidate application form to work
    - Anonymous users can only INSERT, not read/update/delete
    - HR and Admin users retain full access
*/

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "anonymous_can_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "authenticated_can_insert_candidates" ON candidates;

-- Allow anonymous users to submit candidate applications
CREATE POLICY "allow_anonymous_candidate_submissions"
  ON candidates
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to submit candidate applications
CREATE POLICY "allow_authenticated_candidate_submissions"
  ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
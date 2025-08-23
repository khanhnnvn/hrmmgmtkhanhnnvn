/*
  # Allow anonymous candidate submissions

  1. Security Changes
    - Drop existing restrictive policies on candidates table
    - Create new policy allowing anonymous users to submit applications
    - Maintain existing policies for HR/Admin access
    - Allow anonymous users to read open positions

  2. Tables affected
    - `candidates` - Allow INSERT for anonymous users
    - `positions` - Allow SELECT for anonymous users to view open positions
*/

-- Drop existing restrictive policies that might be blocking anonymous access
DROP POLICY IF EXISTS "allow_anonymous_candidate_submissions" ON candidates;
DROP POLICY IF EXISTS "allow_authenticated_candidate_submissions" ON candidates;

-- Create policy to allow anonymous users to submit candidate applications
CREATE POLICY "anonymous_can_submit_applications"
  ON candidates
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow authenticated users to submit candidate applications  
CREATE POLICY "authenticated_can_submit_applications"
  ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure anonymous users can read open positions
DROP POLICY IF EXISTS "anonymous_can_read_open_positions" ON positions;
CREATE POLICY "anonymous_can_read_open_positions"
  ON positions
  FOR SELECT
  TO anon, authenticated
  USING (is_open = true);

-- Allow anonymous users to create audit logs for their submissions
DROP POLICY IF EXISTS "anonymous_can_create_audit_logs" ON audit_logs;
CREATE POLICY "anonymous_can_create_audit_logs"
  ON audit_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
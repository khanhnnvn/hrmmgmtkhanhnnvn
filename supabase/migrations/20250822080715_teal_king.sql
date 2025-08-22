/*
  # Fix candidates table RLS for anonymous inserts

  1. Security Changes
    - Drop existing conflicting INSERT policies
    - Create new policy allowing anonymous users to insert candidates
    - Ensure other policies remain intact for HR/Admin access

  This fixes the 42501 RLS policy violation preventing anonymous users
  from submitting job applications.
*/

-- Drop any existing INSERT policies that might be conflicting
DROP POLICY IF EXISTS "Allow candidate applications from anyone" ON candidates;
DROP POLICY IF EXISTS "Allow public insert for candidates" ON candidates;

-- Create a clear policy for anonymous inserts
CREATE POLICY "Anonymous can insert candidates"
  ON candidates
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Ensure authenticated users can also insert (if needed)
CREATE POLICY "Authenticated can insert candidates"
  ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
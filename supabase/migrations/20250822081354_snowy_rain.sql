/*
  # Fix candidates table RLS policy for anonymous inserts

  1. Security Changes
    - Drop existing conflicting INSERT policies for candidates table
    - Add new policy to allow anonymous users to insert candidates
    - Ensure RLS is enabled on candidates table

  This migration specifically addresses the 42501 RLS policy violation error
  that prevents anonymous users from submitting job applications.
*/

-- Drop any existing INSERT policies that might conflict
DROP POLICY IF EXISTS "anon_can_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "authenticated_can_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "Allow anonymous insert for candidates" ON candidates;
DROP POLICY IF EXISTS "Allow public insert for candidates" ON candidates;

-- Ensure RLS is enabled
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Create a simple, permissive INSERT policy for anonymous users
CREATE POLICY "anonymous_can_insert_candidates"
  ON candidates
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Also allow authenticated users to insert (for completeness)
CREATE POLICY "authenticated_can_insert_candidates"
  ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
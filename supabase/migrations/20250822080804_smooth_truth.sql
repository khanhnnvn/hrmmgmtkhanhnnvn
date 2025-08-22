/*
  # Add RLS policy for anonymous candidate inserts

  1. Security
    - Add policy to allow anonymous users to insert candidates
    - This enables the public job application form to work properly

  This migration specifically addresses the RLS policy violation error
  that prevents anonymous users from submitting job applications.
*/

-- Add policy to allow anonymous users to insert candidates
CREATE POLICY "Allow anonymous candidate applications"
  ON candidates
  FOR INSERT
  TO anon
  WITH CHECK (true);
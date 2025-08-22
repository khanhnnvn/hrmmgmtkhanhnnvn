/*
  # Fix anonymous candidate insert policy

  1. Security Changes
    - Drop existing restrictive policy for candidate inserts
    - Create new policy allowing anonymous users to insert candidates
    - Ensure anonymous users can submit job applications

  This migration fixes the RLS policy violation error that prevents
  unauthenticated users from submitting applications via /apply route.
*/

-- Drop the existing policy that might be too restrictive
DROP POLICY IF EXISTS "Allow anonymous candidate applications" ON candidates;

-- Create a new policy that explicitly allows anonymous inserts
CREATE POLICY "Enable anonymous candidate applications" 
ON candidates 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Also ensure authenticated users can still insert
CREATE POLICY "Enable authenticated candidate applications" 
ON candidates 
FOR INSERT 
TO authenticated 
WITH CHECK (true);
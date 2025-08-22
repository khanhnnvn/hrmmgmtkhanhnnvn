/*
  # Allow anonymous candidate applications

  1. Security Changes
    - Drop existing restrictive INSERT policies on candidates table
    - Create new policy allowing anonymous (anon) users to insert candidates
    - Maintain existing SELECT and UPDATE policies for HR/Admin users

  This migration fixes the RLS policy violation error (42501) that prevents
  anonymous users from submitting job applications through the public form.
*/

-- Drop existing INSERT policies that might be blocking anonymous users
DROP POLICY IF EXISTS "Enable anonymous candidate applications" ON candidates;
DROP POLICY IF EXISTS "Enable authenticated candidate applications" ON candidates;
DROP POLICY IF EXISTS "Allow anonymous to insert candidates" ON candidates;

-- Create a comprehensive INSERT policy for both anonymous and authenticated users
CREATE POLICY "Allow candidate applications from anyone"
  ON candidates
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ensure we still have the necessary SELECT and UPDATE policies
DO $$
BEGIN
  -- Check if HR/Admin SELECT policy exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'candidates' 
    AND policyname = 'HR and Admin can read all candidates'
  ) THEN
    CREATE POLICY "HR and Admin can read all candidates"
      ON candidates
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role IN ('HR', 'ADMIN')
        )
      );
  END IF;

  -- Check if HR/Admin UPDATE policy exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'candidates' 
    AND policyname = 'HR and Admin can update candidates'
  ) THEN
    CREATE POLICY "HR and Admin can update candidates"
      ON candidates
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role IN ('HR', 'ADMIN')
        )
      );
  END IF;
END $$;
/*
  # Fix candidates table RLS policy for anonymous applications

  1. Security Changes
    - Update RLS policy to allow anonymous users to insert candidate applications
    - Ensure the policy allows both anonymous and authenticated users to submit applications
    - Maintain security while enabling public application submissions

  This migration fixes the RLS policy violation that prevents anonymous users from submitting job applications.
*/

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Allow anonymous candidate applications" ON candidates;

-- Create a new policy that properly allows anonymous inserts
CREATE POLICY "Allow anonymous candidate applications" 
  ON candidates 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- Ensure the policy for HR and Admin to read candidates still exists
DO $$
BEGIN
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
END $$;

-- Ensure the policy for HR and Admin to update candidates still exists
DO $$
BEGIN
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
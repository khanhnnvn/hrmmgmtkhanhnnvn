/*
  # Fix RLS policies for candidates table - Final Fix

  1. Security Policies
    - Drop all existing conflicting policies
    - Create simple, working policy for anonymous insertions
    - Maintain proper access control for HR/Admin
    
  2. Testing
    - Allow anonymous users to INSERT candidates
    - Allow HR/Admin to SELECT and UPDATE candidates
    
  3. Debugging
    - Add logging to verify policy creation
*/

-- Drop all existing policies on candidates table
DROP POLICY IF EXISTS "anon_can_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "hr_admin_can_read_candidates" ON candidates;
DROP POLICY IF EXISTS "hr_admin_can_update_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_anon_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_public_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "auto_fix_anon_candidates" ON candidates;
DROP POLICY IF EXISTS "Allow anon insert for candidates" ON candidates;

-- Ensure RLS is enabled
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Create new working policies
CREATE POLICY "candidates_anon_insert_policy" ON candidates
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "candidates_hr_admin_select_policy" ON candidates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('HR', 'ADMIN') 
      AND users.status = 'ACTIVE'
    )
  );

CREATE POLICY "candidates_hr_admin_update_policy" ON candidates
  FOR UPDATE TO authenticated
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

-- Verify policies were created
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'candidates';
    
    RAISE NOTICE 'Total policies on candidates table: %', policy_count;
    
    IF policy_count < 3 THEN
        RAISE WARNING 'Expected at least 3 policies, found %', policy_count;
    ELSE
        RAISE NOTICE 'Successfully created % policies for candidates table', policy_count;
    END IF;
END $$;
/*
  # Fix RLS Policy for Candidates Table

  1. Security Changes
    - Drop existing conflicting policies on candidates table
    - Create new policy to allow anonymous users to insert candidates
    - Maintain existing policies for HR/Admin access
    - Ensure positions table is readable by anonymous users

  2. Tables Modified
    - `candidates` - Allow anonymous INSERT operations
    - `positions` - Ensure anonymous SELECT for open positions
*/

-- Drop all existing policies on candidates table to avoid conflicts
DROP POLICY IF EXISTS "candidates_anon_insert_policy" ON candidates;
DROP POLICY IF EXISTS "candidates_hr_admin_select_policy" ON candidates;
DROP POLICY IF EXISTS "candidates_hr_admin_update_policy" ON candidates;
DROP POLICY IF EXISTS "allow_anon_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_hr_admin_read_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_hr_admin_update_candidates" ON candidates;

-- Create the essential policy to allow anonymous users to insert candidates
CREATE POLICY "allow_anon_insert_candidates" ON public.candidates
  FOR INSERT TO anon
  WITH CHECK (true);

-- Recreate HR/Admin policies for reading and updating candidates
CREATE POLICY "allow_hr_admin_read_candidates" ON public.candidates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN')
      AND users.status = 'ACTIVE'
    )
  );

CREATE POLICY "allow_hr_admin_update_candidates" ON public.candidates
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

-- Ensure positions table allows anonymous users to read open positions
DROP POLICY IF EXISTS "anon_can_read_open_positions" ON positions;
DROP POLICY IF EXISTS "allow_anon_read_open_positions" ON positions;

CREATE POLICY "allow_anon_read_open_positions" ON public.positions
  FOR SELECT TO anon
  USING (is_open = true);

-- Also allow authenticated users to read open positions
DROP POLICY IF EXISTS "authenticated_can_read_open_positions" ON positions;
CREATE POLICY "allow_authenticated_read_open_positions" ON public.positions
  FOR SELECT TO authenticated
  USING (is_open = true);
/*
  # Fix anonymous candidate access and RLS policies

  1. Security Changes
    - Allow anonymous users to submit candidate applications
    - Allow anonymous users to read open positions
    - Maintain security for other operations
    - Fix RLS policies for public candidate form

  2. Tables Updated
    - candidates: Allow anonymous INSERT
    - positions: Allow anonymous SELECT for open positions
    - audit_logs: Allow anonymous INSERT for tracking
*/

-- Drop existing restrictive policies for candidates
DROP POLICY IF EXISTS "allow_anonymous_candidate_submissions" ON candidates;
DROP POLICY IF EXISTS "allow_authenticated_candidate_submissions" ON candidates;

-- Create new policy allowing anonymous candidate submissions
CREATE POLICY "anonymous_can_submit_applications" 
ON candidates 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Ensure HR/Admin can still manage candidates
CREATE POLICY "hr_admin_can_manage_candidates" 
ON candidates 
FOR ALL 
TO authenticated
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

-- Fix positions table for anonymous access to open positions
DROP POLICY IF EXISTS "anonymous_can_read_open_positions" ON positions;

CREATE POLICY "public_can_view_open_positions" 
ON positions 
FOR SELECT 
TO anon, authenticated
USING (is_open = true);

-- Ensure HR/Admin can manage positions
CREATE POLICY "hr_admin_can_manage_positions" 
ON positions 
FOR ALL 
TO authenticated
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

-- Fix audit logs for anonymous submissions
DROP POLICY IF EXISTS "anonymous_can_create_audit_logs" ON audit_logs;

CREATE POLICY "public_can_create_audit_logs" 
ON audit_logs 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Ensure HR/Admin can read audit logs
CREATE POLICY "hr_admin_can_read_audit_logs" 
ON audit_logs 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('HR', 'ADMIN') 
    AND users.status = 'ACTIVE'
  )
);
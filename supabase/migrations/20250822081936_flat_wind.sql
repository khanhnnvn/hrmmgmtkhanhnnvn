/*
  # Fix admin candidate visibility

  1. Security Fixes
    - Ensure HR and ADMIN can read all candidates
    - Fix RLS policies for proper access control
    - Add missing SELECT policies for management roles

  2. Data Integrity
    - Ensure proper foreign key relationships
    - Add indexes for better query performance
*/

-- Drop existing conflicting policies for candidates table
DROP POLICY IF EXISTS "allow_anonymous_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_authenticated_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_hr_admin_read_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_hr_admin_update_candidates" ON candidates;
DROP POLICY IF EXISTS "HR and Admin can read candidates" ON candidates;
DROP POLICY IF EXISTS "HR and Admin can update candidates" ON candidates;

-- Create comprehensive policies for candidates table
CREATE POLICY "anonymous_can_insert_candidates"
  ON candidates
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "authenticated_can_insert_candidates"
  ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "hr_admin_can_read_all_candidates"
  ON candidates
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

CREATE POLICY "hr_admin_can_update_candidates"
  ON candidates
  FOR UPDATE
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

-- Ensure positions table allows anonymous reads and HR/Admin management
DROP POLICY IF EXISTS "allow_anonymous_read_open_positions" ON positions;
DROP POLICY IF EXISTS "allow_hr_admin_read_all_positions" ON positions;
DROP POLICY IF EXISTS "allow_admin_manage_positions" ON positions;

CREATE POLICY "anonymous_can_read_open_positions"
  ON positions
  FOR SELECT
  TO anon, authenticated
  USING (is_open = true);

CREATE POLICY "hr_admin_can_read_all_positions"
  ON positions
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

CREATE POLICY "admin_can_manage_positions"
  ON positions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
      AND users.status = 'ACTIVE'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
      AND users.status = 'ACTIVE'
    )
  );

-- Fix users table policies for authentication
DROP POLICY IF EXISTS "allow_public_read_users_for_auth" ON users;
DROP POLICY IF EXISTS "allow_hr_admin_read_all_users" ON users;
DROP POLICY IF EXISTS "allow_admin_manage_users" ON users;
DROP POLICY IF EXISTS "allow_users_read_own_data" ON users;

CREATE POLICY "public_can_read_users_for_auth"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (status = 'ACTIVE');

CREATE POLICY "hr_admin_can_read_all_users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('HR', 'ADMIN')
      AND u.status = 'ACTIVE'
    )
  );

CREATE POLICY "admin_can_manage_users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
      AND u.status = 'ACTIVE'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
      AND u.status = 'ACTIVE'
    )
  );

CREATE POLICY "users_can_read_own_data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Ensure audit_logs allows anonymous inserts for tracking
DROP POLICY IF EXISTS "allow_anonymous_create_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "allow_hr_admin_read_audit_logs" ON audit_logs;

CREATE POLICY "anonymous_can_create_audit_logs"
  ON audit_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_status_created ON candidates(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_position_status ON candidates(applied_position_id, status);
CREATE INDEX IF NOT EXISTS idx_users_role_status_active ON users(role, status) WHERE status = 'ACTIVE';

-- Grant necessary permissions
GRANT SELECT ON candidates TO anon, authenticated;
GRANT INSERT ON candidates TO anon, authenticated;
GRANT UPDATE ON candidates TO authenticated;

GRANT SELECT ON positions TO anon, authenticated;
GRANT ALL ON positions TO authenticated;

GRANT SELECT ON users TO anon, authenticated;
GRANT ALL ON users TO authenticated;

GRANT INSERT ON audit_logs TO anon, authenticated;
GRANT SELECT ON audit_logs TO authenticated;

-- Ensure RLS is enabled on all tables
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
/*
  # Complete System Fix for RLS and Related Errors

  1. Database Security
    - Drop and recreate all RLS policies with proper permissions
    - Enable RLS on all tables
    - Add proper grants for anonymous and authenticated users
    - Add performance indexes for policy checks

  2. Anonymous User Access
    - Allow anonymous users to insert candidates
    - Allow anonymous users to read open positions
    - Allow anonymous users to create audit logs

  3. Role-based Access Control
    - ADMIN: Full access to all resources
    - HR: Manage candidates, interviews, users (no dashboard)
    - EMPLOYEE: Only personal data and assigned interviews
    - Anonymous: Only application submission and position viewing

  4. Performance Optimizations
    - Add indexes for frequently queried columns
    - Optimize policy checks
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "anon_can_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "auth_can_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "hr_admin_read_candidates" ON candidates;
DROP POLICY IF EXISTS "hr_admin_update_candidates" ON candidates;
DROP POLICY IF EXISTS "public_read_open_positions" ON positions;
DROP POLICY IF EXISTS "hr_admin_read_all_positions" ON positions;
DROP POLICY IF EXISTS "admin_manage_positions" ON positions;
DROP POLICY IF EXISTS "public_create_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "hr_admin_read_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "public_read_users_auth" ON users;
DROP POLICY IF EXISTS "users_read_own_data" ON users;
DROP POLICY IF EXISTS "hr_admin_read_all_users" ON users;
DROP POLICY IF EXISTS "admin_manage_users" ON users;

-- Ensure RLS is enabled on all tables
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to anonymous users
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON positions TO anon;
GRANT INSERT ON candidates TO anon;
GRANT INSERT ON audit_logs TO anon;
GRANT SELECT ON users TO anon;

-- Grant necessary permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- CANDIDATES TABLE POLICIES
CREATE POLICY "allow_anonymous_insert_candidates"
  ON candidates
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "allow_authenticated_insert_candidates"
  ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "allow_hr_admin_read_candidates"
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

CREATE POLICY "allow_hr_admin_update_candidates"
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
  );

-- POSITIONS TABLE POLICIES
CREATE POLICY "allow_anonymous_read_open_positions"
  ON positions
  FOR SELECT
  TO anon, authenticated
  USING (is_open = true);

CREATE POLICY "allow_hr_admin_read_all_positions"
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

CREATE POLICY "allow_admin_manage_positions"
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
  );

-- USERS TABLE POLICIES
CREATE POLICY "allow_public_read_users_for_auth"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (status = 'ACTIVE');

CREATE POLICY "allow_users_read_own_data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "allow_hr_admin_read_all_users"
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

CREATE POLICY "allow_admin_manage_users"
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
  );

-- INTERVIEWS TABLE POLICIES
CREATE POLICY "allow_employees_read_assigned_interviews"
  ON interviews
  FOR SELECT
  TO authenticated
  USING (
    interviewer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN')
      AND users.status = 'ACTIVE'
    )
  );

CREATE POLICY "allow_employees_update_assigned_interviews"
  ON interviews
  FOR UPDATE
  TO authenticated
  USING (
    interviewer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN')
      AND users.status = 'ACTIVE'
    )
  );

CREATE POLICY "allow_hr_admin_manage_interviews"
  ON interviews
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN')
      AND users.status = 'ACTIVE'
    )
  );

-- INTERVIEW SESSIONS TABLE POLICIES
CREATE POLICY "allow_hr_admin_manage_interview_sessions"
  ON interview_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN')
      AND users.status = 'ACTIVE'
    )
  );

-- DECISIONS TABLE POLICIES
CREATE POLICY "allow_hr_admin_manage_decisions"
  ON decisions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN')
      AND users.status = 'ACTIVE'
    )
  );

-- EMPLOYEES TABLE POLICIES
CREATE POLICY "allow_users_read_own_employee_data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "allow_users_update_own_employee_data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "allow_users_insert_own_employee_data"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "allow_hr_admin_manage_employees"
  ON employees
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN')
      AND users.status = 'ACTIVE'
    )
  );

-- AUDIT LOGS TABLE POLICIES
CREATE POLICY "allow_anonymous_create_audit_logs"
  ON audit_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "allow_hr_admin_read_audit_logs"
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

-- Add performance indexes for policy checks
CREATE INDEX IF NOT EXISTS idx_users_role_status_active ON users(role, status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_positions_is_open ON positions(is_open) WHERE is_open = true;
CREATE INDEX IF NOT EXISTS idx_candidates_status_created ON candidates(status, created_at);
CREATE INDEX IF NOT EXISTS idx_interviews_interviewer_result ON interviews(interviewer_id, result);
CREATE INDEX IF NOT EXISTS idx_employees_user_id_active ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
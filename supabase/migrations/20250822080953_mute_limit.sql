/*
  # Comprehensive fix for all RLS and related errors

  1. RLS Policies
    - Fix candidates table for anonymous inserts
    - Fix positions table for public reads
    - Fix users table for authentication
    - Fix audit_logs table for tracking
    - Fix all other tables for proper access

  2. Security
    - Enable RLS on all tables
    - Create proper policies for each role
    - Ensure data integrity

  3. Constraints and Indexes
    - Add missing constraints
    - Optimize queries with proper indexes
*/

-- Drop all existing problematic policies first
DROP POLICY IF EXISTS "Anonymous users can submit applications" ON candidates;
DROP POLICY IF EXISTS "Authenticated can insert candidates" ON candidates;
DROP POLICY IF EXISTS "Public can read open positions" ON positions;
DROP POLICY IF EXISTS "Public can read user info for auth" ON users;
DROP POLICY IF EXISTS "Public can create audit logs" ON audit_logs;

-- Ensure RLS is enabled on all tables
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- CANDIDATES TABLE POLICIES
-- Allow anonymous users to submit applications
CREATE POLICY "anon_can_insert_candidates"
  ON candidates
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert candidates
CREATE POLICY "authenticated_can_insert_candidates"
  ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow HR and Admin to read all candidates
CREATE POLICY "hr_admin_can_read_candidates"
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

-- Allow HR and Admin to update candidates
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
  );

-- POSITIONS TABLE POLICIES
-- Allow everyone to read open positions
CREATE POLICY "public_can_read_open_positions"
  ON positions
  FOR SELECT
  TO anon, authenticated
  USING (is_open = true);

-- Allow HR and Admin to read all positions
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

-- Allow Admin to manage positions
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
  );

-- USERS TABLE POLICIES
-- Allow public read for authentication
CREATE POLICY "public_can_read_users_for_auth"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (status = 'ACTIVE');

-- Allow users to read own data
CREATE POLICY "users_can_read_own_data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow HR and Admin to read all users
CREATE POLICY "hr_admin_can_read_all_users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users users_1
      WHERE users_1.id = auth.uid()
      AND users_1.role IN ('HR', 'ADMIN')
      AND users_1.status = 'ACTIVE'
    )
  );

-- Allow Admin to manage users
CREATE POLICY "admin_can_manage_users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users users_1
      WHERE users_1.id = auth.uid()
      AND users_1.role = 'ADMIN'
      AND users_1.status = 'ACTIVE'
    )
  );

-- AUDIT LOGS TABLE POLICIES
-- Allow public to create audit logs
CREATE POLICY "public_can_create_audit_logs"
  ON audit_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow HR and Admin to read audit logs
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

-- INTERVIEWS TABLE POLICIES
-- Allow employees to read assigned interviews
CREATE POLICY "employees_can_read_assigned_interviews"
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

-- Allow employees to update assigned interviews
CREATE POLICY "employees_can_update_assigned_interviews"
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

-- Allow HR and Admin to manage interviews
CREATE POLICY "hr_admin_can_manage_interviews"
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
-- Allow HR and Admin to manage interview sessions
CREATE POLICY "hr_admin_can_manage_interview_sessions"
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
-- Allow HR and Admin to manage decisions
CREATE POLICY "hr_admin_can_manage_decisions"
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
-- Allow HR and Admin to manage employees
CREATE POLICY "hr_admin_can_manage_employees"
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

-- Allow users to read own employee data
CREATE POLICY "users_can_read_own_employee_data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to update own employee data
CREATE POLICY "users_can_update_own_employee_data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_email_position ON candidates(email, applied_position_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Ensure proper constraints exist
DO $$
BEGIN
  -- Add unique constraint on candidates email + position if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'candidates_email_position_unique'
  ) THEN
    ALTER TABLE candidates ADD CONSTRAINT candidates_email_position_unique 
    UNIQUE (email, applied_position_id);
  END IF;
END $$;
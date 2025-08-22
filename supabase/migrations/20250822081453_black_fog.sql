/*
  # Comprehensive RLS Policy Fix

  1. Security Policies
    - Fix all RLS policies for proper anonymous and authenticated access
    - Ensure candidates table allows anonymous inserts
    - Ensure positions table allows anonymous reads
    - Fix all other tables with proper role-based access

  2. Data Integrity
    - Maintain proper foreign key constraints
    - Ensure audit logging works for all operations
    - Fix any policy conflicts

  3. Performance
    - Add necessary indexes for policy checks
    - Optimize policy conditions
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "anonymous_can_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "authenticated_can_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "hr_admin_can_read_candidates" ON candidates;
DROP POLICY IF EXISTS "hr_admin_can_update_candidates" ON candidates;
DROP POLICY IF EXISTS "HR and Admin can read all candidates" ON candidates;
DROP POLICY IF EXISTS "HR and Admin can update candidates" ON candidates;

DROP POLICY IF EXISTS "public_can_read_open_positions" ON positions;
DROP POLICY IF EXISTS "hr_admin_can_read_all_positions" ON positions;
DROP POLICY IF EXISTS "admin_can_manage_positions" ON positions;
DROP POLICY IF EXISTS "HR and Admin can read all positions" ON positions;
DROP POLICY IF EXISTS "Admin can manage positions" ON positions;

DROP POLICY IF EXISTS "public_can_create_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "hr_admin_can_read_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "HR and Admin can read audit logs" ON audit_logs;

DROP POLICY IF EXISTS "public_can_read_users_for_auth" ON users;
DROP POLICY IF EXISTS "users_can_read_own_data" ON users;
DROP POLICY IF EXISTS "hr_admin_can_read_all_users" ON users;
DROP POLICY IF EXISTS "admin_can_manage_users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "HR and Admin can read all users" ON users;
DROP POLICY IF EXISTS "Admin can manage users" ON users;

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
CREATE POLICY "anon_can_insert_candidates" ON candidates
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert candidates
CREATE POLICY "auth_can_insert_candidates" ON candidates
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow HR and Admin to read all candidates
CREATE POLICY "hr_admin_read_candidates" ON candidates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('HR', 'ADMIN') 
      AND users.status = 'ACTIVE'
    )
  );

-- Allow HR and Admin to update candidates
CREATE POLICY "hr_admin_update_candidates" ON candidates
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('HR', 'ADMIN') 
      AND users.status = 'ACTIVE'
    )
  );

-- POSITIONS TABLE POLICIES
-- Allow everyone (including anonymous) to read open positions
CREATE POLICY "public_read_open_positions" ON positions
  FOR SELECT TO anon, authenticated
  USING (is_open = true);

-- Allow HR and Admin to read all positions
CREATE POLICY "hr_admin_read_all_positions" ON positions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('HR', 'ADMIN') 
      AND users.status = 'ACTIVE'
    )
  );

-- Allow Admin to manage positions
CREATE POLICY "admin_manage_positions" ON positions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN' 
      AND users.status = 'ACTIVE'
    )
  );

-- USERS TABLE POLICIES
-- Allow public read for authentication (limited fields)
CREATE POLICY "public_read_users_auth" ON users
  FOR SELECT TO anon, authenticated
  USING (status = 'ACTIVE');

-- Allow users to read their own data
CREATE POLICY "users_read_own_data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Allow HR and Admin to read all users
CREATE POLICY "hr_admin_read_all_users" ON users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('HR', 'ADMIN') 
      AND u.status = 'ACTIVE'
    )
  );

-- Allow Admin to manage users
CREATE POLICY "admin_manage_users" ON users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role = 'ADMIN' 
      AND u.status = 'ACTIVE'
    )
  );

-- INTERVIEWS TABLE POLICIES
-- Allow employees to read their assigned interviews
CREATE POLICY "employees_read_assigned_interviews" ON interviews
  FOR SELECT TO authenticated
  USING (
    interviewer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('HR', 'ADMIN') 
      AND users.status = 'ACTIVE'
    )
  );

-- Allow employees to update their assigned interviews
CREATE POLICY "employees_update_assigned_interviews" ON interviews
  FOR UPDATE TO authenticated
  USING (
    interviewer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('HR', 'ADMIN') 
      AND users.status = 'ACTIVE'
    )
  );

-- Allow HR and Admin to manage all interviews
CREATE POLICY "hr_admin_manage_interviews" ON interviews
  FOR ALL TO authenticated
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
CREATE POLICY "hr_admin_manage_interview_sessions" ON interview_sessions
  FOR ALL TO authenticated
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
CREATE POLICY "hr_admin_manage_decisions" ON decisions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('HR', 'ADMIN') 
      AND users.status = 'ACTIVE'
    )
  );

-- EMPLOYEES TABLE POLICIES
-- Allow users to read their own employee data
CREATE POLICY "users_read_own_employee_data" ON employees
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Allow users to update their own employee data
CREATE POLICY "users_update_own_employee_data" ON employees
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Allow users to insert their own employee data
CREATE POLICY "users_insert_own_employee_data" ON employees
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow HR and Admin to manage all employee data
CREATE POLICY "hr_admin_manage_employees" ON employees
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('HR', 'ADMIN') 
      AND users.status = 'ACTIVE'
    )
  );

-- AUDIT LOGS TABLE POLICIES
-- Allow everyone to create audit logs (for tracking)
CREATE POLICY "public_create_audit_logs" ON audit_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow HR and Admin to read audit logs
CREATE POLICY "hr_admin_read_audit_logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('HR', 'ADMIN') 
      AND users.status = 'ACTIVE'
    )
  );

-- Add indexes for better performance on policy checks
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_positions_is_open ON positions(is_open);
CREATE INDEX IF NOT EXISTS idx_interviews_interviewer ON interviews(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON positions TO anon;
GRANT INSERT ON candidates TO anon;
GRANT INSERT ON audit_logs TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
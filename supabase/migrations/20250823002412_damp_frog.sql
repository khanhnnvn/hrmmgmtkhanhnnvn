/*
  # Fix Supabase Request Failures

  1. Security
    - Drop all existing RLS policies that may be causing conflicts
    - Create comprehensive policies for all tables
    - Enable proper anonymous access for public operations
    - Ensure authenticated users have proper access

  2. Tables Updated
    - candidates: Allow anonymous INSERT, HR/Admin management
    - positions: Allow public SELECT for open positions
    - users: Allow public SELECT for authentication
    - interviews: Employee and HR/Admin access
    - interview_sessions: HR/Admin management
    - decisions: HR/Admin management
    - employees: User self-management, HR/Admin full access
    - audit_logs: Public INSERT, HR/Admin SELECT

  3. Sample Data
    - Add default positions if none exist
    - Ensure admin user exists
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "anonymous_can_submit_applications" ON candidates;
DROP POLICY IF EXISTS "authenticated_can_submit_applications" ON candidates;
DROP POLICY IF EXISTS "hr_admin_can_read_all_candidates" ON candidates;
DROP POLICY IF EXISTS "hr_admin_can_update_candidates" ON candidates;
DROP POLICY IF EXISTS "public_can_submit_applications" ON candidates;

DROP POLICY IF EXISTS "anonymous_can_read_open_positions" ON positions;
DROP POLICY IF EXISTS "hr_admin_can_read_all_positions" ON positions;
DROP POLICY IF EXISTS "admin_can_manage_positions" ON positions;
DROP POLICY IF EXISTS "public_can_read_open_positions" ON positions;

DROP POLICY IF EXISTS "public_can_read_users_for_auth" ON users;
DROP POLICY IF EXISTS "users_can_read_own_data" ON users;
DROP POLICY IF EXISTS "hr_admin_can_read_all_users" ON users;
DROP POLICY IF EXISTS "admin_can_manage_users" ON users;

DROP POLICY IF EXISTS "employees_can_read_assigned_interviews" ON interviews;
DROP POLICY IF EXISTS "employees_can_update_assigned_interviews" ON interviews;
DROP POLICY IF EXISTS "hr_admin_can_manage_interviews" ON interviews;
DROP POLICY IF EXISTS "allow_employees_read_assigned_interviews" ON interviews;
DROP POLICY IF EXISTS "allow_employees_update_assigned_interviews" ON interviews;
DROP POLICY IF EXISTS "allow_hr_admin_manage_interviews" ON interviews;
DROP POLICY IF EXISTS "employees_read_assigned_interviews" ON interviews;
DROP POLICY IF EXISTS "employees_update_assigned_interviews" ON interviews;
DROP POLICY IF EXISTS "hr_admin_manage_interviews" ON interviews;
DROP POLICY IF EXISTS "Employees can read assigned interviews" ON interviews;
DROP POLICY IF EXISTS "Employees can update assigned interviews" ON interviews;
DROP POLICY IF EXISTS "HR and Admin can manage interviews" ON interviews;

DROP POLICY IF EXISTS "allow_hr_admin_manage_interview_sessions" ON interview_sessions;
DROP POLICY IF EXISTS "hr_admin_can_manage_interview_sessions" ON interview_sessions;
DROP POLICY IF EXISTS "hr_admin_manage_interview_sessions" ON interview_sessions;
DROP POLICY IF EXISTS "HR and Admin can manage interview sessions" ON interview_sessions;

DROP POLICY IF EXISTS "allow_hr_admin_manage_decisions" ON decisions;
DROP POLICY IF EXISTS "hr_admin_can_manage_decisions" ON decisions;
DROP POLICY IF EXISTS "hr_admin_manage_decisions" ON decisions;
DROP POLICY IF EXISTS "HR and Admin can manage decisions" ON decisions;

DROP POLICY IF EXISTS "allow_users_insert_own_employee_data" ON employees;
DROP POLICY IF EXISTS "allow_users_read_own_employee_data" ON employees;
DROP POLICY IF EXISTS "allow_users_update_own_employee_data" ON employees;
DROP POLICY IF EXISTS "allow_hr_admin_manage_employees" ON employees;
DROP POLICY IF EXISTS "users_insert_own_employee_data" ON employees;
DROP POLICY IF EXISTS "users_read_own_employee_data" ON employees;
DROP POLICY IF EXISTS "users_update_own_employee_data" ON employees;
DROP POLICY IF EXISTS "hr_admin_manage_employees" ON employees;
DROP POLICY IF EXISTS "Users can read own employee data" ON employees;
DROP POLICY IF EXISTS "Users can update own employee data" ON employees;
DROP POLICY IF EXISTS "HR and Admin can manage employees" ON employees;
DROP POLICY IF EXISTS "users_can_read_own_employee_data" ON employees;
DROP POLICY IF EXISTS "users_can_update_own_employee_data" ON employees;
DROP POLICY IF EXISTS "hr_admin_can_manage_employees" ON employees;

DROP POLICY IF EXISTS "anonymous_can_create_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "hr_admin_can_read_audit_logs" ON audit_logs;

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
CREATE POLICY "allow_anonymous_candidate_submission" ON candidates
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow authenticated users to submit applications
CREATE POLICY "allow_authenticated_candidate_submission" ON candidates
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow HR and Admin to read all candidates
CREATE POLICY "allow_hr_admin_read_candidates" ON candidates
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
CREATE POLICY "allow_hr_admin_update_candidates" ON candidates
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

-- POSITIONS TABLE POLICIES
-- Allow everyone to read open positions
CREATE POLICY "allow_public_read_open_positions" ON positions
  FOR SELECT TO anon, authenticated
  USING (is_open = true);

-- Allow HR and Admin to read all positions
CREATE POLICY "allow_hr_admin_read_all_positions" ON positions
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
CREATE POLICY "allow_admin_manage_positions" ON positions
  FOR ALL TO authenticated
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

-- USERS TABLE POLICIES
-- Allow public to read active users for authentication
CREATE POLICY "allow_public_read_active_users" ON users
  FOR SELECT TO anon, authenticated
  USING (status = 'ACTIVE');

-- Allow users to read their own data
CREATE POLICY "allow_users_read_own_data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Allow HR and Admin to read all users
CREATE POLICY "allow_hr_admin_read_all_users" ON users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('HR', 'ADMIN') 
      AND u.status = 'ACTIVE'
    )
  );

-- Allow Admin to manage all users
CREATE POLICY "allow_admin_manage_users" ON users
  FOR ALL TO authenticated
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

-- INTERVIEWS TABLE POLICIES
-- Allow employees to read their assigned interviews
CREATE POLICY "allow_employees_read_assigned_interviews" ON interviews
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
CREATE POLICY "allow_employees_update_assigned_interviews" ON interviews
  FOR UPDATE TO authenticated
  USING (
    interviewer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('HR', 'ADMIN') 
      AND users.status = 'ACTIVE'
    )
  )
  WITH CHECK (
    interviewer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('HR', 'ADMIN') 
      AND users.status = 'ACTIVE'
    )
  );

-- Allow HR and Admin to manage all interviews
CREATE POLICY "allow_hr_admin_manage_all_interviews" ON interviews
  FOR ALL TO authenticated
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

-- INTERVIEW SESSIONS TABLE POLICIES
-- Allow HR and Admin to manage interview sessions
CREATE POLICY "allow_hr_admin_manage_interview_sessions" ON interview_sessions
  FOR ALL TO authenticated
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

-- DECISIONS TABLE POLICIES
-- Allow HR and Admin to manage decisions
CREATE POLICY "allow_hr_admin_manage_decisions" ON decisions
  FOR ALL TO authenticated
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

-- EMPLOYEES TABLE POLICIES
-- Allow users to insert their own employee data
CREATE POLICY "allow_users_insert_own_employee_data" ON employees
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to read their own employee data
CREATE POLICY "allow_users_read_own_employee_data" ON employees
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Allow users to update their own employee data
CREATE POLICY "allow_users_update_own_employee_data" ON employees
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow HR and Admin to manage all employee data
CREATE POLICY "allow_hr_admin_manage_all_employees" ON employees
  FOR ALL TO authenticated
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

-- AUDIT LOGS TABLE POLICIES
-- Allow everyone to create audit logs
CREATE POLICY "allow_public_create_audit_logs" ON audit_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow HR and Admin to read audit logs
CREATE POLICY "allow_hr_admin_read_audit_logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('HR', 'ADMIN') 
      AND users.status = 'ACTIVE'
    )
  );

-- Insert sample positions if none exist
INSERT INTO positions (title, department, description, is_open)
SELECT 'Lập trình viên Frontend', 'IT', 'Phát triển giao diện người dùng với React, TypeScript', true
WHERE NOT EXISTS (SELECT 1 FROM positions WHERE title = 'Lập trình viên Frontend');

INSERT INTO positions (title, department, description, is_open)
SELECT 'Lập trình viên Backend', 'IT', 'Phát triển API và hệ thống backend với Node.js', true
WHERE NOT EXISTS (SELECT 1 FROM positions WHERE title = 'Lập trình viên Backend');

INSERT INTO positions (title, department, description, is_open)
SELECT 'Nhân viên Marketing', 'Marketing', 'Lập kế hoạch và thực hiện các chiến dịch marketing', true
WHERE NOT EXISTS (SELECT 1 FROM positions WHERE title = 'Nhân viên Marketing');

INSERT INTO positions (title, department, description, is_open)
SELECT 'Nhân viên Kế toán', 'Tài chính', 'Quản lý tài chính và kế toán công ty', true
WHERE NOT EXISTS (SELECT 1 FROM positions WHERE title = 'Nhân viên Kế toán');

-- Ensure admin user exists
INSERT INTO users (email, username, full_name, phone, role, status)
SELECT 'admin@company.com', 'admin', 'Quản trị viên hệ thống', '0912345678', 'ADMIN', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@company.com');
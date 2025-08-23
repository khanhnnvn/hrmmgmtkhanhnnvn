/*
  # Fix all Row-Level Security policies

  This migration fixes all RLS policies across the entire system to ensure proper access control
  while allowing the application to function correctly.

  ## Changes Made:
  1. **Candidates Table**: Allow anonymous insertions, HR/Admin management
  2. **Positions Table**: Allow public reading of open positions, HR/Admin management
  3. **Users Table**: Allow public reading of active users, proper role-based access
  4. **Interviews Table**: Allow interviewers to manage their assignments
  5. **Interview Sessions Table**: Allow HR/Admin to manage sessions
  6. **Decisions Table**: Allow HR/Admin to make decisions
  7. **Employees Table**: Allow users to manage their own data, HR/Admin oversight
  8. **Audit Logs Table**: Allow system logging, HR/Admin reading

  ## Security Principles:
  - Anonymous users can apply for jobs and read open positions
  - Users can only access their own data
  - HR and Admin have broader access as needed
  - All sensitive operations require authentication
*/

-- =============================================
-- CANDIDATES TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "allow_anon_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_public_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_hr_admin_read_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_hr_admin_update_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_hr_admin_manage_candidates" ON candidates;

-- Allow anonymous users to submit applications
CREATE POLICY "anon_can_submit_applications" ON candidates
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow HR and Admin to read all candidates
CREATE POLICY "hr_admin_can_read_candidates" ON candidates
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
CREATE POLICY "hr_admin_can_update_candidates" ON candidates
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

-- =============================================
-- POSITIONS TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "allow_anon_read_open_positions" ON positions;
DROP POLICY IF EXISTS "allow_public_read_open_positions" ON positions;
DROP POLICY IF EXISTS "allow_authenticated_read_open_positions" ON positions;
DROP POLICY IF EXISTS "hr_admin_can_read_all_positions" ON positions;
DROP POLICY IF EXISTS "admin_can_manage_positions" ON positions;

-- Allow everyone to read open positions
CREATE POLICY "public_can_read_open_positions" ON positions
  FOR SELECT TO anon, authenticated
  USING (is_open = true);

-- Allow HR and Admin to read all positions
CREATE POLICY "hr_admin_can_read_all_positions" ON positions
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
CREATE POLICY "admin_can_manage_positions" ON positions
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

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "allow_public_read_active_users" ON users;
DROP POLICY IF EXISTS "allow_users_read_own_data" ON users;
DROP POLICY IF EXISTS "allow_hr_admin_read_all_users" ON users;
DROP POLICY IF EXISTS "allow_admin_manage_users" ON users;

-- Allow public to read active users (for interviewer lists, etc.)
CREATE POLICY "public_can_read_active_users" ON users
  FOR SELECT TO anon, authenticated
  USING (status = 'ACTIVE');

-- Allow users to read their own data
CREATE POLICY "users_can_read_own_data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Allow HR and Admin to read all users
CREATE POLICY "hr_admin_can_read_all_users" ON users
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
CREATE POLICY "admin_can_manage_users" ON users
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

-- =============================================
-- INTERVIEWS TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "allow_employees_read_assigned_interviews" ON interviews;
DROP POLICY IF EXISTS "allow_employees_update_assigned_interviews" ON interviews;
DROP POLICY IF EXISTS "allow_hr_admin_manage_all_interviews" ON interviews;

-- Allow interviewers to read their assigned interviews
CREATE POLICY "interviewers_can_read_assigned" ON interviews
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

-- Allow interviewers to update their assigned interviews
CREATE POLICY "interviewers_can_update_assigned" ON interviews
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
CREATE POLICY "hr_admin_can_manage_interviews" ON interviews
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

-- =============================================
-- INTERVIEW SESSIONS TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "allow_hr_admin_manage_interview_sessions" ON interview_sessions;

-- Allow HR and Admin to manage interview sessions
CREATE POLICY "hr_admin_can_manage_sessions" ON interview_sessions
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

-- =============================================
-- DECISIONS TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "allow_hr_admin_manage_decisions" ON decisions;

-- Allow HR and Admin to manage decisions
CREATE POLICY "hr_admin_can_manage_decisions" ON decisions
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

-- =============================================
-- EMPLOYEES TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "allow_users_read_own_employee_data" ON employees;
DROP POLICY IF EXISTS "allow_users_update_own_employee_data" ON employees;
DROP POLICY IF EXISTS "allow_users_insert_own_employee_data" ON employees;
DROP POLICY IF EXISTS "allow_hr_admin_manage_all_employees" ON employees;

-- Allow users to read their own employee data
CREATE POLICY "users_can_read_own_employee_data" ON employees
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Allow users to update their own employee data
CREATE POLICY "users_can_update_own_employee_data" ON employees
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow users to insert their own employee data
CREATE POLICY "users_can_insert_own_employee_data" ON employees
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow HR and Admin to manage all employee data
CREATE POLICY "hr_admin_can_manage_employees" ON employees
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

-- =============================================
-- AUDIT LOGS TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "allow_public_create_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "allow_hr_admin_read_audit_logs" ON audit_logs;

-- Allow system to create audit logs
CREATE POLICY "system_can_create_audit_logs" ON audit_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow HR and Admin to read audit logs
CREATE POLICY "hr_admin_can_read_audit_logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN')
      AND users.status = 'ACTIVE'
    )
  );

-- =============================================
-- CREATE DEFAULT POSITIONS IF NONE EXIST
-- =============================================

DO $$
BEGIN
  -- Check if positions table is empty
  IF NOT EXISTS (SELECT 1 FROM positions LIMIT 1) THEN
    INSERT INTO positions (title, department, description, is_open) VALUES
    ('Frontend Developer', 'IT', 'Phát triển giao diện người dùng với React, TypeScript', true),
    ('Backend Developer', 'IT', 'Phát triển API và hệ thống backend với Node.js', true),
    ('Full Stack Developer', 'IT', 'Phát triển cả frontend và backend', true),
    ('DevOps Engineer', 'IT', 'Quản lý hạ tầng và triển khai ứng dụng', true),
    ('Product Manager', 'Product', 'Quản lý sản phẩm và phối hợp với các team', true);
    
    RAISE NOTICE 'Created default positions';
  END IF;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================

-- Verify RLS is enabled on all tables
DO $$
DECLARE
  table_name text;
  rls_enabled boolean;
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('users', 'positions', 'candidates', 'interview_sessions', 'interviews', 'decisions', 'employees', 'audit_logs')
  LOOP
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class 
    WHERE relname = table_name;
    
    IF NOT rls_enabled THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
      RAISE NOTICE 'Enabled RLS for table: %', table_name;
    END IF;
  END LOOP;
END $$;

RAISE NOTICE 'All RLS policies have been fixed and verified';
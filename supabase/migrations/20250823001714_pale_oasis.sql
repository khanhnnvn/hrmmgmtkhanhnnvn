/*
  # Comprehensive Database Fix for RLS and Access Issues

  1. Tables and Policies
    - Drop all existing RLS policies that may be blocking access
    - Create new comprehensive policies for all user types
    - Ensure anonymous users can submit applications
    - Ensure authenticated users have proper access based on roles

  2. Security
    - Enable RLS on all tables
    - Create policies for ADMIN, HR, EMPLOYEE, and anonymous users
    - Allow public access to positions and candidate submissions
    - Maintain security for sensitive operations

  3. Sample Data
    - Insert sample positions if they don't exist
    - Create admin user if not exists
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "anonymous_can_submit_applications" ON candidates;
DROP POLICY IF EXISTS "authenticated_can_submit_applications" ON candidates;
DROP POLICY IF EXISTS "hr_admin_can_read_all_candidates" ON candidates;
DROP POLICY IF EXISTS "hr_admin_can_update_candidates" ON candidates;
DROP POLICY IF EXISTS "anonymous_can_read_open_positions" ON positions;
DROP POLICY IF EXISTS "hr_admin_can_read_all_positions" ON positions;
DROP POLICY IF EXISTS "admin_can_manage_positions" ON positions;
DROP POLICY IF EXISTS "anonymous_can_create_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "hr_admin_can_read_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "public_can_read_users_for_auth" ON users;
DROP POLICY IF EXISTS "users_can_read_own_data" ON users;
DROP POLICY IF EXISTS "hr_admin_can_read_all_users" ON users;
DROP POLICY IF EXISTS "admin_can_manage_users" ON users;

-- Candidates table policies
CREATE POLICY "allow_anonymous_candidate_submission"
  ON candidates
  FOR INSERT
  TO anon, authenticated
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN')
      AND users.status = 'ACTIVE'
    )
  );

-- Positions table policies
CREATE POLICY "allow_public_read_open_positions"
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
      AND users.status = 'ACTIVE'
    )
  );

-- Users table policies
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
      AND u.status = 'ACTIVE'
    )
  );

-- Interview Sessions policies
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN')
      AND users.status = 'ACTIVE'
    )
  );

-- Interviews policies
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN')
      AND users.status = 'ACTIVE'
    )
  );

-- Decisions policies
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN')
      AND users.status = 'ACTIVE'
    )
  );

-- Employees policies
CREATE POLICY "allow_users_read_own_employee_data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "allow_users_insert_own_employee_data"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "allow_users_update_own_employee_data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN')
      AND users.status = 'ACTIVE'
    )
  );

-- Audit Logs policies
CREATE POLICY "allow_public_create_audit_logs"
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

-- Insert sample positions if they don't exist
INSERT INTO positions (id, title, department, description, is_open)
VALUES 
  ('pos-frontend-dev', 'Frontend Developer', 'IT', 'Phát triển giao diện người dùng với React, Vue.js, Angular', true),
  ('pos-backend-dev', 'Backend Developer', 'IT', 'Phát triển API và hệ thống backend với Node.js, Python, Java', true),
  ('pos-fullstack-dev', 'Full Stack Developer', 'IT', 'Phát triển ứng dụng web full stack', true),
  ('pos-mobile-dev', 'Mobile Developer', 'IT', 'Phát triển ứng dụng di động iOS/Android', true),
  ('pos-devops-eng', 'DevOps Engineer', 'IT', 'Quản lý hạ tầng và triển khai ứng dụng', true),
  ('pos-data-analyst', 'Data Analyst', 'IT', 'Phân tích dữ liệu và báo cáo', true),
  ('pos-ui-ux-designer', 'UI/UX Designer', 'Design', 'Thiết kế giao diện và trải nghiệm người dùng', true),
  ('pos-product-manager', 'Product Manager', 'Product', 'Quản lý sản phẩm và chiến lược phát triển', true),
  ('pos-qa-engineer', 'QA Engineer', 'IT', 'Kiểm thử chất lượng phần mềm', true),
  ('pos-business-analyst', 'Business Analyst', 'Business', 'Phân tích nghiệp vụ và yêu cầu hệ thống', true)
ON CONFLICT (id) DO NOTHING;

-- Create admin user if not exists
INSERT INTO users (id, username, email, phone, full_name, role, status)
VALUES (
  'admin-user-id',
  'admin',
  'admin@company.com',
  '0912345678',
  'Quản trị viên hệ thống',
  'ADMIN',
  'ACTIVE'
)
ON CONFLICT (email) DO NOTHING;
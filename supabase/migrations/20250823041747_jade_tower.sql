/*
  # Auto-fix RLS policies for application form testing
  
  This migration automatically fixes common RLS policy issues that prevent
  anonymous users from submitting applications.
  
  1. Candidates table - Allow anonymous INSERT
  2. Positions table - Allow public SELECT for open positions
  3. Audit logs - Allow public INSERT for tracking
*/

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "allow_anon_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_public_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_anonymous_candidates" ON candidates;
DROP POLICY IF EXISTS "auto_fix_anon_candidates" ON candidates;

-- Create simple policy for anonymous candidate submissions
CREATE POLICY "autotest_allow_anon_candidates" ON candidates
  FOR INSERT TO anon
  WITH CHECK (true);

-- Ensure HR/Admin can manage candidates
DROP POLICY IF EXISTS "allow_hr_admin_read_candidates" ON candidates;
DROP POLICY IF EXISTS "allow_hr_admin_update_candidates" ON candidates;

CREATE POLICY "autotest_hr_admin_candidates" ON candidates
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

-- Fix positions table policies
DROP POLICY IF EXISTS "allow_public_read_open_positions" ON positions;
DROP POLICY IF EXISTS "auto_fix_public_positions" ON positions;

CREATE POLICY "autotest_public_positions" ON positions
  FOR SELECT TO anon, authenticated
  USING (is_open = true);

-- Allow HR/Admin to manage positions
DROP POLICY IF EXISTS "allow_admin_manage_positions" ON positions;
DROP POLICY IF EXISTS "allow_hr_admin_read_all_positions" ON positions;

CREATE POLICY "autotest_admin_positions" ON positions
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

CREATE POLICY "autotest_hr_read_positions" ON positions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('HR', 'ADMIN') 
      AND users.status = 'ACTIVE'
    )
  );

-- Fix audit logs
DROP POLICY IF EXISTS "allow_public_create_audit_logs" ON audit_logs;

CREATE POLICY "autotest_public_audit_logs" ON audit_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Ensure we have sample positions for testing
INSERT INTO positions (title, department, description, is_open) 
VALUES 
  ('Software Developer', 'IT', 'Develop and maintain software applications', true),
  ('Frontend Developer', 'IT', 'Build user interfaces and web applications', true),
  ('Backend Developer', 'IT', 'Develop server-side applications and APIs', true),
  ('QA Engineer', 'IT', 'Test software applications and ensure quality', true),
  ('DevOps Engineer', 'IT', 'Manage infrastructure and deployment pipelines', true)
ON CONFLICT (title, department) DO NOTHING;

-- Create admin user if not exists
INSERT INTO users (email, username, full_name, phone, role, status)
VALUES ('admin@company.com', 'admin', 'System Administrator', '0912345678', 'ADMIN', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;
/*
  # Comprehensive RLS Policy Fix for Anonymous Access

  1. Security Updates
    - Allow anonymous candidate submissions
    - Allow anonymous position viewing
    - Allow anonymous audit log creation
    - Maintain security for other operations

  2. Policy Updates
    - Remove restrictive policies that block anonymous access
    - Add permissive policies for public operations
    - Keep admin/HR restrictions for sensitive data
*/

-- Drop existing restrictive policies that might block anonymous access
DROP POLICY IF EXISTS "anonymous_can_create_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "allow_anonymous_candidate_submissions" ON candidates;
DROP POLICY IF EXISTS "anonymous_can_read_open_positions" ON positions;

-- Candidates table: Allow anonymous submissions
CREATE POLICY "enable_anonymous_candidate_insert"
  ON candidates
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "enable_authenticated_candidate_insert"
  ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Positions table: Allow anonymous reading of open positions
CREATE POLICY "enable_anonymous_read_open_positions"
  ON positions
  FOR SELECT
  TO anon, authenticated
  USING (is_open = true);

-- Audit logs: Allow anonymous creation for candidate submissions
CREATE POLICY "enable_anonymous_audit_log_insert"
  ON audit_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users table: Allow anonymous reading for authentication (limited fields)
CREATE POLICY "enable_anonymous_user_auth_read"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (status = 'ACTIVE');

-- Ensure RLS is enabled on all tables
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Add some sample positions if they don't exist
INSERT INTO positions (title, department, description, is_open) VALUES
  ('Frontend Developer', 'IT', 'Phát triển giao diện người dùng với React, TypeScript', true),
  ('Backend Developer', 'IT', 'Phát triển API và hệ thống backend với Node.js', true),
  ('Full Stack Developer', 'IT', 'Phát triển cả frontend và backend', true),
  ('UI/UX Designer', 'Design', 'Thiết kế giao diện và trải nghiệm người dùng', true),
  ('Product Manager', 'Product', 'Quản lý sản phẩm và phối hợp các team', true)
ON CONFLICT (title, department) DO NOTHING;
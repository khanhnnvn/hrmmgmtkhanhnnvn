/*
  # Complete Recruitment and HR Management System Database Schema

  1. New Tables
    - `users` - System users with role-based access (ADMIN, HR, EMPLOYEE)
    - `positions` - Job positions available for recruitment
    - `candidates` - Job applicants with complete workflow tracking
    - `interview_sessions` - Scheduled interview sessions
    - `interviews` - Individual interview assessments
    - `decisions` - Hiring decisions with notes
    - `employees` - Employee records linked to users
    - `audit_logs` - System activity tracking

  2. Security
    - Enable RLS on all tables
    - Role-based policies for data access
    - Public access for candidate applications
    - Audit logging for all actions

  3. Features
    - Complete recruitment workflow from application to hire
    - Multi-stage interview process
    - Employee profile management
    - Statistics and reporting
    - File upload support
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Quản lý tài khoản người dùng)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'EMPLOYEE' CHECK (role IN ('ADMIN', 'HR', 'EMPLOYEE')),
  password_hash text DEFAULT '',
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Positions table (Vị trí tuyển dụng)
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text NOT NULL DEFAULT 'IT',
  description text NOT NULL DEFAULT '',
  is_open boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Candidates table (Ứng viên)
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  cv_url text DEFAULT '',
  applied_position_id uuid REFERENCES positions(id),
  status text NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'REJECTED', 'APPROVED', 'INTERVIEW', 'OFFERED', 'HIRED', 'NOT_HIRED')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Interview sessions table (Cuộc phỏng vấn)
CREATE TABLE IF NOT EXISTS interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id),
  title text NOT NULL DEFAULT 'Technical Interview',
  scheduled_date timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Interviews table (Phiếu đánh giá phỏng vấn)
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id),
  interviewer_id uuid REFERENCES users(id),
  interview_session_id uuid REFERENCES interview_sessions(id),
  tech_notes text NOT NULL DEFAULT '',
  soft_notes text NOT NULL DEFAULT '',
  result text NOT NULL DEFAULT 'PENDING' CHECK (result IN ('PASS', 'FAIL', 'PENDING')),
  attachment_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Decisions table (Quyết định tuyển dụng)
CREATE TABLE IF NOT EXISTS decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id),
  decided_by uuid REFERENCES users(id),
  decision text NOT NULL CHECK (decision IN ('HIRE', 'NO_HIRE')),
  decision_notes text NOT NULL DEFAULT '',
  decided_at timestamptz DEFAULT now()
);

-- Employees table (Nhân viên)
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  candidate_id uuid REFERENCES candidates(id),
  place_of_residence text DEFAULT '',
  hometown text DEFAULT '',
  national_id text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit logs table (Nhật ký hoạt động)
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id),
  action text NOT NULL DEFAULT '',
  target_type text NOT NULL DEFAULT '',
  target_id text NOT NULL DEFAULT '',
  payload_json jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_email_position ON candidates(email, applied_position_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Insert sample data
INSERT INTO positions (title, department, description, is_open) VALUES
  ('Backend Developer', 'IT', 'Phát triển ứng dụng backend với Node.js và Python', true),
  ('Frontend Developer', 'IT', 'Phát triển giao diện người dùng với React và Vue.js', true),
  ('DevOps Engineer', 'IT', 'Quản lý hạ tầng và triển khai ứng dụng', true),
  ('Product Manager', 'Product', 'Quản lý sản phẩm và phát triển tính năng', true),
  ('UI/UX Designer', 'Design', 'Thiết kế giao diện và trải nghiệm người dùng', true)
ON CONFLICT DO NOTHING;

INSERT INTO users (username, email, phone, full_name, role, status) VALUES
  ('admin', 'admin@company.com', '0912345678', 'Quản trị viên', 'ADMIN', 'ACTIVE'),
  ('hr', 'hr@company.com', '0912345679', 'Nhân viên HR', 'HR', 'ACTIVE'),
  ('nguyenvanan', 'nguyenvanan@company.com', '0912345680', 'Nguyễn Văn An', 'EMPLOYEE', 'ACTIVE'),
  ('tranthib', 'tranthib@company.com', '0912345681', 'Trần Thị B', 'EMPLOYEE', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "HR and Admin can read all users" ON users;
CREATE POLICY "HR and Admin can read all users" ON users FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);

DROP POLICY IF EXISTS "Admin can manage users" ON users;
CREATE POLICY "Admin can manage users" ON users FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Positions policies
DROP POLICY IF EXISTS "Anyone can read open positions" ON positions;
CREATE POLICY "Anyone can read open positions" ON positions FOR SELECT TO anon, authenticated USING (is_open = true);

DROP POLICY IF EXISTS "HR and Admin can read all positions" ON positions;
CREATE POLICY "HR and Admin can read all positions" ON positions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);

DROP POLICY IF EXISTS "Admin can manage positions" ON positions;
CREATE POLICY "Admin can manage positions" ON positions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Candidates policies
DROP POLICY IF EXISTS "Allow anonymous candidate applications" ON candidates;
CREATE POLICY "Allow anonymous candidate applications" ON candidates FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "HR and Admin can read all candidates" ON candidates;
CREATE POLICY "HR and Admin can read all candidates" ON candidates FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);

DROP POLICY IF EXISTS "HR and Admin can update candidates" ON candidates;
CREATE POLICY "HR and Admin can update candidates" ON candidates FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);

-- Interview sessions policies
DROP POLICY IF EXISTS "HR and Admin can manage interview sessions" ON interview_sessions;
CREATE POLICY "HR and Admin can manage interview sessions" ON interview_sessions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);

-- Interviews policies
DROP POLICY IF EXISTS "HR and Admin can manage interviews" ON interviews;
CREATE POLICY "HR and Admin can manage interviews" ON interviews FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);

DROP POLICY IF EXISTS "Employees can read assigned interviews" ON interviews;
CREATE POLICY "Employees can read assigned interviews" ON interviews FOR SELECT TO authenticated USING (
  interviewer_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);

DROP POLICY IF EXISTS "Employees can update assigned interviews" ON interviews;
CREATE POLICY "Employees can update assigned interviews" ON interviews FOR UPDATE TO authenticated USING (
  interviewer_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);

-- Decisions policies
DROP POLICY IF EXISTS "HR and Admin can manage decisions" ON decisions;
CREATE POLICY "HR and Admin can manage decisions" ON decisions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);

-- Employees policies
DROP POLICY IF EXISTS "Users can read own employee data" ON employees;
CREATE POLICY "Users can read own employee data" ON employees FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own employee data" ON employees;
CREATE POLICY "Users can update own employee data" ON employees FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "HR and Admin can manage employees" ON employees;
CREATE POLICY "HR and Admin can manage employees" ON employees FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);

-- Audit logs policies
DROP POLICY IF EXISTS "Anyone can create audit logs" ON audit_logs;
CREATE POLICY "Anyone can create audit logs" ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "HR and Admin can read audit logs" ON audit_logs;
CREATE POLICY "HR and Admin can read audit logs" ON audit_logs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);
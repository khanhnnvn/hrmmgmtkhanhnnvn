/*
  # Create default positions for testing

  1. New Tables
    - Ensures positions table has sample data for testing
  
  2. Sample Data
    - Creates 5 default positions across different departments
    - All positions are marked as open (is_open = true)
    
  3. Safety
    - Uses INSERT ... ON CONFLICT DO NOTHING to avoid duplicates
    - Safe to run multiple times
*/

-- Create default positions if they don't exist
INSERT INTO positions (title, department, description, is_open) VALUES
  ('Frontend Developer', 'IT', 'Phát triển giao diện người dùng với React, TypeScript và Tailwind CSS', true),
  ('Backend Developer', 'IT', 'Phát triển API và hệ thống backend với Node.js, PostgreSQL', true),
  ('Full Stack Developer', 'IT', 'Phát triển cả frontend và backend, làm việc với stack công nghệ hiện đại', true),
  ('HR Specialist', 'HR', 'Quản lý tuyển dụng, đào tạo và phát triển nhân sự', true),
  ('Marketing Executive', 'Marketing', 'Lập kế hoạch và thực hiện các chiến dịch marketing, quảng bá thương hiệu', true)
ON CONFLICT (title, department) DO NOTHING;

-- Verify positions were created
DO $$
DECLARE
    position_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO position_count FROM positions WHERE is_open = true;
    RAISE NOTICE 'Total open positions: %', position_count;
    
    IF position_count = 0 THEN
        RAISE WARNING 'No open positions found after insert!';
    ELSE
        RAISE NOTICE 'Successfully ensured % open positions exist', position_count;
    END IF;
END $$;
import { z } from 'zod';

// Candidate validation
export const candidateSchema = z.object({
  full_name: z.string()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên không được quá 100 ký tự')
    .regex(/^[a-zA-ZÀ-ỹ\s]+$/, 'Họ và tên chỉ được chứa chữ cái và khoảng trắng'),
  email: z.string().email('Email không hợp lệ').toLowerCase(),
  phone: z.string()
    .regex(/^[0-9+\-\s()]+$/, 'Số điện thoại chỉ được chứa số và ký tự đặc biệt')
    .min(9, 'Số điện thoại phải có ít nhất 9 số')
    .max(15, 'Số điện thoại không được quá 15 ký tự'),
  applied_position_id: z.string().min(1, 'Vui lòng chọn vị trí ứng tuyển'),
});

// Interview validation
export const interviewSchema = z.object({
  tech_notes: z.string().min(10, 'Nội dung phỏng vấn chuyên môn phải có ít nhất 10 ký tự'),
  soft_notes: z.string().min(10, 'Nội dung phỏng vấn kỹ năng phải có ít nhất 10 ký tự'),
  result: z.enum(['PASS', 'FAIL', 'PENDING']),
});

// Employee validation
export const employeeSchema = z.object({
  place_of_residence: z.string().min(5, 'Chỗ ở phải có ít nhất 5 ký tự'),
  hometown: z.string().min(5, 'Quê quán phải có ít nhất 5 ký tự'),
  national_id: z.string().regex(/^\d{12}$/, 'Căn cước công dân phải có đúng 12 số'),
});

// User validation
export const userSchema = z.object({
  username: z.string()
    .min(3, 'Username phải có ít nhất 3 ký tự')
    .max(50, 'Username không được quá 50 ký tự')
    .regex(/^[a-z0-9_]+$/, 'Username chỉ được chứa chữ thường, số và dấu gạch dưới'),
  email: z.string()
    .email('Email không hợp lệ')
    .max(100, 'Email không được quá 100 ký tự'),
  phone: z.string()
    .regex(/^[0-9+\-\s()]+$/, 'Số điện thoại chỉ được chứa số và ký tự đặc biệt')
    .min(9, 'Số điện thoại phải có ít nhất 9 số')
    .max(15, 'Số điện thoại không được quá 15 ký tự'),
  full_name: z.string()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên không được quá 100 ký tự')
    .regex(/^[a-zA-ZÀ-ỹ\s]+$/, 'Họ và tên chỉ được chứa chữ cái và khoảng trắng'),
  role: z.enum(['ADMIN', 'HR', 'EMPLOYEE']),
});

// Interview Session validation
export const interviewSessionSchema = z.object({
  title: z.string().min(5, 'Tiêu đề phải có ít nhất 5 ký tự'),
  candidate_id: z.string().min(1, 'Vui lòng chọn ứng viên'),
  scheduled_date: z.string().optional(),
});

// Decision validation
export const decisionSchema = z.object({
  candidate_id: z.string().min(1, 'Vui lòng chọn ứng viên'),
  decision: z.enum(['HIRE', 'NO_HIRE']),
  decision_notes: z.string().min(10, 'Ghi chú quyết định phải có ít nhất 10 ký tự'),
});

// Login validation
export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

// Vietnamese name processing
export const generateUsername = (fullName: string, existingUsernames: string[] = []): string => {
  if (!fullName || fullName.trim().length === 0) {
    return '';
  }
  
  // Convert Vietnamese to English, handle duplicates
  let username = fullName
    .trim()
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 50); // Limit length
  
  // Ensure username is not empty
  if (username.length === 0) {
    username = 'user';
  }
  
  // Handle duplicates with number suffix
  let finalUsername = username;
  let counter = 1;
  while (existingUsernames.includes(finalUsername)) {
    finalUsername = `${username}${counter}`;
    counter++;
    // Prevent infinite loop
    if (counter > 1000) {
      finalUsername = `${username}${Date.now()}`;
      break;
    }
  }
  return finalUsername;
};

// Generate strong password
export const generatePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Ensure at least one uppercase, one lowercase, and one number
  password = 'A' + password.substring(1, 10) + 'a1';
  return password;
};

export type CandidateFormData = z.infer<typeof candidateSchema>;
export type InterviewFormData = z.infer<typeof interviewSchema>;
export type EmployeeFormData = z.infer<typeof employeeSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type InterviewSessionFormData = z.infer<typeof interviewSessionSchema>;
export type DecisionFormData = z.infer<typeof decisionSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
import { supabase } from './supabase';
import toast from 'react-hot-toast';
import type { 
  User, 
  Candidate, 
  Position, 
  Interview, 
  InterviewSession, 
  Decision, 
  Employee,
  StatisticsData,
  CandidateWithDetails,
  InterviewSessionWithDetails,
  UserWithEmployee
} from '../types/database';

export class DatabaseService {
  // Helper method to handle database errors
  private static handleDatabaseError(error: any, operation: string): never {
    console.error(`Database error in ${operation}:`, error);
    
    let errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại.';
    
    if (error?.code === '42501' || error?.message?.includes('row-level security')) {
      errorMessage = 'Không có quyền truy cập. Vui lòng thử lại.';
    } else if (error?.code === '23505') {
      errorMessage = 'Dữ liệu đã tồn tại trong hệ thống';
    } else if (error?.code === '23503') {
      errorMessage = 'Dữ liệu tham chiếu không tồn tại';
    } else if (error?.code === 'PGRST116') {
      errorMessage = 'Không tìm thấy dữ liệu';
    }
    
    throw new Error(errorMessage);
  }

  // User management
  static async createUser(userData: Partial<User>): Promise<User> {
    try {
      console.log('Creating user with data:', userData);
      
      // First, create the user in Supabase Auth if password is provided
      let authUserId = userData.id;
      
      if (userData.password_hash && userData.email) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password_hash,
        });

        if (authError) {
          console.error('Auth signup error:', authError);
          throw new Error(`Lỗi tạo tài khoản xác thực: ${authError.message}`);
        }

        if (authData.user) {
          authUserId = authData.user.id;
          console.log('Auth user created with ID:', authUserId);
        }
      }

      // Prepare user data for database insertion
      const dbUserData = {
        ...userData,
        id: authUserId,
        password_hash: undefined // Don't store password hash in database
      };

      const { data, error } = await supabase
        .from('users')
        .insert(dbUserData)
        .select()
        .single();

      if (error) {
        this.handleDatabaseError(error, 'tạo người dùng');
      }
      
      console.log('User created successfully:', data);
      return data;
    } catch (error) {
      this.handleDatabaseError(error, 'tạo người dùng');
    }
  }

  // Create admin user with Supabase Auth
  static async createAdminUser(): Promise<User> {
    try {
      console.log('Creating admin user...');
      
      const adminData = {
        email: 'admin@company.com',
        password: 'admin123',
        full_name: 'Quản trị viên hệ thống',
        username: 'admin',
        phone: '0912345678',
        role: 'ADMIN' as const,
        status: 'ACTIVE' as const
      };

      // Create user in Supabase Auth with email confirmation disabled
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminData.email,
        password: adminData.password,
        options: {
          emailRedirectTo: undefined,
          data: {
            full_name: adminData.full_name,
            role: adminData.role
          }
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        
        // If user already exists in auth, that's okay
        if (authError.message.includes('User already registered')) {
          console.log('Admin user already exists in Supabase Auth');
          
          // Try to get the existing user
          const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
          if (listError) {
            console.error('Error listing users:', listError);
            throw new Error(`Lỗi kiểm tra tài khoản admin: ${listError.message}`);
          }
          
          const existingUser = existingUsers.users.find(u => u.email === adminData.email);
          if (existingUser) {
            console.log('Found existing admin user in auth:', existingUser.id);
            authData.user = existingUser;
          } else {
            throw new Error('Không thể tìm thấy tài khoản admin đã tồn tại');
          }
        } else {
          throw new Error(`Lỗi tạo tài khoản admin: ${authError.message}`);
        }
      }

      if (!authData.user) {
        throw new Error('Không thể tạo tài khoản admin');
      }

      console.log('Admin auth user created with ID:', authData.user.id);

      // Check if user already exists in database
      const { data: existingDbUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing user:', checkError);
      }

      if (existingDbUser) {
        console.log('Admin user already exists in database:', existingDbUser.full_name);
        return existingDbUser;
      }

      // Create user record in database if it doesn't exist
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: adminData.email,
          full_name: adminData.full_name,
          username: adminData.username,
          phone: adminData.phone,
          role: adminData.role,
          status: adminData.status
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        
        // If user already exists in database, that's okay
        if (dbError.code === '23505') {
          console.log('Admin user already exists in database, fetching...');
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('email', adminData.email)
            .single();
            
          if (fetchError) {
            this.handleDatabaseError(fetchError, 'tải tài khoản admin');
          }
          
          return existingUser;
        } else {
          this.handleDatabaseError(dbError, 'tạo bản ghi admin');
        }
      }

      console.log('Admin user created successfully:', dbUser);
      return dbUser;
    } catch (error) {
      this.handleDatabaseError(error, 'tạo tài khoản admin');
    }
  }

  // Check if admin user exists
  static async checkAdminExists(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'admin@company.com')
        .eq('role', 'ADMIN')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking admin:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in checkAdminExists:', error);
      return false;
    }
  }

  static async getUsers(): Promise<UserWithEmployee[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          employee:employees(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        this.handleDatabaseError(error, 'tải danh sách người dùng');
      }
      
      return data || [];
    } catch (error) {
      this.handleDatabaseError(error, 'tải danh sách người dùng');
    }
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.handleDatabaseError(error, 'cập nhật người dùng');
      }
      
      return data;
    } catch (error) {
      this.handleDatabaseError(error, 'cập nhật người dùng');
    }
  }

  static async deleteUser(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        this.handleDatabaseError(error, 'xóa người dùng');
      }
    } catch (error) {
      this.handleDatabaseError(error, 'xóa người dùng');
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('status', 'ACTIVE')
        .single();

      if (error && error.code !== 'PGRST116') {
        return null; // Return null instead of throwing error for user lookup
      }
      
      return data;
    } catch (error) {
      return null; // Always return null for user lookup errors
    }
  }

  // Candidate management
  static async createCandidate(candidateData: Partial<Candidate>): Promise<Candidate> {
    try {
      if (!candidateData.applied_position_id) {
        throw new Error('Vui lòng chọn vị trí ứng tuyển');
      }


      const { data, error } = await supabase
        .from('candidates')
        .insert(candidateData)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Bạn đã nộp hồ sơ cho vị trí này rồi!');
        }
        if (error.code === '42501') {
          throw new Error('Lỗi hệ thống. Vui lòng thử lại sau ít phút.');
        }
        this.handleDatabaseError(error, 'nộp hồ sơ');
      }
      
      // Create audit log
      try {
        await this.createAuditLog({
          action: 'CANDIDATE_CREATED',
          target_type: 'CANDIDATE',
          target_id: data.id,
          payload_json: { candidate_name: data.full_name, position_id: data.applied_position_id }
        });
      } catch (auditError) {
        // Don't fail the candidate creation if audit log fails
      }
      
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại.');
    }
  }

  static async getCandidates(): Promise<CandidateWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          *,
          position:positions(*),
          interviews(*,
            interviewer:users(*)
          ),
          decisions(*,
            decider:users(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        this.handleDatabaseError(error, 'tải danh sách ứng viên');
      }
      
      return data || [];
    } catch (error) {
      this.handleDatabaseError(error, 'tải danh sách ứng viên');
    }
  }

  static async getCandidateById(id: string): Promise<CandidateWithDetails> {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          *,
          position:positions(*),
          interviews(*,
            interviewer:users(*)
          ),
          decisions(*,
            decider:users(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        this.handleDatabaseError(error, 'tải thông tin ứng viên');
      }
      
      return data;
    } catch (error) {
      this.handleDatabaseError(error, 'tải thông tin ứng viên');
    }
  }

  static async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate> {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.handleDatabaseError(error, 'cập nhật ứng viên');
      }
      
      return data;
    } catch (error) {
      this.handleDatabaseError(error, 'cập nhật ứng viên');
    }
  }

  // Interview management
  static async createInterviewSession(sessionData: Partial<InterviewSession>): Promise<InterviewSession> {
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        this.handleDatabaseError(error, 'tạo cuộc phỏng vấn');
      }
      
      return data;
    } catch (error) {
      this.handleDatabaseError(error, 'tạo cuộc phỏng vấn');
    }
  }

  static async getInterviewSessionsWithDetails(): Promise<InterviewSessionWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select(`
          *,
          candidate:candidates(*,
            position:positions(*)
          ),
          creator:users(*),
          interviews(*,
            interviewer:users(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        this.handleDatabaseError(error, 'tải danh sách phỏng vấn');
      }
      
      return data || [];
    } catch (error) {
      this.handleDatabaseError(error, 'tải danh sách phỏng vấn');
    }
  }

  static async createInterview(interviewData: Partial<Interview>): Promise<Interview> {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .insert(interviewData)
        .select()
        .single();

      if (error) {
        this.handleDatabaseError(error, 'tạo phiếu phỏng vấn');
      }
      
      return data;
    } catch (error) {
      this.handleDatabaseError(error, 'tạo phiếu phỏng vấn');
    }
  }

  static async updateInterview(id: string, updates: Partial<Interview>): Promise<Interview> {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.handleDatabaseError(error, 'cập nhật phiếu phỏng vấn');
      }
      
      return data;
    } catch (error) {
      this.handleDatabaseError(error, 'cập nhật phiếu phỏng vấn');
    }
  }

  static async getMyInterviews(userId: string): Promise<Interview[]> {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          *,
          candidate:candidates(*,
            position:positions(*)
          ),
          interviewer:users(*),
          interview_session:interview_sessions(*)
        `)
        .eq('interviewer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        this.handleDatabaseError(error, 'tải phiếu phỏng vấn của tôi');
      }
      
      return data || [];
    } catch (error) {
      this.handleDatabaseError(error, 'tải phiếu phỏng vấn của tôi');
    }
  }

  // Employee management
  static async createEmployee(employeeData: Partial<Employee>): Promise<Employee> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert(employeeData)
        .select()
        .single();

      if (error) {
        this.handleDatabaseError(error, 'tạo hồ sơ nhân viên');
      }
      
      return data;
    } catch (error) {
      this.handleDatabaseError(error, 'tạo hồ sơ nhân viên');
    }
  }

  static async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.handleDatabaseError(error, 'cập nhật hồ sơ nhân viên');
      }
      
      return data;
    } catch (error) {
      this.handleDatabaseError(error, 'cập nhật hồ sơ nhân viên');
    }
  }

  static async getEmployeeByUserId(userId: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        this.handleDatabaseError(error, 'tải hồ sơ nhân viên');
      }
      
      return data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Không tìm thấy dữ liệu')) {
        return null;
      }
      this.handleDatabaseError(error, 'tải hồ sơ nhân viên');
    }
  }

  static async getEmployees(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          user:users(*),
          candidate:candidates(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        this.handleDatabaseError(error, 'tải danh sách nhân viên');
      }
      
      return data || [];
    } catch (error) {
      this.handleDatabaseError(error, 'tải danh sách nhân viên');
    }
  }

  // Statistics
  static async getStatistics(): Promise<StatisticsData> {
    try {
      const [candidatesResponse, interviewsResponse] = await Promise.all([
        supabase.from('candidates').select('status'),
        supabase.from('interviews').select('result')
      ]);

      if (candidatesResponse.error) {
        this.handleDatabaseError(candidatesResponse.error, 'tải thống kê ứng viên');
      }

      if (interviewsResponse.error) {
        this.handleDatabaseError(interviewsResponse.error, 'tải thống kê phỏng vấn');
      }

      const candidates = candidatesResponse.data || [];
      const interviews = interviewsResponse.data || [];

      const totalCandidates = candidates.length;
      const submittedCandidates = candidates.filter(c => c.status === 'SUBMITTED').length;
      const interviewCandidates = candidates.filter(c => c.status === 'INTERVIEW').length;
      const hiredCandidates = candidates.filter(c => c.status === 'HIRED').length;

      const totalInterviews = interviews.length;
      const passedInterviews = interviews.filter(i => i.result === 'PASS').length;

      // Get new employees (created this month)
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const { data: newEmployeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id')
        .gte('created_at', thisMonth.toISOString());

      if (employeesError) {
        console.warn('Error loading new employees count:', employeesError);
      }

      const newEmployees = newEmployeesData?.length || 0;

      // Status distribution
      const statusCounts = candidates.reduce((acc, candidate) => {
        acc[candidate.status] = (acc[candidate.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: totalCandidates > 0 ? Math.round((count / totalCandidates) * 100) : 0
      }));

      // Interview results
      const resultCounts = interviews.reduce((acc, interview) => {
        acc[interview.result] = (acc[interview.result] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const interviewResults = Object.entries(resultCounts).map(([result, count]) => ({
        result,
        count,
        percentage: totalInterviews > 0 ? Math.round((count / totalInterviews) * 100) : 0
      }));

      return {
        totalCandidates,
        submittedCandidates,
        interviewCandidates,
        hiredCandidates,
        totalInterviews,
        passedInterviews,
        newEmployees,
        statusDistribution,
        interviewResults
      };
    } catch (error) {
      this.handleDatabaseError(error, 'tải thống kê');
    }
  }

  // Position management
  static async getOpenPositions(): Promise<Position[]> {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('is_open', true)
        .order('title');

      if (error) {
        this.handleDatabaseError(error, 'tải danh sách vị trí');
      }
      
      return data || [];
    } catch (error) {
      this.handleDatabaseError(error, 'tải danh sách vị trí');
    }
  }

  static async getAllPositions(): Promise<Position[]> {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .order('title');

      if (error) {
        this.handleDatabaseError(error, 'tải tất cả vị trí');
      }
      
      return data || [];
    } catch (error) {
      this.handleDatabaseError(error, 'tải tất cả vị trí');
    }
  }

  // Decision management
  static async createDecision(decisionData: Partial<Decision>): Promise<Decision> {
    try {
      const { data, error } = await supabase
        .from('decisions')
        .insert(decisionData)
        .select()
        .single();

      if (error) {
        this.handleDatabaseError(error, 'tạo quyết định');
      }
      
      return data;
    } catch (error) {
      this.handleDatabaseError(error, 'tạo quyết định');
    }
  }

  // Audit logging
  static async createAuditLog(logData: {
    actor_id?: string;
    action: string;
    target_type: string;
    target_id: string;
    payload_json?: Record<string, any>;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert(logData);
        
      if (error) {
        console.warn('Audit log creation failed (non-critical):', error.message);
        // Don't throw error for audit logs, just log the warning
      }
    } catch (error) {
      console.warn('Audit log exception (non-critical):', error);
      // Don't throw error for audit logs
    }
  }
}
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
    
    let errorMessage = `Lỗi ${operation}`;
    
    if (error?.code === '42501' || error?.message?.includes('row-level security')) {
      errorMessage = 'Lỗi phân quyền: Vui lòng đăng nhập lại với tài khoản có quyền truy cập';
    } else if (error?.code === '23505') {
      errorMessage = 'Dữ liệu đã tồn tại trong hệ thống';
    } else if (error?.code === '23503') {
      errorMessage = 'Dữ liệu tham chiếu không tồn tại';
    } else if (error?.code === 'PGRST116') {
      errorMessage = 'Không tìm thấy dữ liệu';
    } else if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
      errorMessage = 'Lỗi kết nối mạng: Vui lòng kiểm tra internet và thử lại';
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }

  // User management
  static async createUser(userData: Partial<User>): Promise<User> {
    try {
      console.log('Creating user with data:', userData);
      
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
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
        this.handleDatabaseError(error, 'tìm người dùng');
      }
      
      return data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Không tìm thấy dữ liệu')) {
        return null;
      }
      this.handleDatabaseError(error, 'tìm người dùng');
    }
  }

  // Candidate management
  static async createCandidate(candidateData: Partial<Candidate>): Promise<Candidate> {
    try {
      if (!candidateData.applied_position_id) {
        throw new Error('Vui lòng chọn vị trí ứng tuyển');
      }

      console.log('Creating candidate with data:', candidateData);

      const { data, error } = await supabase
        .from('candidates')
        .insert(candidateData)
        .select()
        .single();

      if (error) {
        this.handleDatabaseError(error, 'nộp hồ sơ');
      }
      
      console.log('Candidate created successfully:', data);
      
      // Create audit log
      try {
        await this.createAuditLog({
          action: 'CANDIDATE_CREATED',
          target_type: 'CANDIDATE',
          target_id: data.id,
          payload_json: { candidate_name: data.full_name, position_id: data.applied_position_id }
        });
      } catch (auditError) {
        console.warn('Failed to create audit log:', auditError);
      }
      
      return data;
    } catch (error) {
      this.handleDatabaseError(error, 'nộp hồ sơ');
    }
  }

  static async getCandidates(): Promise<CandidateWithDetails[]> {
    try {
      console.log('Loading candidates...');
      
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
      
      console.log('Candidates loaded successfully:', data?.length || 0, 'candidates');
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
      console.log('Fetching open positions...');
      
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('is_open', true)
        .order('title');

      if (error) {
        this.handleDatabaseError(error, 'tải danh sách vị trí');
      }
      
      console.log('Positions fetched successfully:', data?.length || 0, 'positions');
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
      console.log('Creating audit log:', logData);
      
      const { error } = await supabase
        .from('audit_logs')
        .insert(logData);
        
      if (error) {
        console.error('Error creating audit log:', error);
      } else {
        console.log('Audit log created successfully');
      }
    } catch (error) {
      console.error('Error in createAuditLog:', error);
    }
  }
}
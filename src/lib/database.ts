import { supabase } from './supabase';
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
  // User management
  static async createUser(userData: Partial<User>): Promise<User> {
    console.log('Creating user with data:', userData);
    
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }
    
    console.log('User created successfully:', data);
    return data;
  }

  static async getUsers(): Promise<UserWithEmployee[]> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        employee:employees(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Candidate management
  static async createCandidate(candidateData: Partial<Candidate>): Promise<Candidate> {
    try {
      // Ensure applied_position_id is provided
      if (!candidateData.applied_position_id) {
        console.error('Missing applied_position_id in candidate data:', candidateData);
        throw new Error('Vui lòng chọn vị trí ứng tuyển');
      }

      // Log the attempt for debugging
      console.log('Creating candidate with data:', candidateData);
      console.log('Supabase client auth status:', await supabase.auth.getSession());

      const { data, error } = await supabase
        .from('candidates')
        .insert(candidateData)
        .select()
        .single();

      if (error) {
        console.error('Database error creating candidate:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        
        // Provide more specific error messages
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          console.error('RLS policy violation detected');
          throw new Error('Lỗi bảo mật: Không thể nộp hồ sơ. Vui lòng liên hệ quản trị viên.');
        } else if (error.code === '23505') {
          if (error.message?.includes('candidates_email_position_unique')) {
            throw new Error('Bạn đã nộp hồ sơ cho vị trí này rồi!');
          } else {
            throw new Error('Thông tin này đã tồn tại trong hệ thống');
          }
        } else if (error.code === '23503') {
          throw new Error('Vị trí ứng tuyển không tồn tại. Vui lòng chọn lại.');
        } else {
          throw new Error(`Có lỗi xảy ra: ${error.message || 'Vui lòng thử lại sau'}`);
        }
      }
      
      console.log('Candidate created successfully:', data);
      
      // Create audit log for candidate creation
      try {
        await this.createAuditLog({
          action: 'CANDIDATE_CREATED',
          target_type: 'CANDIDATE',
          target_id: data.id,
          payload_json: { candidate_name: data.full_name, position_id: data.applied_position_id }
        });
      } catch (auditError) {
        console.warn('Failed to create audit log for candidate creation:', auditError);
        // Don't fail the main operation if audit logging fails
      }
      
      return data;
    } catch (error) {
      console.error('Error in createCandidate:', error);
      throw error;
    }
  }

  static async getCandidates(): Promise<CandidateWithDetails[]> {
    console.log('Loading candidates for admin/HR...');
    console.log('Current user session:', await supabase.auth.getSession());
    
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
      console.error('Error loading candidates:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      
      if (error.code === '42501') {
        throw new Error('Lỗi phân quyền: Không thể tải danh sách ứng viên. Vui lòng đăng nhập lại.');
      }
      throw error;
    }
    
    console.log('Candidates loaded successfully:', data?.length || 0, 'candidates');
    return data || [];
  }

  static async getCandidateById(id: string): Promise<CandidateWithDetails> {
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

    if (error) throw error;
    return data;
  }

  static async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate> {
    const { data, error } = await supabase
      .from('candidates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Interview management
  static async createInterviewSession(sessionData: Partial<InterviewSession>): Promise<InterviewSession> {
    const { data, error } = await supabase
      .from('interview_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getInterviewSessionsWithDetails(): Promise<InterviewSessionWithDetails[]> {
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

    if (error) throw error;
    return data || [];
  }

  static async createInterview(interviewData: Partial<Interview>): Promise<Interview> {
    const { data, error } = await supabase
      .from('interviews')
      .insert(interviewData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateInterview(id: string, updates: Partial<Interview>): Promise<Interview> {
    const { data, error } = await supabase
      .from('interviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getMyInterviews(userId: string): Promise<Interview[]> {
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

    if (error) throw error;
    return data || [];
  }

  // Employee management
  static async createEmployee(employeeData: Partial<Employee>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert(employeeData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getEmployeeByUserId(userId: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        user:users(*),
        candidate:candidates(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Statistics
  static async getStatistics(): Promise<StatisticsData> {
    const [candidatesResponse, interviewsResponse] = await Promise.all([
      supabase.from('candidates').select('status'),
      supabase.from('interviews').select('result')
    ]);

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
    const { data: newEmployeesData } = await supabase
      .from('employees')
      .select('id')
      .gte('created_at', thisMonth.toISOString());

    const newEmployees = newEmployeesData?.length || 0;

    // Status distribution
    const statusCounts = candidates.reduce((acc, candidate) => {
      acc[candidate.status] = (acc[candidate.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / totalCandidates) * 100)
    }));

    // Interview results
    const resultCounts = interviews.reduce((acc, interview) => {
      acc[interview.result] = (acc[interview.result] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const interviewResults = Object.entries(resultCounts).map(([result, count]) => ({
      result,
      count,
      percentage: Math.round((count / totalInterviews) * 100)
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
  }

  // Position management
  static async getOpenPositions(): Promise<Position[]> {
    try {
      console.log('Fetching open positions...');
      console.log('Supabase client status:', supabase.supabaseUrl);
      
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('is_open', true)
        .order('title');

      if (error) {
        console.error('Error fetching positions:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          throw new Error('Lỗi bảo mật: Không thể tải danh sách vị trí. Vui lòng thử lại.');
        } else {
          throw new Error(`Không thể tải danh sách vị trí: ${error.message}`);
        }
      }
      
      console.log('Positions fetched successfully:', data?.length || 0, 'positions');
      return data || [];
    } catch (error) {
      console.error('Error in getOpenPositions:', error);
      throw error;
    }
  }

  static async getAllPositions(): Promise<Position[]> {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .order('title');

    if (error) throw error;
    return data || [];
  }

  // Decision management
  static async createDecision(decisionData: Partial<Decision>): Promise<Decision> {
    const { data, error } = await supabase
      .from('decisions')
      .insert(decisionData)
      .select()
      .single();

    if (error) throw error;
    return data;
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
        // Don't throw error for audit logs to avoid breaking main operations
      } else {
        console.log('Audit log created successfully');
      }
    } catch (error) {
      console.error('Error in createAuditLog:', error);
      // Don't throw error for audit logs
    }
  }
}
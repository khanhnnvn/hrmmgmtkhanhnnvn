import { supabase } from './supabase';
import { isUsingMockClient } from './supabase';
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

// Mock data for development when Supabase is not configured
const mockUsers: UserWithEmployee[] = [
  {
    id: 'demo-admin',
    username: 'admin',
    email: 'admin@company.com',
    phone: '0912345678',
    full_name: 'Quản trị viên',
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'demo-hr',
    username: 'hr',
    email: 'hr@company.com',
    phone: '0912345679',
    full_name: 'Nhân viên HR',
    role: 'HR',
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockPositions: Position[] = [
  {
    id: 'pos-1',
    title: 'Backend Developer',
    department: 'IT',
    description: 'Phát triển ứng dụng backend với Node.js và Python',
    is_open: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'pos-2',
    title: 'Frontend Developer',
    department: 'IT',
    description: 'Phát triển giao diện người dùng với React và Vue.js',
    is_open: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let mockCandidates: CandidateWithDetails[] = [];
let mockInterviews: Interview[] = [];
let mockEmployees: Employee[] = [];

export class DatabaseService {
  // Helper method to check if we should use mock data
  private static shouldUseMockData(): boolean {
    return isUsingMockClient || !supabase;
  }

  // Helper method to handle database errors
  private static handleDatabaseError(error: any, operation: string): never {
    console.error(`Database error in ${operation}:`, error);
    
    let errorMessage = `Lỗi ${operation}`;
    
    if (error?.code === '42501' || error?.message?.includes('row-level security')) {
      errorMessage = 'Lỗi phân quyền: Vui lòng đăng nhập lại';
    } else if (error?.code === '23505') {
      errorMessage = 'Dữ liệu đã tồn tại trong hệ thống';
    } else if (error?.code === '23503') {
      errorMessage = 'Dữ liệu tham chiếu không tồn tại';
    } else if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.message?.includes('Failed to fetch')) {
      // Don't throw error for fetch failures, let the calling method handle fallback
      console.warn('Network error detected, caller should handle fallback to mock mode');
      throw new Error('NETWORK_ERROR');
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }

  // User management
  static async createUser(userData: Partial<User>): Promise<User> {
    if (this.shouldUseMockData()) {
      const newUser = {
        id: `user-${Date.now()}`,
        username: userData.username || '',
        email: userData.email || '',
        phone: userData.phone || '',
        full_name: userData.full_name || '',
        role: userData.role || 'EMPLOYEE',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as User;
      mockUsers.push(newUser);
      toast.success('Tạo người dùng thành công (Demo mode)');
      return newUser;
    }

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
      // If database fails, switch to mock mode
      console.warn('Database operation failed, using mock mode');
      return this.createUser(userData);
    }
  }

  static async getUsers(): Promise<UserWithEmployee[]> {
    if (this.shouldUseMockData()) {
      return mockUsers;
    }

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
      console.warn('Database operation failed, using mock mode');
      return mockUsers;
    }
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User> {
    if (this.shouldUseMockData()) {
      const userIndex = mockUsers.findIndex(u => u.id === id);
      if (userIndex >= 0) {
        mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates, updated_at: new Date().toISOString() };
        toast.success('Cập nhật người dùng thành công (Demo mode)');
        return mockUsers[userIndex];
      }
      throw new Error('User not found');
    }

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
      console.warn('Database operation failed, using mock mode');
      return this.updateUser(id, updates);
    }
  }

  static async deleteUser(id: string): Promise<void> {
    if (this.shouldUseMockData()) {
      const userIndex = mockUsers.findIndex(u => u.id === id);
      if (userIndex >= 0) {
        mockUsers.splice(userIndex, 1);
        toast.success('Xóa người dùng thành công (Demo mode)');
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        this.handleDatabaseError(error, 'xóa người dùng');
      }
    } catch (error) {
      console.warn('Database operation failed, using mock mode');
      return this.deleteUser(id);
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    if (this.shouldUseMockData()) {
      return mockUsers.find(u => u.email === email) || null;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        this.handleDatabaseError(error, 'tìm người dùng');
      }
      
      return data;
    } catch (error) {
      if (error instanceof Error && error.message === 'NETWORK_ERROR') {
        console.warn('Network error in getUserByEmail, falling back to mock data');
        return mockUsers.find(u => u.email === email) || null;
      }
      // Re-throw other errors
      throw error;
    }
  }

  // Candidate management
  static async createCandidate(candidateData: Partial<Candidate>): Promise<Candidate> {
    if (this.shouldUseMockData()) {
      const newCandidate = {
        id: `candidate-${Date.now()}`,
        full_name: candidateData.full_name || '',
        email: candidateData.email || '',
        phone: candidateData.phone || '',
        cv_url: candidateData.cv_url || '',
        applied_position_id: candidateData.applied_position_id || '',
        status: 'SUBMITTED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Candidate;
      
      const candidateWithDetails = {
        ...newCandidate,
        position: mockPositions.find(p => p.id === newCandidate.applied_position_id),
        interviews: [],
        decisions: []
      } as CandidateWithDetails;
      
      mockCandidates.push(candidateWithDetails);
      toast.success('Nộp hồ sơ thành công (Demo mode)');
      return newCandidate;
    }

    try {
      // Ensure applied_position_id is provided
      if (!candidateData.applied_position_id) {
        console.error('Missing applied_position_id in candidate data:', candidateData);
        throw new Error('Vui lòng chọn vị trí ứng tuyển');
      }

      // Log the attempt for debugging
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
      // If database fails, try mock mode
      console.warn('Database operation failed, using mock mode');
      return this.createCandidate(candidateData);
    }
  }

  static async getCandidates(): Promise<CandidateWithDetails[]> {
    if (this.shouldUseMockData()) {
      return mockCandidates;
    }

    try {
      console.log('Loading candidates for admin/HR...');
      
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
      console.warn('Database operation failed, using mock mode');
      return mockCandidates;
    }
  }

  static async getCandidateById(id: string): Promise<CandidateWithDetails> {
    if (this.shouldUseMockData()) {
      const candidate = mockCandidates.find(c => c.id === id);
      if (!candidate) throw new Error('Candidate not found');
      return candidate;
    }

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
      console.warn('Database operation failed, using mock mode');
      const candidate = mockCandidates.find(c => c.id === id);
      if (!candidate) throw new Error('Candidate not found');
      return candidate;
    }
  }

  static async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate> {
    if (this.shouldUseMockData()) {
      const candidateIndex = mockCandidates.findIndex(c => c.id === id);
      if (candidateIndex >= 0) {
        mockCandidates[candidateIndex] = { 
          ...mockCandidates[candidateIndex], 
          ...updates, 
          updated_at: new Date().toISOString() 
        };
        toast.success('Cập nhật ứng viên thành công (Demo mode)');
        return mockCandidates[candidateIndex];
      }
      throw new Error('Candidate not found');
    }

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
      console.warn('Database operation failed, using mock mode');
      return this.updateCandidate(id, updates);
    }
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
    if (this.shouldUseMockData()) {
      const totalCandidates = mockCandidates.length;
      const submittedCandidates = mockCandidates.filter(c => c.status === 'SUBMITTED').length;
      const interviewCandidates = mockCandidates.filter(c => c.status === 'INTERVIEW').length;
      const hiredCandidates = mockCandidates.filter(c => c.status === 'HIRED').length;
      const totalInterviews = mockInterviews.length;
      const passedInterviews = mockInterviews.filter(i => i.result === 'PASS').length;
      const newEmployees = mockEmployees.length;

      return {
        totalCandidates,
        submittedCandidates,
        interviewCandidates,
        hiredCandidates,
        totalInterviews,
        passedInterviews,
        newEmployees,
        statusDistribution: [
          { status: 'SUBMITTED', count: submittedCandidates, percentage: Math.round((submittedCandidates / totalCandidates) * 100) || 0 }
        ],
        interviewResults: [
          { result: 'PENDING', count: totalInterviews - passedInterviews, percentage: Math.round(((totalInterviews - passedInterviews) / totalInterviews) * 100) || 0 }
        ]
      };
    }

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
    if (this.shouldUseMockData()) {
      return mockPositions.filter(p => p.is_open);
    }

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
      console.warn('Database operation failed, using mock mode');
      return mockPositions.filter(p => p.is_open);
    }
  }

  static async getAllPositions(): Promise<Position[]> {
    if (this.shouldUseMockData()) {
      return mockPositions;
    }

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
      console.warn('Database operation failed, using mock mode');
      return mockPositions;
    }
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
    if (this.shouldUseMockData()) {
      console.log('Mock audit log:', logData);
      return;
    }

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
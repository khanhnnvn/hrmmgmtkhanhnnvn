export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Partial<User>;
        Update: Partial<User>;
      };
      positions: {
        Row: Position;
        Insert: Partial<Position>;
        Update: Partial<Position>;
      };
      candidates: {
        Row: Candidate;
        Insert: Partial<Candidate>;
        Update: Partial<Candidate>;
      };
      interview_sessions: {
        Row: InterviewSession;
        Insert: Partial<InterviewSession>;
        Update: Partial<InterviewSession>;
      };
      interviews: {
        Row: Interview;
        Insert: Partial<Interview>;
        Update: Partial<Interview>;
      };
      decisions: {
        Row: Decision;
        Insert: Partial<Decision>;
        Update: Partial<Decision>;
      };
      employees: {
        Row: Employee;
        Insert: Partial<Employee>;
        Update: Partial<Employee>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog>;
        Update: Partial<AuditLog>;
      };
    };
  };
}

export type UserRole = 'ADMIN' | 'HR' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'DISABLED';
export type CandidateStatus = 'SUBMITTED' | 'REJECTED' | 'APPROVED' | 'INTERVIEW' | 'OFFERED' | 'HIRED' | 'NOT_HIRED';
export type InterviewResult = 'PASS' | 'FAIL' | 'PENDING';
export type InterviewSessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type DecisionType = 'HIRE' | 'NO_HIRE';

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  full_name: string;
  role: UserRole;
  password_hash?: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  title: string;
  department: string;
  description: string;
  is_open: boolean;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  cv_url?: string;
  applied_position_id: string;
  status: CandidateStatus;
  created_at: string;
  updated_at: string;
  position?: Position;
  interviews?: Interview[];
  decisions?: Decision[];
}

export interface InterviewSession {
  id: string;
  candidate_id: string;
  title: string;
  scheduled_date?: string;
  status: InterviewSessionStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  candidate?: Candidate;
  interviews?: Interview[];
  creator?: User;
}

export interface Interview {
  id: string;
  candidate_id: string;
  interviewer_id: string;
  interview_session_id?: string;
  tech_notes: string;
  soft_notes: string;
  result: InterviewResult;
  attachment_url?: string;
  created_at: string;
  updated_at: string;
  candidate?: Candidate;
  interviewer?: User;
  interview_session?: InterviewSession;
}

export interface Decision {
  id: string;
  candidate_id: string;
  decided_by: string;
  decision: DecisionType;
  decision_notes: string;
  decided_at: string;
  candidate?: Candidate;
  decider?: User;
}

export interface Employee {
  id: string;
  user_id?: string;
  candidate_id?: string;
  place_of_residence: string;
  hometown: string;
  national_id: string;
  created_at: string;
  updated_at: string;
  user?: User;
  candidate?: Candidate;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  target_type: string;
  target_id: string;
  payload_json: Record<string, any>;
  created_at: string;
  actor?: User;
}

export interface StatisticsData {
  totalCandidates: number;
  submittedCandidates: number;
  interviewCandidates: number;
  hiredCandidates: number;
  totalInterviews: number;
  passedInterviews: number;
  newEmployees: number;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  interviewResults: Array<{
    result: string;
    count: number;
    percentage: number;
  }>;
}

export interface CandidateWithDetails extends Candidate {
  position: Position;
  interviews: Interview[];
  decisions: Decision[];
}

export interface InterviewSessionWithDetails extends InterviewSession {
  candidate: Candidate;
  interviews: Interview[];
  creator: User;
}

export interface UserWithEmployee extends User {
  employee?: Employee;
}
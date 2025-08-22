import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DatabaseService } from '../lib/database';
import type { User, UserRole } from '../types/database';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error checking session:', error);
        setLoading(false);
        return;
      }

      if (session?.user) {
        // Get user details from database
        const dbUser = await DatabaseService.getUserByEmail(session.user.email!);
        if (dbUser) {
          setUser(dbUser);
          setRole(dbUser.role);
        }
      }
    } catch (error) {
      console.error('Error in checkSession:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Login attempt for:', email);
      
      // First, try to authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        toast.error('Email hoặc mật khẩu không chính xác');
        return false;
      }

      if (data.user) {
        // Get user details from database
        const dbUser = await DatabaseService.getUserByEmail(email);
        
        if (!dbUser) {
          console.error('User not found in database');
          toast.error('Tài khoản không tồn tại trong hệ thống');
          await supabase.auth.signOut();
          return false;
        }

        if (dbUser.status !== 'ACTIVE') {
          console.error('User account is disabled');
          toast.error('Tài khoản đã bị vô hiệu hóa');
          await supabase.auth.signOut();
          return false;
        }

        console.log('Login successful for user:', dbUser.full_name);
        setUser(dbUser);
        setRole(dbUser.role);
        
        // Create audit log
        try {
          await DatabaseService.createAuditLog({
            actor_id: dbUser.id,
            action: 'LOGIN',
            target_type: 'USER',
            target_id: dbUser.id,
          });
        } catch (auditError) {
          console.warn('Failed to create login audit log:', auditError);
        }
        
        toast.success(`Chào mừng ${dbUser.full_name}!`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Đã xảy ra lỗi khi đăng nhập';
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email hoặc mật khẩu không chính xác';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Vui lòng xác nhận email trước khi đăng nhập';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Quá nhiều lần thử. Vui lòng thử lại sau';
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = 'Lỗi kết nối. Vui lòng kiểm tra internet và thử lại';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = async () => {
    try {
      if (user) {
        // Create logout audit log
        try {
          await DatabaseService.createAuditLog({
            actor_id: user.id,
            action: 'LOGOUT',
            target_type: 'USER',
            target_id: user.id,
          });
        } catch (auditError) {
          console.warn('Failed to create logout audit log:', auditError);
        }
      }
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      setUser(null);
      setRole(null);
      toast.success('Đăng xuất thành công');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Có lỗi xảy ra khi đăng xuất');
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
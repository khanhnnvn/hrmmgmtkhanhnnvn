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
      console.log('🔍 Checking existing session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error checking session:', error);
        setLoading(false);
        return;
      }

      if (session?.user) {
        console.log('📧 Found session for user:', session.user.email);
        // Get user details from database
        const dbUser = await DatabaseService.getUserByEmail(session.user.email!);
        if (dbUser) {
          console.log('✅ User found in database:', dbUser.full_name);
          setUser(dbUser);
          setRole(dbUser.role);
        } else {
          console.warn('⚠️ User not found in database, signing out');
          await supabase.auth.signOut();
        }
      } else {
        console.log('ℹ️ No active session found');
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
      
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey || 
          supabaseUrl === 'YOUR_SUPABASE_URL' || 
          supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY' ||
          supabaseUrl === 'https://placeholder.supabase.co') {
        console.error('Supabase not configured properly');
        toast.error('Hệ thống chưa được cấu hình. Vui lòng liên hệ quản trị viên.');
        return false;
      }
      
      // Authenticate with Supabase Auth
      console.log('🔐 Attempting Supabase Auth...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        
        // Handle specific error types
        if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
          toast.error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.');
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('Email hoặc mật khẩu không chính xác');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Vui lòng xác nhận email trước khi đăng nhập');
        } else {
          toast.error('Lỗi đăng nhập: ' + error.message);
        }
        return false;
      }

      if (data.user) {
        console.log('✅ Supabase Auth successful');
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

        setUser(dbUser);
        setRole(dbUser.role);
        toast.success('Đăng nhập thành công');
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Có lỗi xảy ra khi đăng nhập');
    }
    return false;
  };

  const logout = async () => {
    try {
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
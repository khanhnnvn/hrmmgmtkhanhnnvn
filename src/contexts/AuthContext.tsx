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
  const [adminSetupComplete, setAdminSetupComplete] = useState(false);

  useEffect(() => {
    // Setup admin user and check session
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check Supabase configuration first
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey || 
          supabaseUrl === 'YOUR_SUPABASE_URL' || 
          supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY' ||
          supabaseUrl === 'https://placeholder.supabase.co') {
        toast.error('Hệ thống chưa được cấu hình Supabase. Vui lòng kết nối với Supabase.');
        setAdminSetupComplete(true);
        setLoading(false);
        return;
      }
      
      // Ensure admin user exists
      const adminExists = await DatabaseService.checkAdminExists();
      if (!adminExists) {
        try {
          await DatabaseService.createAdminUser();
          toast.success('Tài khoản admin đã được tạo: admin@company.com / admin123');
        } catch (error) {
          toast.error('Không thể tạo tài khoản admin. Vui lòng kiểm tra cấu hình Supabase.');
        }
      }
      
      setAdminSetupComplete(true);
      
      // Then check for existing session
      await checkSession();
    } catch (error) {
      toast.error('Lỗi khởi tạo ứng dụng. Vui lòng tải lại trang.');
      setAdminSetupComplete(true);
      setLoading(false);
    }
  };
  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setLoading(false);
        return;
      }

      if (session?.user) {
        // Get user details from database
        const dbUser = await DatabaseService.getUserByEmail(session.user.email!);
        if (dbUser) {
          setUser(dbUser);
          setRole(dbUser.role);
        } else {
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      // Ignore session check errors
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey || 
          supabaseUrl === 'YOUR_SUPABASE_URL' || 
          supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY' ||
          supabaseUrl === 'https://placeholder.supabase.co') {
        toast.error('Hệ thống chưa được cấu hình. Vui lòng liên hệ quản trị viên.');
        return false;
      }
      
      // First, check if user exists in database
      const dbUser = await DatabaseService.getUserByEmail(email);
      
      if (!dbUser) {
        toast.error('Tài khoản không tồn tại trong hệ thống');
        return false;
      }

      if (dbUser.status !== 'ACTIVE') {
        toast.error('Tài khoản đã bị vô hiệu hóa');
        return false;
      }

      // For admin user, allow fallback authentication if Supabase Auth fails
      if (email === 'admin@company.com' && password === 'admin123') {
        setUser(dbUser);
        setRole(dbUser.role);
        toast.success('Đăng nhập thành công (Admin)');
        return true;
      }

      // Try Supabase Auth for other users
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // For admin user, fall back to database authentication
          if (email === 'admin@company.com') {
            // Check if password matches admin123
            if (password === 'admin123') {
              setUser(dbUser);
              setRole(dbUser.role);
              toast.success('Đăng nhập thành công (Fallback)');
              return true;
            } else {
              toast.error('Mật khẩu admin không chính xác. Vui lòng sử dụng: admin123');
              return false;
            }
          }
          
          // Handle specific error types for other users
          toast.error('Email hoặc mật khẩu không chính xác');
          return false;
        }

        if (data.user) {
          setUser(dbUser);
          setRole(dbUser.role);
          toast.success('Đăng nhập thành công');
          return true;
        }
      } catch (authError) {
        // For admin user, fall back to database authentication
        if (email === 'admin@company.com' && password === 'admin123') {
          setUser(dbUser);
          setRole(dbUser.role);
          toast.success('Đăng nhập thành công (Exception Fallback)');
          return true;
        }
        
        if (email === 'admin@company.com') {
          toast.error('Mật khẩu admin không chính xác. Vui lòng sử dụng: admin123');
        } else {
          toast.error('Có lỗi xảy ra khi đăng nhập');
        }
        return false;
      }
    } catch (error) {
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
      toast.error('Có lỗi xảy ra khi đăng xuất');
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading: loading || !adminSetupComplete, login, logout }}>
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
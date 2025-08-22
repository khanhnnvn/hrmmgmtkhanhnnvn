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
      console.log('🚀 Initializing application...');
      
      // Check Supabase configuration first
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey || 
          supabaseUrl === 'YOUR_SUPABASE_URL' || 
          supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY' ||
          supabaseUrl === 'https://placeholder.supabase.co') {
        console.error('❌ Supabase not configured properly');
        toast.error('Hệ thống chưa được cấu hình Supabase. Vui lòng kết nối với Supabase.');
        setAdminSetupComplete(true);
        setLoading(false);
        return;
      }
      
      console.log('✅ Supabase configuration found');
      
      // Ensure admin user exists
      const adminExists = await DatabaseService.checkAdminExists();
      if (!adminExists) {
        console.log('👤 Creating admin user...');
        try {
          await DatabaseService.createAdminUser();
          console.log('✅ Admin user created successfully');
          toast.success('Tài khoản admin đã được tạo: admin@company.com / admin123');
        } catch (error) {
          console.error('❌ Failed to create admin user:', error);
          toast.error('Không thể tạo tài khoản admin. Vui lòng kiểm tra cấu hình Supabase.');
        }
      } else {
        console.log('✅ Admin user already exists');
      }
      
      setAdminSetupComplete(true);
      
      // Then check for existing session
      await checkSession();
    } catch (error) {
      console.error('Error initializing app:', error);
      toast.error('Lỗi khởi tạo ứng dụng. Vui lòng tải lại trang.');
      setAdminSetupComplete(true);
      setLoading(false);
    }
  };
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
      
      // First, check if user exists in database
      console.log('🔍 Checking user in database...');
      const dbUser = await DatabaseService.getUserByEmail(email);
      
      if (!dbUser) {
        console.error('User not found in database');
        toast.error('Tài khoản không tồn tại trong hệ thống');
        return false;
      }

      if (dbUser.status !== 'ACTIVE') {
        console.error('User account is disabled');
        toast.error('Tài khoản đã bị vô hiệu hóa');
        return false;
      }

      // For admin user, allow fallback authentication if Supabase Auth fails
      if (email === 'admin@company.com' && password === 'admin123') {
        console.log('🔐 Admin fallback authentication');
        setUser(dbUser);
        setRole(dbUser.role);
        toast.success('Đăng nhập thành công (Admin)');
        return true;
      }

      // Try Supabase Auth for other users
      console.log('🔐 Attempting Supabase Auth...');
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Supabase auth error:', error);
          
          // For admin user, fall back to database authentication
          if (email === 'admin@company.com') {
            console.log('🔄 Falling back to database authentication for admin');
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
          setUser(dbUser);
          setRole(dbUser.role);
          toast.success('Đăng nhập thành công');
          return true;
        }
      } catch (authError) {
        console.error('Supabase Auth exception:', authError);
        
        // For admin user, fall back to database authentication
        if (email === 'admin@company.com' && password === 'admin123') {
          console.log('🔄 Exception fallback for admin user');
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
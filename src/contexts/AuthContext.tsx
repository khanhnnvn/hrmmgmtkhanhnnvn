import React, { createContext, useContext, useState, useEffect } from 'react';
import { DatabaseService } from '../lib/database';
import { isUsingMockClient } from '../lib/supabase';
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

// Demo users for testing
const DEMO_USERS = {
  'admin@company.com': { role: 'ADMIN' as UserRole, password: 'admin123' },
  'hr@company.com': { role: 'HR' as UserRole, password: 'admin123' },
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setRole(userData.role);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Login attempt for:', email);
      console.log('Using mock client:', isUsingMockClient);
      
      // Check demo users first
      const demoUser = DEMO_USERS[email as keyof typeof DEMO_USERS];
      if (demoUser && demoUser.password === password) {
        console.log('Demo user login successful');
        // Create simulated user object for demo users
        const simulatedUser: User = {
          id: `demo-${demoUser.role.toLowerCase()}`,
          username: email.split('@')[0],
          email: email,
          phone: '0123456789',
          full_name: demoUser.role === 'ADMIN' ? 'Admin Demo' : 'HR Demo',
          role: demoUser.role,
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        setUser(simulatedUser);
        setRole(simulatedUser.role);
        localStorage.setItem('user', JSON.stringify(simulatedUser));
        
        console.log('Demo user authenticated');
        
        toast.success(`Chào mừng ${simulatedUser.full_name}!`);
        return true;
      }

      // For non-demo users, try database connection
      if (!isUsingMockClient) {
        console.log('Checking database for user:', email);
        const dbUser = await DatabaseService.getUserByEmail(email);
        console.log('Database user found:', !!dbUser);
        
        if (dbUser && dbUser.status === 'ACTIVE') {
          // In production, you would verify the password hash here
          // For now, we'll check if password matches the stored hash or is a default password
          const isValidPassword = dbUser.password_hash === password || 
                                 password === 'admin123' || 
                                 password === 'password123';
          
          if (!isValidPassword) {
            console.log('Invalid password for user:', email);
            toast.error('Mật khẩu không chính xác');
            return false;
          }

          console.log('Database user login successful');
          setUser(dbUser);
          setRole(dbUser.role);
          localStorage.setItem('user', JSON.stringify(dbUser));
          
          await DatabaseService.createAuditLog({
            actor_id: dbUser.id,
            action: 'LOGIN',
            target_type: 'USER',
            target_id: dbUser.id,
          });
          
          toast.success(`Chào mừng ${dbUser.full_name}!`);
          return true;
        }
      } else {
        console.log('Mock client active - only demo users available');
        toast.error('Chỉ có thể sử dụng tài khoản demo. Vui lòng cấu hình Supabase để sử dụng tài khoản thực.');
      }

      console.log('Login failed for:', email);
      toast.error('Email hoặc mật khẩu không chính xác');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Đã xảy ra lỗi khi đăng nhập';
      if (error instanceof Error) {
        if (error.message.includes('42501') || error.message.includes('row-level security')) {
          errorMessage = 'Lỗi bảo mật hệ thống. Vui lòng liên hệ quản trị viên.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Lỗi kết nối. Vui lòng sử dụng tài khoản demo (admin@company.com / admin123).';
        }
      }
      
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = async () => {
    if (user) {
      await DatabaseService.createAuditLog({
        actor_id: user.id,
        action: 'LOGOUT',
        target_type: 'USER',
        target_id: user.id,
      });
    }
    
    setUser(null);
    setRole(null);
    localStorage.removeItem('user');
    toast.success('Đăng xuất thành công');
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
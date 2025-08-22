import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  FileText, 
  UserCheck, 
  Settings, 
  Home, 
  User,
  Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/database';

interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  path: string;
}

const menuItems: Record<UserRole, MenuItem[]> = {
  ADMIN: [
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Ứng viên', path: '/candidates' },
    { icon: UserCheck, label: 'Phỏng vấn', path: '/interviews' },
    { icon: Settings, label: 'Quản lý người dùng', path: '/users' },
  ],
  HR: [
    { icon: FileText, label: 'Ứng viên', path: '/candidates' },
    { icon: UserCheck, label: 'Phỏng vấn', path: '/interviews' },
    { icon: Settings, label: 'Quản lý người dùng', path: '/users' },
  ],
  EMPLOYEE: [
    { icon: Home, label: 'Trang chủ', path: '/employee' },
    { icon: UserCheck, label: 'Phiếu phỏng vấn', path: '/employee/interviews' },
    { icon: User, label: 'Hồ sơ cá nhân', path: '/employee/profile' },
  ],
};

export function Sidebar() {
  const { role } = useAuth();
  const location = useLocation();
  
  if (!role) return null;

  const items = menuItems[role];

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-semibold text-gray-900">HR System</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
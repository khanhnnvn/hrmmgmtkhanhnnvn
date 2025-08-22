import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Key,
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DatabaseService } from '../../lib/database';
import { UserForm } from '../../components/Forms/UserForm';
import { EmployeeDetailModal } from '../../components/Modals/EmployeeDetailModal';
import type { UserWithEmployee, UserRole } from '../../types/database';
import toast from 'react-hot-toast';

const roleLabels = {
  ADMIN: { label: 'Quản trị viên', color: 'bg-purple-100 text-purple-800' },
  HR: { label: 'Nhân viên HR', color: 'bg-blue-100 text-blue-800' },
  EMPLOYEE: { label: 'Nhân viên', color: 'bg-green-100 text-green-800' },
};

const statusLabels = {
  ACTIVE: { label: 'Hoạt động', color: 'bg-green-100 text-green-800' },
  DISABLED: { label: 'Vô hiệu hóa', color: 'bg-red-100 text-red-800' },
};

export function UserList() {
  const [users, setUsers] = useState<UserWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithEmployee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<UserWithEmployee | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await DatabaseService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${userName}"?`)) {
      return;
    }

    try {
      await DatabaseService.deleteUser(userId);
      await loadUsers();
      toast.success('Xóa người dùng thành công');
    } catch (error: any) {
      if (error.code === '23503') {
        toast.error('Không thể xóa người dùng này vì có dữ liệu liên quan');
      } else {
        toast.error('Có lỗi xảy ra khi xóa người dùng');
      }
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    
    try {
      await DatabaseService.updateUser(userId, { status: newStatus });
      await loadUsers();
      toast.success(`Đã ${newStatus === 'ACTIVE' ? 'kích hoạt' : 'vô hiệu hóa'} người dùng`);
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái người dùng');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm người dùng</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Tổng người dùng</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Quản trị viên</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {users.filter(u => u.role === 'ADMIN').length}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Nhân viên HR</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {users.filter(u => u.role === 'HR').length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Nhân viên</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {users.filter(u => u.role === 'EMPLOYEE').length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="ALL">Tất cả vai trò</option>
                {Object.entries(roleLabels).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              {Object.entries(statusLabels).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Thông tin cơ bản</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Liên hệ</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Vai trò</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Trạng thái</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Ngày tạo</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{user.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleLabels[user.role].color}`}>
                      {roleLabels[user.role].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[user.status].color}`}>
                        {statusLabels[user.status].label}
                      </span>
                      {user.employee && (
                        <button
                          onClick={() => setViewingEmployee(user)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Xem hồ sơ
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: vi })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        className={`p-1 hover:bg-gray-50 rounded transition-colors ${
                          user.status === 'ACTIVE' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                        }`}
                        title={user.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      >
                        {user.status === 'ACTIVE' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy người dùng nào</h3>
            <p className="text-gray-600 mb-4">Hãy thử thay đổi bộ lọc hoặc thêm người dùng mới</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Thêm người dùng đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <UserForm
          onSuccess={() => {
            setShowCreateForm(false);
            loadUsers();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit User Form */}
      {editingUser && (
        <UserForm
          user={editingUser}
          onSuccess={() => {
            setEditingUser(null);
            loadUsers();
          }}
          onCancel={() => setEditingUser(null)}
        />
      )}

      {/* Employee Detail Modal */}
      {viewingEmployee && (
        <EmployeeDetailModal
          user={viewingEmployee}
          onClose={() => setViewingEmployee(null)}
          onUpdate={() => {
            loadUsers();
            setViewingEmployee(null);
          }}
        />
      )}
    </div>
  );
}
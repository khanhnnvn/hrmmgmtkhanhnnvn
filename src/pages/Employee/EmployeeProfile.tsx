import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Phone, Edit, Save, X, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { employeeSchema, type EmployeeFormData } from '../../utils/validation';
import { DatabaseService } from '../../lib/database';
import { useAuth } from '../../contexts/AuthContext';
import type { Employee } from '../../types/database';
import toast from 'react-hot-toast';

export function EmployeeProfile() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema)
  });

  useEffect(() => {
    if (user) {
      loadEmployeeData();
    }
  }, [user]);

  const loadEmployeeData = async () => {
    if (!user) return;

    try {
      const employeeData = await DatabaseService.getEmployeeByUserId(user.id);
      setEmployee(employeeData);
      
      if (employeeData) {
        reset({
          place_of_residence: employeeData.place_of_residence,
          hometown: employeeData.hometown,
          national_id: employeeData.national_id,
        });
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    if (!user) return;

    try {
      if (employee) {
        // Update existing employee record
        await DatabaseService.updateEmployee(employee.id, data);
        toast.success('Cập nhật thông tin thành công');
      } else {
        // Create new employee record
        const newEmployee = await DatabaseService.createEmployee({
          ...data,
          user_id: user.id
        });
        setEmployee(newEmployee);
        toast.success('Tạo hồ sơ nhân viên thành công');
      }
      
      setIsEditing(false);
      loadEmployeeData();
    } catch (error: any) {
      if (error.code === '23505' && error.message.includes('national_id')) {
        toast.error('Số căn cước công dân này đã được sử dụng');
      } else {
        toast.error('Có lỗi xảy ra khi lưu thông tin');
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (employee) {
      reset({
        place_of_residence: employee.place_of_residence,
        hometown: employee.hometown,
        national_id: employee.national_id,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không thể tải thông tin người dùng</p>
      </div>
    );
  }

  const roleLabels = {
    ADMIN: 'Quản trị viên',
    HR: 'Nhân viên HR',
    EMPLOYEE: 'Nhân viên'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-5 h-5" />
            <span>Chỉnh sửa thông tin</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{user.full_name}</h2>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{roleLabels[user.role]}</span>
              </div>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 text-sm">{user.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 text-sm">{user.phone}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Thông tin tài khoản</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Username:</span>
                  <span className="text-gray-900">@{user.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ngày tạo:</span>
                  <span className="text-gray-900">
                    {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: vi })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trạng thái:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu hóa'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Information Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h3>
                {isEditing && (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex items-center space-x-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Hủy</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Lưu</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chỗ ở hiện tại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('place_of_residence')}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="123 Đường ABC, Quận XYZ, TP. HCM"
                  />
                  {errors.place_of_residence && (
                    <p className="mt-1 text-sm text-red-600">{errors.place_of_residence.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quê quán <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('hometown')}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Xã ABC, Huyện XYZ, Tỉnh DEF"
                  />
                  {errors.hometown && (
                    <p className="mt-1 text-sm text-red-600">{errors.hometown.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Căn cước công dân <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('national_id')}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="123456789012"
                    maxLength={12}
                  />
                  {errors.national_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.national_id.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Nhập đúng 12 số của căn cước công dân
                  </p>
                </div>
              </div>

              {!employee && !isEditing && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    <strong>Thông báo:</strong> Bạn chưa cập nhật đầy đủ thông tin cá nhân. 
                    Vui lòng nhấn "Chỉnh sửa thông tin\" để hoàn thiện hồ sơ của mình.
                  </p>
                </div>
              )}

              {employee && !isEditing && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">
                    <strong>Hoàn thành:</strong> Hồ sơ cá nhân của bạn đã được cập nhật đầy đủ.
                    Cập nhật lần cuối: {format(new Date(employee.updated_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-2">Hướng dẫn</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Thông tin tài khoản (email, số điện thoại) chỉ có thể được thay đổi bởi quản trị viên</li>
          <li>• Vui lòng cập nhật đầy đủ thông tin cá nhân để hoàn thiện hồ sơ nhân viên</li>
          <li>• Thông tin được mã hóa và bảo mật theo chính sách của công ty</li>
          <li>• Liên hệ HR nếu bạn cần hỗ trợ thay đổi thông tin tài khoản</li>
        </ul>
      </div>
    </div>
  );
}
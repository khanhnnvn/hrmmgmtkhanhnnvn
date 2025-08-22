import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, User, Edit, Save } from 'lucide-react';
import { employeeSchema, type EmployeeFormData } from '../../utils/validation';
import { DatabaseService } from '../../lib/database';
import type { UserWithEmployee } from '../../types/database';
import toast from 'react-hot-toast';

interface EmployeeDetailModalProps {
  user: UserWithEmployee;
  onClose: () => void;
  onUpdate: () => void;
}

export function EmployeeDetailModal({ user, onClose, onUpdate }: EmployeeDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      place_of_residence: user.employee?.place_of_residence || '',
      hometown: user.employee?.hometown || '',
      national_id: user.employee?.national_id || '',
    }
  });

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      if (user.employee) {
        // Update existing employee record
        await DatabaseService.updateEmployee(user.employee.id, data);
        toast.success('Cập nhật thông tin nhân viên thành công');
      } else {
        // Create new employee record
        await DatabaseService.createEmployee({
          ...data,
          user_id: user.id
        });
        toast.success('Tạo hồ sơ nhân viên thành công');
      }
      
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      if (error.code === '23505' && error.message.includes('national_id')) {
        toast.error('Số căn cước công dân này đã được sử dụng');
      } else {
        toast.error('Có lỗi xảy ra khi lưu thông tin');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Thông tin nhân viên</h3>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Chỉnh sửa</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Basic User Info (Read-only) */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Thông tin cơ bản</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <p className="text-gray-900">{user.full_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <p className="text-gray-900">@{user.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <p className="text-gray-900">{user.phone}</p>
              </div>
            </div>
          </div>

          {/* Employee Details Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <h4 className="text-md font-medium text-gray-900 mb-4">Thông tin nhân viên</h4>
            
            <div className="space-y-4">
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
              </div>
            </div>

            {isEditing && (
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Lưu thông tin</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {!isEditing && !user.employee && (
              <div className="mt-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    Chưa có thông tin hồ sơ nhân viên. Nhấn "Chỉnh sửa" để thêm thông tin.
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
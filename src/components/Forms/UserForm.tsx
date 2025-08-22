import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, User, Key, Eye, EyeOff } from 'lucide-react';
import { userSchema, type UserFormData, generateUsername, generatePassword } from '../../utils/validation';
import { DatabaseService } from '../../lib/database';
import type { UserWithEmployee } from '../../types/database';
import toast from 'react-hot-toast';

interface UserFormProps {
  user?: UserWithEmployee;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const isEditing = !!user;
  const [existingUsernames, setExistingUsernames] = useState<string[]>([]);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: isEditing ? {
      username: user.username,
      email: user.email,
      phone: user.phone,
      full_name: user.full_name,
      role: user.role
    } : {
      role: 'EMPLOYEE'
    }
  });

  const fullName = watch('full_name');
  const username = watch('username');

  useEffect(() => {
    loadExistingUsernames();
    if (!isEditing) {
      const newPassword = generatePassword();
      setGeneratedPassword(newPassword);
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing && fullName && fullName.length > 2) {
      const generatedUsername = generateUsername(fullName, existingUsernames);
      setValue('username', generatedUsername);
    }
  }, [fullName, existingUsernames, isEditing, setValue]);

  const loadExistingUsernames = async () => {
    try {
      const users = await DatabaseService.getUsers();
      const usernames = users.filter(u => u.id !== user?.id).map(u => u.username);
      setExistingUsernames(usernames);
    } catch (error) {
      console.error('Error loading existing usernames:', error);
    }
  };

  const generateNewPassword = () => {
    const newPassword = generatePassword();
    setGeneratedPassword(newPassword);
    toast.success('Đã tạo mật khẩu mới');
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      toast.success('Đã copy mật khẩu vào clipboard');
    } catch (error) {
      toast.error('Không thể copy mật khẩu');
    }
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEditing) {
        await DatabaseService.updateUser(user!.id, {
          username: data.username,
          email: data.email,
          phone: data.phone,
          full_name: data.full_name,
          role: data.role,
          updated_at: new Date().toISOString()
        });
        toast.success('Cập nhật người dùng thành công');
      } else {
        // Check for duplicates
        const existingUser = await DatabaseService.getUserByEmail(data.email);
        if (existingUser) {
          toast.error('Email này đã được sử dụng');
          return;
        }

        await DatabaseService.createUser({
          ...data,
          password_hash: generatedPassword, // In production, this would be hashed
          status: 'ACTIVE'
        });
        toast.success(`Tạo người dùng thành công! Mật khẩu: ${generatedPassword}`);
      }
      onSuccess();
    } catch (error: any) {
      if (error.code === '23505') {
        if (error.message.includes('users_email_key')) {
          toast.error('Email này đã được sử dụng');
        } else if (error.message.includes('users_username_key')) {
          toast.error('Username này đã được sử dụng');
        } else {
          toast.error('Thông tin này đã tồn tại');
        }
      } else {
        toast.error('Có lỗi xảy ra khi lưu thông tin người dùng');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('full_name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nguyễn Văn A"
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('username')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="nguyenvana"
              />
              {!isEditing && fullName && (
                <p className="mt-1 text-xs text-gray-500">
                  Tự động tạo từ họ tên
                </p>
              )}
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="nguyen.van.a@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0912345678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vai trò <span className="text-red-500">*</span>
              </label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="EMPLOYEE">Nhân viên</option>
                <option value="HR">Nhân viên HR</option>
                <option value="ADMIN">Quản trị viên</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>
          </div>

          {/* Password Section (only for new users) */}
          {!isEditing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-blue-900">Mật khẩu tự động tạo</h4>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={generateNewPassword}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    <span>Tạo mới</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="bg-white border border-blue-200 rounded p-3">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono text-gray-900">
                    {showPassword ? generatedPassword : '••••••••••••'}
                  </code>
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-blue-800 mt-2">
                <strong>Lưu ý:</strong> Vui lòng ghi nhận mật khẩu này và cung cấp cho người dùng. 
                Mật khẩu sẽ không được hiển thị lại sau khi tạo tài khoản.
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
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
                  <User className="w-5 h-5" />
                  <span>{isEditing ? 'Cập nhật' : 'Tạo người dùng'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
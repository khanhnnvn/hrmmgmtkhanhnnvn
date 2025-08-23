import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, FileText, CheckCircle, Play, Bug } from 'lucide-react';
import { candidateSchema, type CandidateFormData } from '../../utils/validation';
import { DatabaseService } from '../../lib/database';
import type { Position } from '../../types/database';
import toast from 'react-hot-toast';

// Auto test integration - always available in dev mode
const isDevMode = import.meta.env.DEV;

export function CandidateApplicationForm() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAutoTestRunning, setIsAutoTestRunning] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset
  } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema)
  });

  useEffect(() => {
    loadPositions();
    
    // Auto test integration - always available in dev
    if (isDevMode) {
      console.log('🤖 Auto test available on /apply page');
      console.log('Use the Auto Test button or window.autoTest.run() to start testing');
    }
  }, []);

  const loadPositions = async () => {
    try {
      const data = await DatabaseService.getOpenPositions();
      setPositions(data);
      console.log('✅ Loaded positions:', data.length);
    } catch (error) {
      console.error('❌ Error loading positions:', error);
      // Create default positions if none exist
      await createDefaultPositions();
      // Show user-friendly message
      toast.error('Không thể tải danh sách vị trí. Vui lòng thử lại.');
    }
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file PDF, DOC, DOCX');
      return;
    }

    if (file.size > maxSize) {
      toast.error('Kích thước file không được vượt quá 10MB');
      return;
    }

    setSelectedFile(file);
    toast.success(`Đã chọn file: ${file.name}`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const createDefaultPositions = async () => {
    try {
      console.log('🔧 Creating default positions...');
      // This would need to be implemented in DatabaseService
      // For now, just log the attempt
      console.log('Default positions creation attempted');
    } catch (error) {
      console.error('Failed to create default positions:', error);
    }
  };

  const startAutoTest = async () => {
    if (window.autoTest) {
      setIsAutoTestRunning(true);
      await window.autoTest.run();
      setIsAutoTestRunning(false);
    } else {
      toast.error('Auto test system not available');
    }
  };

  const onSubmit = async (data: CandidateFormData) => {
    try {
      // Validate required fields
      if (!data.applied_position_id) {
        toast.error('Vui lòng chọn vị trí ứng tuyển');
        return;
      }

      // Validate position exists
      const selectedPosition = positions.find(p => p.id === data.applied_position_id);
      if (!selectedPosition) {
        toast.error('Vị trí ứng tuyển không hợp lệ. Vui lòng chọn lại.');
        return;
      }

      // Prepare candidate data
      const candidateData = {
        ...data,
        status: 'SUBMITTED',
        cv_url: selectedFile ? `uploads/${Date.now()}_${selectedFile.name}` : ''
      };

      await DatabaseService.createCandidate(candidateData);
      console.log('✅ Candidate created successfully:', candidateData.full_name);
      
      setIsSubmitted(true);
      reset();
      setSelectedFile(null);
      toast.success('Nộp hồ sơ thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
    } catch (error: any) {
      console.error('❌ Error creating candidate:', error);
      let errorMessage = 'Có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại.';
      
      if (error?.message) {
        if (error.message.includes('đã nộp hồ sơ')) {
          errorMessage = 'Bạn đã nộp hồ sơ cho vị trí này rồi!';
        } else if (error.message.includes('row-level security')) {
          errorMessage = 'Lỗi bảo mật hệ thống. Vui lòng thử lại sau.';
          console.error('🔒 RLS Policy Error - need to fix database policies');
        }
      }
      
      toast.error(errorMessage);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nộp hồ sơ thành công!</h2>
            <p className="text-gray-600 mb-6">
              Cảm ơn bạn đã quan tâm đến công ty chúng tôi. Chúng tôi sẽ xem xét hồ sơ và liên hệ với bạn trong thời gian sớm nhất.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Nộp hồ sơ khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Auto Test Controls - Only in Development */}
        {isDevMode && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-yellow-800">🧪 Development Mode</h3>
                <p className="text-xs text-yellow-700 mt-1">Auto test tools available</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={startAutoTest}
                  disabled={isAutoTestRunning}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAutoTestRunning ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  <span>{isAutoTestRunning ? 'Testing...' : 'Auto Test'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">Ứng tuyển vị trí</h1>
            <p className="text-blue-100 mt-2">Vui lòng điền đầy đủ thông tin để nộp hồ sơ ứng tuyển</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('full_name')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Nguyễn Văn A"
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="example@gmail.com"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="0912345678"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vị trí ứng tuyển <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('applied_position_id')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="">Chọn vị trí ứng tuyển</option>
                  {positions.map((position) => (
                    <option key={position.id} value={position.id}>
                      {position.title} - {position.department}
                    </option>
                  ))}
                </select>
                {errors.applied_position_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.applied_position_id.message}</p>
                )}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CV/Resume (PDF, DOC, DOCX - tối đa 10MB)
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
              >
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label className="cursor-pointer">
                      <span className="text-blue-600 font-medium hover:text-blue-500">
                        Chọn file
                      </span>
                      <span className="text-gray-500"> hoặc kéo thả file vào đây</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileInput}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Chỉ chấp nhận file PDF, DOC, DOCX (tối đa 10MB)
                  </p>
                </div>
              </div>

              {selectedFile && (
                <div className="mt-3 flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="ml-auto text-green-600 hover:text-green-800"
                  >
                    Xóa
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    <span>Nộp hồ sơ ứng tuyển</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
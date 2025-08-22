import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { decisionSchema, type DecisionFormData } from '../../utils/validation';
import { DatabaseService } from '../../lib/database';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface DecisionFormProps {
  candidateId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DecisionForm({ candidateId, onSuccess, onCancel }: DecisionFormProps) {
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<DecisionFormData>({
    resolver: zodResolver(decisionSchema),
    defaultValues: {
      candidate_id: candidateId,
      decision: 'HIRE'
    }
  });

  const decision = watch('decision');

  const onSubmit = async (data: DecisionFormData) => {
    if (!user) return;

    try {
      await DatabaseService.createDecision({
        ...data,
        decided_by: user.id
      });

      // Update candidate status based on decision
      const newStatus = data.decision === 'HIRE' ? 'OFFERED' : 'NOT_HIRED';
      await DatabaseService.updateCandidate(candidateId, { status: newStatus });

      toast.success('Quyết định đã được lưu thành công');
      onSuccess();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu quyết định');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quyết định tuyển dụng</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quyết định <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  {...register('decision')}
                  value="HIRE"
                  className="text-green-600 focus:ring-green-500"
                />
                <div className="ml-3 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Tuyển dụng</span>
                </div>
              </label>
              
              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  {...register('decision')}
                  value="NO_HIRE"
                  className="text-red-600 focus:ring-red-500"
                />
                <div className="ml-3 flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-gray-900">Không tuyển</span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú quyết định <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('decision_notes')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder={
                decision === 'HIRE'
                  ? 'Ví dụ: Ứng viên có kỹ năng chuyên môn tốt, kinh nghiệm phù hợp với vị trí...'
                  : 'Ví dụ: Kỹ năng chưa phù hợp với yêu cầu công việc, cần thêm kinh nghiệm...'
              }
            />
            {errors.decision_notes && (
              <p className="mt-1 text-sm text-red-600">{errors.decision_notes.message}</p>
            )}
          </div>

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
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                decision === 'HIRE'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isSubmitting ? 'Đang lưu...' : 'Xác nhận quyết định'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
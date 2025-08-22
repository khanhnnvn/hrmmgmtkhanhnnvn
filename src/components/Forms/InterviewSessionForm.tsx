import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Calendar, Users } from 'lucide-react';
import { interviewSessionSchema, type InterviewSessionFormData } from '../../utils/validation';
import { DatabaseService } from '../../lib/database';
import { useAuth } from '../../contexts/AuthContext';
import type { CandidateWithDetails, User } from '../../types/database';
import toast from 'react-hot-toast';

interface InterviewSessionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function InterviewSessionForm({ onSuccess, onCancel }: InterviewSessionFormProps) {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<CandidateWithDetails[]>([]);
  const [interviewers, setInterviewers] = useState<User[]>([]);
  const [selectedInterviewers, setSelectedInterviewers] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<InterviewSessionFormData>({
    resolver: zodResolver(interviewSessionSchema),
    defaultValues: {
      title: 'Phỏng vấn kỹ thuật',
      scheduled_date: new Date().toISOString().slice(0, 16)
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [candidatesData, usersData] = await Promise.all([
        DatabaseService.getCandidates(),
        DatabaseService.getUsers()
      ]);

      // Filter candidates with status APPROVED or INTERVIEW
      const eligibleCandidates = candidatesData.filter(c => 
        ['APPROVED', 'INTERVIEW'].includes(c.status)
      );
      setCandidates(eligibleCandidates);

      // Filter users who can be interviewers (HR, ADMIN, EMPLOYEE)
      const eligibleInterviewers = usersData.filter(u => 
        u.status === 'ACTIVE' && ['HR', 'ADMIN', 'EMPLOYEE'].includes(u.role)
      );
      setInterviewers(eligibleInterviewers);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Không thể tải dữ liệu');
    }
  };

  const handleInterviewerToggle = (interviewerId: string) => {
    setSelectedInterviewers(prev => 
      prev.includes(interviewerId)
        ? prev.filter(id => id !== interviewerId)
        : [...prev, interviewerId]
    );
  };

  const onSubmit = async (data: InterviewSessionFormData) => {
    if (!user) return;

    if (selectedInterviewers.length === 0) {
      toast.error('Vui lòng chọn ít nhất một người phỏng vấn');
      return;
    }

    try {
      // Create interview session
      const session = await DatabaseService.createInterviewSession({
        ...data,
        created_by: user.id,
        status: 'SCHEDULED'
      });

      // Create individual interview records for each interviewer
      await Promise.all(
        selectedInterviewers.map(interviewerId =>
          DatabaseService.createInterview({
            candidate_id: data.candidate_id,
            interviewer_id: interviewerId,
            interview_session_id: session.id,
            tech_notes: '',
            soft_notes: '',
            result: 'PENDING'
          })
        )
      );

      // Update candidate status to INTERVIEW
      await DatabaseService.updateCandidate(data.candidate_id, { status: 'INTERVIEW' });

      toast.success('Tạo cuộc phỏng vấn thành công');
      onSuccess();
    } catch (error) {
      console.error('Error creating interview session:', error);
      toast.error('Có lỗi xảy ra khi tạo cuộc phỏng vấn');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Tạo cuộc phỏng vấn</h3>
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
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('title')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Phỏng vấn kỹ thuật"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian
              </label>
              <input
                type="datetime-local"
                {...register('scheduled_date')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ứng viên <span className="text-red-500">*</span>
            </label>
            <select
              {...register('candidate_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn ứng viên</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.full_name} - {candidate.position?.title}
                </option>
              ))}
            </select>
            {errors.candidate_id && (
              <p className="mt-1 text-sm text-red-600">{errors.candidate_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Người phỏng vấn <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
              {interviewers.length > 0 ? (
                <div className="space-y-3">
                  {interviewers.map((interviewer) => (
                    <label
                      key={interviewer.id}
                      className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedInterviewers.includes(interviewer.id)}
                        onChange={() => handleInterviewerToggle(interviewer.id)}
                        className="text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{interviewer.full_name}</p>
                        <p className="text-sm text-gray-500">{interviewer.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Không có người phỏng vấn khả dụng</p>
              )}
            </div>
            {selectedInterviewers.length === 0 && (
              <p className="mt-1 text-sm text-red-600">Vui lòng chọn ít nhất một người phỏng vấn</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Users className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Lưu ý:</p>
                <ul className="space-y-1">
                  <li>• Mỗi người phỏng vấn sẽ có một phiếu đánh giá riêng</li>
                  <li>• Trạng thái ứng viên sẽ được cập nhật thành "Phỏng vấn"</li>
                  <li>• Người phỏng vấn có thể cập nhật kết quả trong phần "Phiếu phỏng vấn"</li>
                </ul>
              </div>
            </div>
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
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  <span>Tạo cuộc phỏng vấn</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
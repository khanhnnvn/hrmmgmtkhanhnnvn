import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Calendar, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  Building,
  Save,
  Eye,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { interviewSchema, type InterviewFormData } from '../../utils/validation';
import { DatabaseService } from '../../lib/database';
import { useAuth } from '../../contexts/AuthContext';
import type { Interview } from '../../types/database';
import toast from 'react-hot-toast';

const resultLabels = {
  PENDING: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  PASS: { label: 'Đạt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  FAIL: { label: 'Không đạt', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export function InterviewAssignments() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [filterResult, setFilterResult] = useState<string>('ALL');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<InterviewFormData>({
    resolver: zodResolver(interviewSchema)
  });

  useEffect(() => {
    if (user) {
      loadMyInterviews();
    }
  }, [user]);

  const loadMyInterviews = async () => {
    if (!user) return;

    try {
      const data = await DatabaseService.getMyInterviews(user.id);
      setInterviews(data);
    } catch (error) {
      console.error('Error loading interviews:', error);
      toast.error('Không thể tải danh sách phỏng vấn');
    } finally {
      setLoading(false);
    }
  };

  const handleInterviewClick = (interview: Interview) => {
    setSelectedInterview(interview);
    reset({
      tech_notes: interview.tech_notes,
      soft_notes: interview.soft_notes,
      result: interview.result
    });
  };

  const onSubmit = async (data: InterviewFormData) => {
    if (!selectedInterview) return;

    try {
      await DatabaseService.updateInterview(selectedInterview.id, data);
      toast.success('Cập nhật phiếu đánh giá thành công');
      setSelectedInterview(null);
      loadMyInterviews();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu phiếu đánh giá');
    }
  };

  const getStatistics = () => {
    const total = interviews.length;
    const pending = interviews.filter(i => i.result === 'PENDING').length;
    const completed = interviews.filter(i => i.result !== 'PENDING').length;
    const passed = interviews.filter(i => i.result === 'PASS').length;
    const failed = interviews.filter(i => i.result === 'FAIL').length;

    return { total, pending, completed, passed, failed };
  };

  const filteredInterviews = interviews.filter(interview => {
    return filterResult === 'ALL' || interview.result === filterResult;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = getStatistics();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Phiếu phỏng vấn của tôi</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600">Tổng số</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-gray-600">Chờ đánh giá</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
            <p className="text-sm text-gray-600">Hoàn thành</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
            <p className="text-sm text-gray-600">Đạt</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-sm text-gray-600">Không đạt</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Lọc theo kết quả:</label>
          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Tất cả</option>
            <option value="PENDING">Đang xử lý</option>
            <option value="PASS">Đạt</option>
            <option value="FAIL">Không đạt</option>
          </select>
        </div>
      </div>

      {/* Interviews List */}
      <div className="space-y-4">
        {filteredInterviews.map((interview) => {
          const ResultIcon = resultLabels[interview.result].icon;
          return (
            <div
              key={interview.id}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleInterviewClick(interview)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {interview.candidate?.full_name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <Building className="w-4 h-4" />
                          <span>{interview.candidate?.position?.title}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(interview.created_at), 'dd/MM/yyyy', { locale: vi })}
                          </span>
                        </div>
                      </div>

                      {interview.result !== 'PENDING' && (
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Đánh giá kỹ thuật: </span>
                            <span className="text-gray-600">{interview.tech_notes || 'Chưa có đánh giá'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Đánh giá kỹ năng mềm: </span>
                            <span className="text-gray-600">{interview.soft_notes || 'Chưa có đánh giá'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${resultLabels[interview.result].color}`}>
                    <ResultIcon className="w-4 h-4 mr-2" />
                    {resultLabels[interview.result].label}
                  </span>
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">
                      {interview.result === 'PENDING' ? 'Đánh giá' : 'Xem chi tiết'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredInterviews.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filterResult === 'ALL' 
                ? 'Chưa có phiếu phỏng vấn nào' 
                : 'Không có phiếu phỏng vấn nào phù hợp'
              }
            </h3>
            <p className="text-gray-600">
              {filterResult === 'ALL' 
                ? 'Bạn sẽ nhận được thông báo khi có phiếu phỏng vấn mới được giao'
                : 'Hãy thử thay đổi bộ lọc để xem các phiếu khác'
              }
            </p>
          </div>
        )}
      </div>

      {/* Interview Form Modal */}
      {selectedInterview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Phiếu đánh giá phỏng vấn - {selectedInterview.candidate?.full_name}
              </h3>
              <button
                onClick={() => setSelectedInterview(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Candidate Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Thông tin ứng viên</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Họ tên:</span>
                    <p className="font-medium">{selectedInterview.candidate?.full_name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Vị trí ứng tuyển:</span>
                    <p className="font-medium">{selectedInterview.candidate?.position?.title}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Email:</span>
                    <p className="font-medium">{selectedInterview.candidate?.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Số điện thoại:</span>
                    <p className="font-medium">{selectedInterview.candidate?.phone}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đánh giá kỹ thuật <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('tech_notes')}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Nhập đánh giá về năng lực chuyên môn, kỹ thuật của ứng viên..."
                  />
                  {errors.tech_notes && (
                    <p className="mt-1 text-sm text-red-600">{errors.tech_notes.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đánh giá kỹ năng mềm <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('soft_notes')}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Nhập đánh giá về giao tiếp, thái độ làm việc, kỹ năng mềm của ứng viên..."
                  />
                  {errors.soft_notes && (
                    <p className="mt-1 text-sm text-red-600">{errors.soft_notes.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Kết quả đánh giá <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        {...register('result')}
                        value="PASS"
                        className="text-green-600 focus:ring-green-500"
                      />
                      <div className="ml-3 flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-gray-900">Đạt</span>
                        <span className="text-sm text-gray-500">- Ứng viên đáp ứng yêu cầu</span>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        {...register('result')}
                        value="FAIL"
                        className="text-red-600 focus:ring-red-500"
                      />
                      <div className="ml-3 flex items-center space-x-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-gray-900">Không đạt</span>
                        <span className="text-sm text-gray-500">- Ứng viên chưa đáp ứng yêu cầu</span>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        {...register('result')}
                        value="PENDING"
                        className="text-yellow-600 focus:ring-yellow-500"
                      />
                      <div className="ml-3 flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-gray-900">Đang xử lý</span>
                        <span className="text-sm text-gray-500">- Cần thêm thời gian đánh giá</span>
                      </div>
                    </label>
                  </div>
                  {errors.result && (
                    <p className="mt-1 text-sm text-red-600">{errors.result.message}</p>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedInterview(null)}
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
                        <span>Lưu đánh giá</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
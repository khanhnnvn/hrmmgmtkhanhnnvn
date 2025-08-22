import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DatabaseService } from '../../lib/database';
import { InterviewSessionForm } from '../../components/Forms/InterviewSessionForm';
import type { InterviewSessionWithDetails } from '../../types/database';
import toast from 'react-hot-toast';

const statusLabels = {
  SCHEDULED: { label: 'Đã lên lịch', color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: 'Đang tiến hành', color: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
};

const resultLabels = {
  PASS: { label: 'Đạt', color: 'bg-green-100 text-green-800' },
  FAIL: { label: 'Không đạt', color: 'bg-red-100 text-red-800' },
  PENDING: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-800' },
};

export function InterviewList() {
  const [sessions, setSessions] = useState<InterviewSessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await DatabaseService.getInterviewSessionsWithDetails();
      setSessions(data);
    } catch (error) {
      console.error('Error loading interview sessions:', error);
      toast.error('Không thể tải danh sách phỏng vấn');
    } finally {
      setLoading(false);
    }
  };

  const getSessionProgress = (session: InterviewSessionWithDetails) => {
    const totalInterviews = session.interviews?.length || 0;
    const completedInterviews = session.interviews?.filter(i => i.result !== 'PENDING').length || 0;
    const passedInterviews = session.interviews?.filter(i => i.result === 'PASS').length || 0;
    
    return {
      total: totalInterviews,
      completed: completedInterviews,
      passed: passedInterviews,
      percentage: totalInterviews > 0 ? Math.round((completedInterviews / totalInterviews) * 100) : 0
    };
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Quản lý phỏng vấn</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Tạo cuộc phỏng vấn</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Tổng cuộc phỏng vấn</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{sessions.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Đã lên lịch</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {sessions.filter(s => s.status === 'SCHEDULED').length}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Hoàn thành</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {sessions.filter(s => s.status === 'COMPLETED').length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Tổng phiếu đánh giá</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {sessions.reduce((total, s) => total + (s.interviews?.length || 0), 0)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Interview Sessions */}
      <div className="space-y-4">
        {sessions.map((session) => {
          const progress = getSessionProgress(session);
          return (
            <div key={session.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                  <p className="text-gray-600 mt-1">
                    Ứng viên: <span className="font-medium">{session.candidate?.full_name}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Vị trí: {session.candidate?.position?.title}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[session.status].color}`}>
                    {statusLabels[session.status].label}
                  </span>
                  {session.scheduled_date && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(session.scheduled_date), 'dd/MM/yyyy', { locale: vi })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(session.scheduled_date), 'HH:mm', { locale: vi })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Tiến độ phỏng vấn</span>
                  <span className="text-sm text-gray-500">
                    {progress.completed}/{progress.total} phiếu đã hoàn thành
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Interview Results */}
              {session.interviews && session.interviews.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Phiếu đánh giá:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {session.interviews.map((interview) => (
                      <div key={interview.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {interview.interviewer?.full_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(interview.created_at), 'dd/MM HH:mm', { locale: vi })}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${resultLabels[interview.result].color}`}>
                            {resultLabels[interview.result].label}
                          </span>
                        </div>
                        
                        {interview.result !== 'PENDING' && (
                          <div className="space-y-2 text-xs text-gray-600">
                            <div>
                              <span className="font-medium">Kỹ thuật:</span>
                              <p className="truncate">{interview.tech_notes}</p>
                            </div>
                            <div>
                              <span className="font-medium">Kỹ năng mềm:</span>
                              <p className="truncate">{interview.soft_notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Người tạo: {session.creator?.full_name}
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>{progress.passed} đạt</span>
                    </span>
                    <span className="flex items-center space-x-1 text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span>{progress.completed - progress.passed} không đạt</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {sessions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có cuộc phỏng vấn nào</h3>
            <p className="text-gray-600 mb-4">Bắt đầu bằng cách tạo cuộc phỏng vấn đầu tiên</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tạo cuộc phỏng vấn
            </button>
          </div>
        )}
      </div>

      {/* Create Interview Session Form */}
      {showCreateForm && (
        <InterviewSessionForm
          onSuccess={() => {
            setShowCreateForm(false);
            loadSessions();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}
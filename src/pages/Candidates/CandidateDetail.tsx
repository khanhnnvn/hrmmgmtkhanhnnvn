import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  Download,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DatabaseService } from '../../lib/database';
import { DecisionForm } from '../../components/Forms/DecisionForm';
import type { CandidateWithDetails } from '../../types/database';
import toast from 'react-hot-toast';

const statusLabels = {
  SUBMITTED: { label: 'Mới nộp', color: 'bg-blue-100 text-blue-800', icon: FileText },
  APPROVED: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  INTERVIEW: { label: 'Phỏng vấn', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  OFFERED: { label: 'Đã đề xuất', color: 'bg-purple-100 text-purple-800', icon: FileText },
  HIRED: { label: 'Đã tuyển', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-800', icon: XCircle },
  NOT_HIRED: { label: 'Không tuyển', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const interviewResultLabels = {
  PASS: { label: 'Đạt', color: 'bg-green-100 text-green-800' },
  FAIL: { label: 'Không đạt', color: 'bg-red-100 text-red-800' },
  PENDING: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-800' },
};

export function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<CandidateWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDecisionForm, setShowDecisionForm] = useState(false);

  useEffect(() => {
    if (id) {
      loadCandidate(id);
    }
  }, [id]);

  const loadCandidate = async (candidateId: string) => {
    try {
      const data = await DatabaseService.getCandidateById(candidateId);
      setCandidate(data);
    } catch (error) {
      console.error('Error loading candidate:', error);
      toast.error('Không thể tải thông tin ứng viên');
    } finally {
      setLoading(false);
    }
  };

  const updateCandidateStatus = async (status: string) => {
    if (!candidate) return;

    try {
      await DatabaseService.updateCandidate(candidate.id, { status });
      await loadCandidate(candidate.id);
      toast.success('Cập nhật trạng thái thành công');
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const getAvailableActions = () => {
    if (!candidate) return [];

    const actions = [];
    
    switch (candidate.status) {
      case 'SUBMITTED':
        actions.push(
          { label: 'Duyệt hồ sơ', action: () => updateCandidateStatus('APPROVED'), color: 'bg-green-600 hover:bg-green-700' },
          { label: 'Từ chối', action: () => updateCandidateStatus('REJECTED'), color: 'bg-red-600 hover:bg-red-700' }
        );
        break;
      case 'APPROVED':
        actions.push(
          { label: 'Mời phỏng vấn', action: () => updateCandidateStatus('INTERVIEW'), color: 'bg-yellow-600 hover:bg-yellow-700' }
        );
        break;
      case 'INTERVIEW':
        actions.push(
          { label: 'Đưa ra quyết định', action: () => setShowDecisionForm(true), color: 'bg-purple-600 hover:bg-purple-700' }
        );
        break;
      case 'OFFERED':
        actions.push(
          { label: 'Xác nhận tuyển dụng', action: () => updateCandidateStatus('HIRED'), color: 'bg-green-600 hover:bg-green-700' },
          { label: 'Không tuyển', action: () => updateCandidateStatus('NOT_HIRED'), color: 'bg-red-600 hover:bg-red-700' }
        );
        break;
    }

    return actions;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy thông tin ứng viên</p>
      </div>
    );
  }

  const StatusIcon = statusLabels[candidate.status]?.icon || FileText;
  const availableActions = getAvailableActions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/candidates')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Chi tiết ứng viên</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {availableActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${action.color}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate Info */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{candidate.full_name}</h2>
                  <p className="text-gray-600">Ứng viên</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusLabels[candidate.status].color}`}>
                  <StatusIcon className="w-4 h-4 mr-2" />
                  {statusLabels[candidate.status].label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{candidate.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p className="font-medium text-gray-900">{candidate.phone}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Vị trí ứng tuyển</p>
                    <p className="font-medium text-gray-900">{candidate.position?.title}</p>
                    <p className="text-sm text-gray-500">{candidate.position?.department}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Ngày nộp hồ sơ</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(candidate.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {candidate.cv_url && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">CV/Resume</p>
                      <p className="font-medium text-gray-900">Tài liệu đính kèm</p>
                    </div>
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Tải xuống</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interview History */}
          {candidate.interviews && candidate.interviews.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử phỏng vấn</h3>
              <div className="space-y-4">
                {candidate.interviews.map((interview) => (
                  <div key={interview.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Phỏng vấn bởi {interview.interviewer?.full_name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {format(new Date(interview.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${interviewResultLabels[interview.result].color}`}>
                        {interviewResultLabels[interview.result].label}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Đánh giá kỹ thuật:</p>
                        <p className="text-sm text-gray-600 mt-1">{interview.tech_notes}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Đánh giá kỹ năng mềm:</p>
                        <p className="text-sm text-gray-600 mt-1">{interview.soft_notes}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision History */}
          {candidate.decisions && candidate.decisions.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử quyết định</h3>
              <div className="space-y-4">
                {candidate.decisions.map((decision) => (
                  <div key={decision.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Quyết định bởi {decision.decider?.full_name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {format(new Date(decision.decided_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        decision.decision === 'HIRE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {decision.decision === 'HIRE' ? 'Tuyển dụng' : 'Không tuyển'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{decision.decision_notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hành động nhanh</h3>
            <div className="space-y-3">
              {availableActions.length > 0 ? (
                availableActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${action.color}`}
                  >
                    {action.label}
                  </button>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Không có hành động khả dụng</p>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Nộp hồ sơ</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(candidate.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </p>
                </div>
              </div>
              
              {candidate.interviews?.map((interview, index) => (
                <div key={interview.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phỏng vấn</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(interview.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                  </div>
                </div>
              ))}
              
              {candidate.decisions?.map((decision) => (
                <div key={decision.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    decision.decision === 'HIRE' ? 'bg-green-600' : 'bg-red-600'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {decision.decision === 'HIRE' ? 'Quyết định tuyển' : 'Quyết định không tuyển'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(decision.decided_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decision Form Modal */}
      {showDecisionForm && (
        <DecisionForm
          candidateId={candidate.id}
          onSuccess={() => {
            setShowDecisionForm(false);
            loadCandidate(candidate.id);
          }}
          onCancel={() => setShowDecisionForm(false)}
        />
      )}
    </div>
  );
}
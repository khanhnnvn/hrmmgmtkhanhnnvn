import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Search, Filter, Download, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DatabaseService } from '../../lib/database';
import { useAuth } from '../../contexts/AuthContext';
import type { CandidateWithDetails } from '../../types/database';
import toast from 'react-hot-toast';

const statusLabels = {
  SUBMITTED: { label: 'Mới nộp', color: 'bg-blue-100 text-blue-800' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
  INTERVIEW: { label: 'Phỏng vấn', color: 'bg-yellow-100 text-yellow-800' },
  OFFERED: { label: 'Đã đề xuất', color: 'bg-purple-100 text-purple-800' },
  HIRED: { label: 'Đã tuyển', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-800' },
  NOT_HIRED: { label: 'Không tuyển', color: 'bg-red-100 text-red-800' },
};

export function CandidateList() {
  const { user, role } = useAuth();
  const [candidates, setCandidates] = useState<CandidateWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    console.log('CandidateList: Loading candidates...');
    console.log('Current user:', user);
    console.log('Current role:', role);
    
    try {
      const data = await DatabaseService.getCandidates();
      console.log('CandidateList: Loaded candidates:', data.length);
      setCandidates(data);
    } catch (error) {
      console.error('CandidateList: Error loading candidates:', error);
      
      let errorMessage = 'Không thể tải danh sách ứng viên';
      if (error instanceof Error) {
        if (error.message.includes('phân quyền') || error.message.includes('42501')) {
          errorMessage = 'Lỗi phân quyền: Vui lòng đăng nhập lại với tài khoản HR hoặc Admin';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Lỗi kết nối: Vui lòng kiểm tra internet và thử lại';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.position?.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || candidate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidates(filteredCandidates.map(c => c.id));
    } else {
      setSelectedCandidates([]);
    }
  };

  const handleSelectCandidate = (candidateId: string, checked: boolean) => {
    if (checked) {
      setSelectedCandidates(prev => [...prev, candidateId]);
    } else {
      setSelectedCandidates(prev => prev.filter(id => id !== candidateId));
    }
  };

  const handleBulkApprove = async () => {
    try {
      await Promise.all(
        selectedCandidates.map(id => 
          DatabaseService.updateCandidate(id, { status: 'APPROVED' })
        )
      );
      await loadCandidates();
      setSelectedCandidates([]);
      toast.success(`Đã duyệt ${selectedCandidates.length} ứng viên`);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi duyệt ứng viên');
    }
  };

  const handleBulkReject = async () => {
    try {
      await Promise.all(
        selectedCandidates.map(id => 
          DatabaseService.updateCandidate(id, { status: 'REJECTED' })
        )
      );
      await loadCandidates();
      setSelectedCandidates([]);
      toast.success(`Đã từ chối ${selectedCandidates.length} ứng viên`);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi từ chối ứng viên');
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Quản lý ứng viên</h1>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-5 h-5" />
            <span>Xuất Excel</span>
          </button>
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
                placeholder="Tìm kiếm ứng viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="ALL">Tất cả trạng thái</option>
                {Object.entries(statusLabels).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedCandidates.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                Đã chọn {selectedCandidates.length} ứng viên
              </span>
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Duyệt tất cả
              </button>
              <button
                onClick={handleBulkReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Từ chối tất cả
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Họ và tên</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Liên hệ</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Vị trí ứng tuyển</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Trạng thái</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Ngày nộp</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCandidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.includes(candidate.id)}
                      onChange={(e) => handleSelectCandidate(candidate.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{candidate.full_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{candidate.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{candidate.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{candidate.position?.title}</div>
                    <div className="text-sm text-gray-500">{candidate.position?.department}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[candidate.status].color}`}>
                      {statusLabels[candidate.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(candidate.created_at), 'dd/MM/yyyy', { locale: vi })}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/candidates/${candidate.id}`}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Xem chi tiết</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCandidates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy ứng viên nào</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{candidates.length}</div>
            <div className="text-sm text-gray-500">Tổng ứng viên</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {candidates.filter(c => c.status === 'SUBMITTED').length}
            </div>
            <div className="text-sm text-gray-500">Mới nộp</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {candidates.filter(c => c.status === 'INTERVIEW').length}
            </div>
            <div className="text-sm text-gray-500">Phỏng vấn</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {candidates.filter(c => c.status === 'HIRED').length}
            </div>
            <div className="text-sm text-gray-500">Đã tuyển</div>
          </div>
        </div>
      </div>
    </div>
  );
}
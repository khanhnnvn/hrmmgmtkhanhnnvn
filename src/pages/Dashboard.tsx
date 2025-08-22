import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  TrendingUp,
  FileText,
  CheckCircle,
  UserPlus,
  Activity
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DatabaseService } from '../lib/database';
import type { StatisticsData } from '../types/database';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const statusLabels: Record<string, string> = {
  SUBMITTED: 'Mới nộp',
  APPROVED: 'Đã duyệt', 
  INTERVIEW: 'Phỏng vấn',
  OFFERED: 'Đã đề xuất',
  HIRED: 'Đã tuyển',
  REJECTED: 'Từ chối',
  NOT_HIRED: 'Không tuyển'
};

const resultLabels: Record<string, string> = {
  PASS: 'Đạt',
  FAIL: 'Không đạt',
  PENDING: 'Đang xử lý'
};

export function Dashboard() {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const data = await DatabaseService.getStatistics();
      setStats(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không thể tải dữ liệu thống kê</p>
      </div>
    );
  }

  const statisticsCards = [
    {
      title: 'Tổng ứng viên',
      value: stats.totalCandidates,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Ứng viên mới',
      value: stats.submittedCandidates,
      icon: FileText,
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Đang phỏng vấn',
      value: stats.interviewCandidates,
      icon: Calendar,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Đã tuyển dụng',
      value: stats.hiredCandidates,
      icon: CheckCircle,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Tổng phỏng vấn',
      value: stats.totalInterviews,
      icon: UserCheck,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Phỏng vấn đạt',
      value: stats.passedInterviews,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Nhân viên mới',
      value: stats.newEmployees,
      icon: UserPlus,
      color: 'bg-rose-500',
      bgColor: 'bg-rose-50'
    },
    {
      title: 'Tỷ lệ đạt PV',
      value: stats.totalInterviews > 0 ? Math.round((stats.passedInterviews / stats.totalInterviews) * 100) + '%' : '0%',
      icon: Activity,
      color: 'bg-cyan-500',
      bgColor: 'bg-cyan-50'
    }
  ];

  const pieData = stats.statusDistribution.map(item => ({
    name: statusLabels[item.status] || item.status,
    value: item.count,
    percentage: item.percentage
  }));

  const barData = stats.interviewResults.map(item => ({
    name: resultLabels[item.result] || item.result,
    count: item.count,
    percentage: item.percentage
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Cập nhật lúc: {new Date().toLocaleString('vi-VN')}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statisticsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`${card.bgColor} rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố trạng thái ứng viên</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Interview Results Bar Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kết quả phỏng vấn</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} (${barData.find(d => d.count === value)?.percentage}%)`,
                    'Số lượng'
                  ]}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Không có dữ liệu phỏng vấn
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt hệ thống</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalCandidates}</div>
            <div className="text-gray-600">Tổng ứng viên trong hệ thống</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.totalInterviews}</div>
            <div className="text-gray-600">Cuộc phỏng vấn đã thực hiện</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.newEmployees}</div>
            <div className="text-gray-600">Nhân viên mới trong tháng</div>
          </div>
        </div>
      </div>
    </div>
  );
}
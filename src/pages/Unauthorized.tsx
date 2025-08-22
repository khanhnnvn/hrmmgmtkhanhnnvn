import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Không có quyền truy cập</h1>
          <p className="mt-4 text-gray-600">
            Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên để được hỗ trợ.
          </p>
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Về trang chủ</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
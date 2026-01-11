import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  // [QUAN TRỌNG] Kiểm tra token thật sự tồn tại trong kho lưu trữ
  const token = localStorage.getItem('token');

  // Nếu có token -> Cho vào (Outlet), Không có -> Đá về Login
  return token ? <Outlet /> : <Navigate to="/" replace />;
};

export default PrivateRoute;

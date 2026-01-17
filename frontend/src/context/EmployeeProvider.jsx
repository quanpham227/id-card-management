import React, { useState, useCallback, useEffect } from 'react';
import { notification } from 'antd';
import axiosClient from '../api/axiosClient';
// Import Context từ file EmployeeContext.js
import { EmployeeContext } from './EmployeeContext';

export const EmployeeProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [source, setSource] = useState('online');
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    // Reset lỗi cũ mỗi lần gọi mới
    setSource('online');

    try {
      const response = await axiosClient.get('/employees');

      // Chỉ lấy data từ server, không quan tâm backup
      const serverData = response.data.data || [];

      setEmployees(serverData);
      setIsLoaded(true);
      return { data: serverData };
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);

      // Xóa dữ liệu cũ đi (No Backup Strategy)
      setEmployees([]);
      setSource('error');

      // --- 1. PHÂN LOẠI LỖI CHUẨN XÁC HƠN ---
      let errorMsg = 'Máy chủ gặp sự cố.';

      // Nếu Backend trả về 503 (như code Python bạn vừa sửa)
      if (err.response && err.response.status === 503) {
        errorMsg = 'Hệ thống HR mất kết nối (503).';
      }
      // Nếu lỗi mạng (rớt Wifi/Dây mạng)
      else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMsg = 'Không có kết nối Internet.';
      }

      // --- 2. THÊM KEY ĐỂ CHỐNG SPAM THÔNG BÁO ---
      notification.error({
        key: 'fetch_employee_error', // <--- QUAN TRỌNG: Chỉ hiện 1 thông báo duy nhất
        message: 'Tải dữ liệu thất bại',
        description: `${errorMsg} Vui lòng kiểm tra lại đường truyền.`,
        duration: 5, // Tự tắt sau 5 giây
      });

      return { data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return (
    <EmployeeContext.Provider value={{ employees, loading, fetchEmployees, isLoaded, source }}>
      {children}
    </EmployeeContext.Provider>
  );
};

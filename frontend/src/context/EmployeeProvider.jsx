import React, { useState, useCallback, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { notification } from 'antd';
import { EmployeeContext } from './EmployeeContext'; // Import từ file 1

export const EmployeeProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchEmployees = useCallback(async (force = false) => {
    if (isLoaded && !force && employees.length > 0) return employees;

    setLoading(true);
    try {
      const response = await axiosClient.get('/api/employees');
      const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setEmployees(data);
      setIsLoaded(true);
      return data;
    } catch {
      notification.error({
        title: 'Lỗi đồng bộ HR',
        description: 'Không thể lấy danh sách nhân viên.',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [isLoaded, employees]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return (
    <EmployeeContext.Provider value={{ employees, loading, fetchEmployees, isLoaded }}>
      {children}
    </EmployeeContext.Provider>
  );
};
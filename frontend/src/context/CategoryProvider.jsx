import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosClient from '../api/axiosClient';

// 1. Tạo Context
const CategoryContext = createContext();

// 2. Tạo Provider
export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Hàm gọi API lấy danh sách (dùng chung cho cả App)
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/categories');
      if (Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tải dữ liệu ngay lần đầu mở App
  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <CategoryContext.Provider value={{ categories, fetchCategories, loading }}>
      {children}
    </CategoryContext.Provider>
  );
};

// 3. Custom Hook để dùng cho gọn
// [FIX LỖI]: Thêm dòng này để ESLint không báo lỗi Fast Refresh cho Hook
// eslint-disable-next-line react-refresh/only-export-components
export const useCategories = () => useContext(CategoryContext);

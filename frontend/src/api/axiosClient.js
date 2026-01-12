// src/api/axiosClient.js
import axios from 'axios';
import { message } from 'antd';

// Create an Axios instance
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- 1. INTERCEPTOR REQUEST ---
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- 2. INTERCEPTOR RESPONSE (ĐÃ SỬA) ---
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config; // Lấy thông tin request gốc

    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        // [FIX LỖI QUAN TRỌNG]
        // Nếu lỗi 401 xảy ra khi đang gọi API login -> KHÔNG redirect, trả về lỗi để trang Login tự xử lý
        if (originalRequest.url && originalRequest.url.includes('/login')) {
          return Promise.reject(error);
        }

        // Trường hợp còn lại: Đang dùng app mà hết hạn Token -> Mới đá ra ngoài
        message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Sửa thành '/' nếu trang Login của bạn là trang chủ
        window.location.href = '/';
      } else if (status === 403) {
        message.error('Bạn không có quyền thực hiện thao tác này.');
      } else if (status === 404) {
        console.warn('Resource not found (404).');
      } else if (status === 500) {
        message.error('Lỗi máy chủ (500). Vui lòng liên hệ Admin.');
      } else {
        message.error(error.response.data?.detail || 'Đã xảy ra lỗi.');
      }
    } else if (error.request) {
      console.error('Network Error:', error.request);
      message.error('Lỗi mạng: Không thể kết nối đến Server.');
    } else {
      console.error('Error:', error.message);
      message.error('Lỗi không xác định.');
    }

    return Promise.reject(error);
  }
);

export default axiosClient;

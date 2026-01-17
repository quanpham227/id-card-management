// src/api/axiosClient.js
import axios from 'axios';
import { notification, message } from 'antd'; // Import thêm notification

// --- CẤU HÌNH API (GIỮ NGUYÊN 100%) ---
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- 1. INTERCEPTOR REQUEST (GIỮ NGUYÊN) ---
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

// --- 2. INTERCEPTOR RESPONSE (ĐÃ TỐI ƯU HÓA) ---
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    // [MỚI] 1. Kiểm tra cờ "Bỏ qua lỗi chung"
    // Nếu request nào gửi kèm { skipGlobalError: true } thì Global Handler này sẽ im lặng
    if (originalRequest && originalRequest.skipGlobalError) {
      return Promise.reject(error);
    }

    // [MỚI] 2. Xử lý Lỗi Mất Mạng (Offline) - Chỉ hiện 1 thông báo duy nhất
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      notification.error({
        key: 'global_network_error', // <--- Key chống spam
        message: 'Lỗi kết nối',
        description: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra Internet.',
        duration: 5,
      });
      return Promise.reject(error);
    }

    // 3. Xử lý các lỗi có phản hồi từ Server (HTTP Status Code)
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        // [Logic cũ giữ nguyên] Không redirect nếu đang ở trang login
        if (originalRequest.url && originalRequest.url.includes('/login')) {
          return Promise.reject(error);
        }

        // Dùng key để tránh hiện 2-3 thông báo "Hết hạn" cùng lúc
        notification.warning({
          key: 'session_expired',
          message: 'Phiên đăng nhập hết hạn',
          description: 'Vui lòng đăng nhập lại để tiếp tục.',
        });

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      } else if (status === 403) {
        message.error('Bạn không có quyền thực hiện thao tác này.');
      } else if (status === 404) {
        // 404 thường không cần thông báo ầm ĩ cho user, log warning là đủ
        console.warn('API Resource not found (404):', originalRequest.url);
      } else if (status >= 500) {
        // [MỚI] Gom nhóm lỗi 500, 502, 503 thành lỗi hệ thống
        notification.error({
          key: 'server_error', // <--- Key chống spam
          message: 'Lỗi hệ thống',
          description: `Máy chủ gặp sự cố (${status}). Vui lòng thử lại sau.`,
        });
      } else {
        // Các lỗi logic khác (400, 422...)
        message.error(error.response.data?.detail || 'Đã xảy ra lỗi xử lý.');
      }
    }
    // Trường hợp lỗi lạ khác
    else {
      console.error('Error Message:', error.message);
      message.error('Lỗi không xác định.');
    }

    return Promise.reject(error);
  }
);

export default axiosClient;

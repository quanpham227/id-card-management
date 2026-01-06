import { notification } from 'antd';

// Lấy URL từ biến môi trường, fallback về localhost nếu không tìm thấy
const API_URL = import.meta.env.VITE_API_URL || '';
/**
 * Hàm gửi log in ấn lên Server
 * @param {Array} employeesList - Danh sách nhân viên đang được in
 */
export const logPrintHistory = async (employeesList) => {
  if (!employeesList || employeesList.length === 0) return;

  // 1. Chuẩn hóa dữ liệu theo đúng Model Python (PrintLogRequest)
  const payload = employeesList.map(emp => ({
    employee_id: emp.employee_id,
    employee_name: emp.employee_name,
    employee_type: emp.employee_type || 'Staff', // Mặc định Staff nếu thiếu
    maternity_type: emp.maternity_type || '',    // Mặc định rỗng nếu thiếu
    printed_at: new Date().toISOString()         // Thời gian hiện tại ISO 8601
  }));

  try {
    // 2. Gọi API (Sử dụng fetch native để giảm phụ thuộc thư viện ngoài)
    const response = await fetch(`${API_URL}/log-print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Server returned error');
    }
    

  } catch (error) {
    // 3. Xử lý lỗi "nhẹ nhàng" (Silent fail)
    // Log thất bại không nên làm gián đoạn trải nghiệm in của người dùng
    console.error("Failed to log print history:", error);
    
    // Chỉ hiện thông báo nhỏ góc màn hình, không chặn UI
    notification.warning({
      message: 'Cảnh báo hệ thống',
      description: 'Không thể lưu lịch sử in. Vui lòng kiểm tra kết nối Server.',
      placement: 'bottomRight',
    });
  }
};
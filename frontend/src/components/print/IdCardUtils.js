// src/components/Print/IdCardUtils.js

/**
 * Hàm tính toán kích thước font chữ dựa trên độ dài tên
 * @param {string} name - Tên nhân viên
 * @returns {string} - Kích thước font (vd: '20px')
 */
export const getFontSize = (name) => {
  if (!name) return '20px';
  const len = name.length;

  // Tên cực dài (vd: Công Tằng Tôn Nữ...) -> Chữ nhỏ
  if (len > 25) return '13px'; 
  
  // Tên dài (vd: Nguyễn Thị Phương Thảo) -> Chữ vừa
  if (len > 18) return '15px'; 
  
  // Tên trung bình -> Chữ chuẩn
  if (len > 12) return '18px'; 
  
  // Tên ngắn (vd: Lê Văn A) -> Chữ to
  return '20px'; 
};
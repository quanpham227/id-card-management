// src/utils/permissions.js

// Danh sách các role có quyền Admin/Manager (Full quyền hệ thống)
const SUPER_ROLES = ['Admin', 'Manager']; 

// Danh sách các role có quyền Nhân sự (Admin + Manager + HR)
const HR_ROLES = [...SUPER_ROLES, 'HR'];

export const PERMISSIONS = {
  // 1. QUYỀN CAO NHẤT (Quản lý User, Xóa sửa Tài sản, Cấu hình hệ thống)
  // Dành cho: Admin, Manager, IT
  IS_ADMIN: (role) => SUPER_ROLES.includes(role),

  // 2. QUYỀN NHÂN SỰ (Thêm/Sửa/Xóa Nhân viên)
  // Dành cho: Admin, Manager, IT, HR
  CAN_MANAGE_EMPLOYEES: (role) => HR_ROLES.includes(role),

  // 3. QUYỀN UPLOAD ẢNH & IN THẺ
  // Dành cho: Admin, Manager, IT, HR (Staff không được làm)
  CAN_OPERATE: (role) => HR_ROLES.includes(role),

  // 4. QUYỀN CHỈ XEM (Dành cho tất cả mọi người, kể cả Staff)
  CAN_VIEW: (role) => ['Admin', 'Manager', 'IT', 'HR', 'Staff', 'User'].includes(role),
};
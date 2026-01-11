// 1. ĐỊNH NGHĨA ROLES (Chỉ 4 Role khớp với Database)
export const ROLES = {
  ADMIN: 'Admin', // Đây chính là IT / System Creator / Quyền cao nhất
  MANAGER: 'Manager', // Sếp / Quản lý chung
  HR: 'HR', // Nhân sự
  STAFF: 'Staff', // Nhân viên
};

// 2. NHÓM QUYỀN (ROLE GROUPS)

// Nhóm "Trùm cuối" (System Owners): Chỉ duy nhất ADMIN (IT)
const SYSTEM_ADMINS = [ROLES.ADMIN];

// Nhóm quản lý Kỹ thuật (Tech Managers): ADMIN (Làm) và MANAGER (Xem/Giám sát)
const TECH_MANAGERS = [ROLES.ADMIN, ROLES.MANAGER];

// Nhóm thao tác Nhân sự (HR Ops): HR là chính, ADMIN và MANAGER có quyền hỗ trợ
const HR_OPERATORS = [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER];

export const PERMISSIONS = {
  // --- A. QUYỀN HỆ THỐNG (SYSTEM) ---
  // Dùng cho: Menu "SYSTEM ADMIN" (Users, Categories) và "Ticket Settings"
  // Logic: Chỉ ADMIN (IT) mới thấy
  IS_SYSTEM_ADMIN: (role) => SYSTEM_ADMINS.includes(role),

  // --- B. QUYỀN NHÂN SỰ (HR) ---
  // Xem cơ bản: Tất cả
  CAN_VIEW_HR_BASIC: () => true,

  // Thao tác dữ liệu (Upload, In, Sửa NV): ADMIN, HR, MANAGER
  CAN_MANAGE_HR_DATA: (role) => HR_OPERATORS.includes(role),

  // --- C. QUYỀN TÀI SẢN (ASSETS) ---
  // Xem menu "IT ASSETS": ADMIN (IT) và MANAGER
  CAN_VIEW_ASSETS: (role) => TECH_MANAGERS.includes(role),

  // Sửa/Xóa tài sản: Thường thì MANAGER chỉ xem, chỉ ADMIN (IT) mới sửa
  // Nếu bạn muốn Manager cũng sửa được thì thêm vào mảng này
  CAN_MANAGE_ASSETS: (role) => [ROLES.ADMIN].includes(role),

  // --- D. QUYỀN TICKET ---
  // Tạo ticket: Tất cả
  CAN_CREATE_TICKET: () => true,

  // Quản lý ticket (Assign, Resolve, Reports): ADMIN (IT) và MANAGER
  CAN_MANAGE_TICKET: (role) => TECH_MANAGERS.includes(role),
};

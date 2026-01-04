const SUPER_ROLES = ['Admin', 'Manager'];
const HR_ROLES = ['Admin', 'Manager', 'HR'];

export const PERMISSIONS = {
  // Quyền can thiệp hệ thống (Chỉ Admin/Manager)
  IS_ADMIN: (role) => SUPER_ROLES.includes(role),

  // Quyền CRUD & In ấn (Admin, Manager, HR)
  // Đặt tên này để khớp với component của bạn đang gọi
  CAN_OPERATE: (role) => HR_ROLES.includes(role),

  // Quyền CRUD nhân sự (Dùng cho các nút Edit/Delete)
  CAN_EDIT_HR: (role) => HR_ROLES.includes(role),

  // Quyền Thao tác IT (Chỉ Admin/Manager/IT)
  CAN_EDIT_IT: (role) => ['Admin', 'Manager', 'IT'].includes(role),

  // Quyền xem (Tất cả Role hợp lệ)
  CAN_VIEW_ALL: (role) => ['Admin', 'Manager', 'HR', 'IT', 'Staff'].includes(role),

  // Quyền Download/Export (Cho phép cả Staff)
  CAN_DOWNLOAD: (role) => ['Admin', 'Manager', 'HR', 'IT', 'Staff'].includes(role),
};
export const PRIORITY_LEVELS = {
  1: {
    label: 'LOW',
    color: 'green',
    desc: 'Yêu cầu nhỏ, không ảnh hưởng công việc',
    sla: '48h', // <--- Thêm dòng này
  },
  2: {
    label: 'MEDIUM',
    color: 'blue',
    desc: 'Hỗ trợ tiêu chuẩn, ảnh hưởng 1 người',
    sla: '24h', // <--- Thêm dòng này
  },
  3: {
    label: 'HIGH',
    color: 'orange',
    desc: 'Vấn đề khẩn cấp, ảnh hưởng nhóm/phòng ban',
    sla: '8h', // <--- Thêm dòng này
  },
  4: {
    label: 'CRITICAL',
    color: 'red',
    desc: 'Hệ thống ngưng hoạt động (Service Down)',
    sla: '4h', // <--- Thêm dòng này
  },
};

export const TICKET_STATUS = {
  open: { label: 'Open', status: 'error' },
  'in progress': { label: 'In Progress', status: 'processing' },
  resolved: { label: 'Resolved', status: 'success' },
  cancelled: { label: 'Cancelled', status: 'default' },
};

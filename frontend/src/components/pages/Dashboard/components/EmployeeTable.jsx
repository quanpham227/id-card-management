import React from 'react';
import { Table, Tag, Typography, Button, Tooltip } from 'antd';
import { 
  PrinterOutlined, 
  ManOutlined, 
  WomanOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  HeartOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

const EmployeeTable = ({ dataSource, loading, onPrint, rowSelection }) => {
  
  // Hàm tạo danh sách bộ lọc duy nhất từ dữ liệu
  const generateFilters = (dataIndex) => {
    if (!dataSource) return [];
    const uniqueValues = [...new Set(dataSource.map(item => item[dataIndex]).filter(Boolean))];
    return uniqueValues.map(value => ({ text: value, value }));
  };

  const columns = [
    // --- 1. THÔNG TIN CỐ ĐỊNH (BÊN TRÁI) ---
    { 
      title: 'Mã NV', 
      dataIndex: 'employee_id',
      width: 100, 
      fixed: 'left',
      render: (id) => <Text strong copyable>{id}</Text>,
      sorter: (a, b) => a.employee_id.localeCompare(b.employee_id),
    },
    { 
      title: 'Họ và Tên', 
      dataIndex: 'employee_name', 
      width: 200, 
      fixed: 'left', 
      render: (name) => <Text strong>{name}</Text>,
      sorter: (a, b) => a.employee_name.localeCompare(b.employee_name),
    },

    // --- 2. TRẠNG THÁI HỆ THỐNG ---
    {
      title: 'Lần In Cuối',
      dataIndex: 'last_printed_at',
      width: 120,
      align: 'center',
      render: (date) => {
        if (!date) return <Tag color="default">Chưa in</Tag>;
        return (
          <Tooltip title={dayjs(date).format('DD/MM/YYYY HH:mm:ss')}>
            <Tag icon={<CheckCircleOutlined />} color="success">
              {dayjs(date).format('DD/MM/YYYY')}
            </Tag>
          </Tooltip>
        );
      },
    },
    { 
      title: 'Trạng Thái', 
      dataIndex: 'employee_status', 
      width: 110, 
      align: 'center',
      render: (s) => <Tag color={s === 'Active' ? 'success' : 'error'}>{s?.toUpperCase()}</Tag>,
      filters: [
        { text: 'ACTIVE', value: 'Active' },
        { text: 'INACTIVE', value: 'Inactive' },
      ],
      onFilter: (value, record) => record.employee_status === value,
    },

    // --- 3. THÔNG TIN CÔNG VIỆC (THÊM BỘ LỌC) ---
    { 
      title: 'Bộ Phận', 
      dataIndex: 'employee_department', 
      width: 150, 
      render: (dept) => <Tag color="geekblue">{dept}</Tag>,
      // Lọc theo bộ phận
      filters: generateFilters('employee_department'),
      filterSearch: true, // Cho phép tìm kiếm trong danh sách lọc
      onFilter: (value, record) => record.employee_department === value,
    },
    { 
      title: 'Chức Vụ', 
      dataIndex: 'employee_position', 
      width: 180, 
      ellipsis: true 
    },
    { 
      title: 'Loại NV', 
      dataIndex: 'employee_type', 
      width: 90,
      // Lọc theo loại nhân viên (Staff/Worker...)
      filters: generateFilters('employee_type'),
      onFilter: (value, record) => record.employee_type === value,
    },

    // --- 4. THÔNG TIN NHÂN THÂN ---
    { 
      title: 'Giới Tính', 
      dataIndex: 'employee_gender', 
      width: 100, 
      align: 'center',
      render: (g) => g === 'Nam' 
          ? <Tag icon={<ManOutlined />} color="blue">Nam</Tag> 
          : <Tag icon={<WomanOutlined />} color="magenta">Nữ</Tag>,
      filters: [
        { text: 'Nam', value: 'Nam' },
        { text: 'Nữ', value: 'Nữ' },
      ],
      onFilter: (value, record) => record.employee_gender === value,
    },
    { 
      title: 'Ngày Sinh', 
      dataIndex: 'employee_birth_date', 
      width: 110, 
      align: 'center' 
    },

    // --- 5. CHI TIẾT THAI SẢN (ĐÃ BỔ SUNG FILTER) ---
    {
      title: 'Chế Độ Thai Sản',
      dataIndex: 'maternity_type',
      width: 150,
      render: (type) => {
        if (!type || type === "Normal" || type === "") return "-";
        return <Tag icon={<HeartOutlined />} color="magenta">{type}</Tag>;
      },
      // [BỔ SUNG MỚI] - Tự động tạo bộ lọc dựa trên dữ liệu có sẵn
      filters: generateFilters('maternity_type'),
      onFilter: (value, record) => record.maternity_type === value,
    },
    { title: 'Bắt Đầu TS', dataIndex: 'maternity_begin', width: 110, align: 'center' },
    { title: 'Kết Thúc TS', dataIndex: 'maternity_end', width: 110, align: 'center' },

    // --- 6. CHI TIẾT HỢP ĐỒNG (THÊM BỘ LỌC) ---
    { title: 'Ngày Vào Làm', dataIndex: 'employee_join_date', width: 110, align: 'center' },
    { title: 'Ngày Nghỉ Việc', dataIndex: 'employee_left_date', width: 110, align: 'center', render: (d) => d || '-' },
    { 
      title: 'Loại HĐ', 
      dataIndex: 'contract_type', 
      width: 180, 
      ellipsis: true,
      // Lọc theo loại hợp đồng
      filters: generateFilters('contract_type'),
      filterSearch: true,
      onFilter: (value, record) => record.contract_type === value,
    },
    { title: 'Số Hợp Đồng', dataIndex: 'contract_id', width: 140 },
    { title: 'HĐ Bắt Đầu', dataIndex: 'contract_begin', width: 110, align: 'center' },
    { title: 'HĐ Kết Thúc', dataIndex: 'contract_end', width: 110, align: 'center' },

    // --- 7. THÔNG TIN PHỤ ---
    { 
      title: 'Mã Cũ', 
      dataIndex: 'employee_old_id',
      width: 100, 
      render: (id) => id || '-',
    },

    // --- 8. NÚT IN (CỐ ĐỊNH PHẢI) ---
    {
      title: 'In',
      key: 'action',
      fixed: 'right', 
      width: 70,
      align: 'center',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<PrinterOutlined />} 
          size="small"
          disabled={record.employee_status !== 'Active'}
          onClick={(e) => { e.stopPropagation(); onPrint(record); }} 
        />
      ),
    },
  ];

  return (
    <Table 
      rowSelection={rowSelection}
      columns={columns} 
      dataSource={dataSource} 
      loading={loading} 
      rowKey="employee_id" 
      pagination={{ 
        pageSize: 25, 
        showSizeChanger: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} nhân viên`,
      }} 
      bordered 
      size="small" 
      scroll={{ x: 2800, y: 'calc(100vh - 430px)' }} 
      style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden' }}
    />
  );
};

export default EmployeeTable;
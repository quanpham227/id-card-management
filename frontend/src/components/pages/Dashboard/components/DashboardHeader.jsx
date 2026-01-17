import React, { useState } from 'react';
import { Flex, Typography, Space, Button, Radio, Input, DatePicker, Badge } from 'antd';
import {
  ReloadOutlined,
  UserOutlined,
  SearchOutlined,
  PrinterOutlined,
  FileExcelOutlined,
  FileZipOutlined, // 🆕 Import Icon nén file cho nút tải ảnh
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const DashboardHeader = ({
  viewStatus,
  setViewStatus,
  searchText,
  setSearchText,
  onRefresh,
  loading,
  canCRUD, // Quyền Thêm/Sửa/Xóa

  // Các props lọc Ngày vào làm (Cũ)
  dateRange,
  setDateRange,

  // 🆕 Các props lọc Ngày nghỉ việc (Mới)
  resignationDateRange,
  setResignationDateRange,

  selectedCount = 0,
  onBulkPrint,
  onExport, // Hàm xuất Excel
  canPrint, // Quyền In ấn/Xuất file

  // 🆕 PROPS CHO NÚT DOWNLOAD ẢNH
  onDownloadImages,
  isDownloadingImages,
}) => {
  // State để xử lý hover cho nút Excel (Vì inline style không hỗ trợ pseudo-class)
  const [isExcelHovered, setIsExcelHovered] = useState(false);

  return (
    <Flex
      vertical
      gap="middle"
      style={{
        marginBottom: 20,
        background: '#fff',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* HÀNG 1: Tiêu đề và Các nút hành động */}
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
        <Flex vertical gap={0}>
          <Title level={4} style={{ margin: 0 }}>
            {viewStatus === 'Active'
              ? 'Active Employees'
              : viewStatus === 'All'
                ? 'All Employees'
                : 'Resigned Employees'}
          </Title>
          <Text type="secondary">Data source: HR System (Live)</Text>
        </Flex>

        <Space wrap>
          {/* KHU VỰC NÚT XUẤT FILE (Chỉ hiện nếu có quyền) */}
          {canPrint && (
            <>
              {/* 1. NÚT DOWNLOAD PHOTOS (MỚI) */}
              <Button
                icon={<FileZipOutlined />}
                onClick={onDownloadImages}
                loading={isDownloadingImages} // Hiệu ứng xoay khi đang nén file
                style={{
                  borderColor: '#1890ff',
                  color: '#1890ff',
                }}
              >
                Download Photos
              </Button>

              {/* 2. NÚT XUẤT EXCEL (CŨ) */}
              <Button
                icon={<FileExcelOutlined />}
                onClick={onExport}
                // Xử lý sự kiện chuột để tạo hiệu ứng Hover
                onMouseEnter={() => setIsExcelHovered(true)}
                onMouseLeave={() => setIsExcelHovered(false)}
                style={{
                  // Logic đổi màu khi hover
                  backgroundColor: isExcelHovered ? '#1b5e2e' : '#217346',
                  borderColor: isExcelHovered ? '#1b5e2e' : '#217346',
                  color: '#fff',
                  transition: 'all 0.3s',
                }}
              >
                Export Excel
              </Button>
            </>
          )}

          {/* 3. NÚT IN HÀNG LOẠT */}
          {selectedCount > 0 && (
            <Button
              type="primary"
              danger
              icon={<PrinterOutlined />}
              onClick={onBulkPrint}
              style={{ boxShadow: '0 2px 4px rgba(255, 77, 79, 0.3)' }}
            >
              Print {selectedCount} Selected
            </Button>
          )}

          {/* 4. NÚT REFRESH */}
          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
            Refresh
          </Button>

          {/* 5. RADIO GROUP TRẠNG THÁI */}
          <Radio.Group
            value={viewStatus}
            onChange={(e) => setViewStatus(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="Active">Active</Radio.Button>
            <Radio.Button value="Resign">Resigned</Radio.Button>
            <Radio.Button value="All">All</Radio.Button>
          </Radio.Group>

          {/* 6. NÚT THÊM NHÂN VIÊN */}
          <Button type="primary" icon={<UserOutlined />} disabled={!canCRUD}>
            Add Employee
          </Button>
        </Space>
      </Flex>

      {/* HÀNG 2: Bộ lọc ngày và Tìm kiếm */}
      <Flex gap="middle" wrap="wrap">
        {/* Bộ lọc 1: Ngày vào làm */}
        <RangePicker
          placeholder={['Join From', 'To Date']}
          format="DD/MM/YYYY"
          value={dateRange}
          onChange={(dates) => setDateRange(dates)}
          style={{ minWidth: 220 }}
          size="large"
          allowClear
        />

        {/* 🆕 Bộ lọc 2: Ngày nghỉ việc */}
        <RangePicker
          placeholder={['Resign From', 'To Date']}
          format="DD/MM/YYYY"
          value={resignationDateRange}
          onChange={(dates) => setResignationDateRange(dates)}
          style={{ minWidth: 220 }}
          size="large"
          allowClear
        />

        {/* Ô tìm kiếm */}
        <Input
          placeholder="Search by Name, ID or Department..."
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          size="large"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ borderRadius: '8px', flex: 1, minWidth: 250 }}
        />
      </Flex>
    </Flex>
  );
};

export default DashboardHeader;

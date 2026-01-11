import React from 'react';
import { Flex, Typography, Space, Button, Radio, Input, DatePicker, Badge } from 'antd';
import { ReloadOutlined, UserOutlined, SearchOutlined, PrinterOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker; // [MỚI] Lấy component chọn khoảng ngày

const DashboardHeader = ({
  viewStatus,
  setViewStatus,
  searchText,
  setSearchText,
  onRefresh,
  loading,
  canCRUD,
  // [MỚI] Nhận thêm các props từ cha truyền xuống
  dateRange,
  setDateRange,
  selectedCount = 0, // Mặc định là 0 nếu không truyền
  onBulkPrint,
}) => {
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
          {/* [MỚI] Nút In Hàng Loạt - Chỉ hiện khi có chọn dòng */}
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

          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
            Refresh
          </Button>

          <Radio.Group
            value={viewStatus}
            onChange={(e) => setViewStatus(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="Active">Active</Radio.Button>
            <Radio.Button value="Resign">Resigned</Radio.Button>
            {/* Thêm option All nếu cần lọc toàn bộ */}
            <Radio.Button value="All">All</Radio.Button>
          </Radio.Group>

          {/* Nút Add Employee cũ của bạn */}
          <Button type="primary" icon={<UserOutlined />} disabled={!canCRUD}>
            Add Employee
          </Button>
        </Space>
      </Flex>

      {/* HÀNG 2: Bộ lọc ngày và Tìm kiếm */}
      <Flex gap="middle" wrap="wrap">
        {/* [MỚI] Bộ lọc ngày tháng */}
        <RangePicker
          placeholder={['Join Date From', 'To Date']}
          format="DD/MM/YYYY"
          value={dateRange}
          onChange={(dates) => setDateRange(dates)}
          style={{ minWidth: 250 }}
          size="large"
        />

        {/* Ô tìm kiếm cũ */}
        <Input
          placeholder="Search by Name, ID or Department..."
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          size="large"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ borderRadius: '8px', flex: 1, minWidth: 300 }}
        />
      </Flex>
    </Flex>
  );
};

export default DashboardHeader;

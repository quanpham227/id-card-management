import React from 'react';
import { Table, Tag, Space, Button, Typography, Flex, Popconfirm, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, LaptopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

const AssetTable = ({ assets, loading, onEdit, onDelete, canEdit, onViewHistory }) => {
  // Helper to create filters dynamically
  const getFilters = (field, subField = null) => {
    const values = assets.map((a) => (subField ? a[field]?.[subField] : a[field])).filter(Boolean);
    return [...new Set(values)].map((v) => ({ text: v, value: v }));
  };

  const columns = [
    // --- 1. IDENTIFICATION (FIXED LEFT) ---
    {
      title: 'No',
      dataIndex: 'asset_code',
      width: 100,
      fixed: 'left',
      defaultSortOrder: 'ascend',
      sorter: (a, b) => a.asset_code.localeCompare(b.asset_code),
      render: (t) => (
        <Text strong style={{ color: '#1890ff', fontSize: '14px' }}>
          {t}
        </Text>
      ),
    },
    // EMPLOYEE ID COLUMN
    {
      title: 'Emp ID',
      dataIndex: ['assigned_to', 'employee_id'],
      width: 100,
      fixed: 'left',
      filters: getFilters('assigned_to', 'employee_id'),
      onFilter: (value, record) => record.assigned_to?.employee_id === value,
      render: (id) =>
        id ? (
          <Text
            strong
            style={{ fontSize: '14px', color: '#262626' }}
            copyable={{ tooltips: false }}
          >
            {id}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'User / Dept',
      dataIndex: 'assigned_to',
      width: 200,
      fixed: 'left',
      filters: getFilters('assigned_to', 'department'),
      onFilter: (value, record) => record.assigned_to?.department === value,
      render: (u) =>
        u ? (
          <Flex vertical gap={2}>
            <Text strong style={{ fontSize: '14px' }}>
              {u.employee_name}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {u.department}
            </Text>
          </Flex>
        ) : (
          <Tag color="default">Stock / Unassigned</Tag>
        ),
    },

    // --- 2. TYPE & MODEL (CẬP NHẬT LOGIC CATEGORY) ---
    {
      title: 'Type',
      key: 'category', // Không dùng dataIndex trực tiếp vì là object nested
      width: 100,
      // Tạo bộ lọc động dựa trên tên Category hiện có trong bảng
      filters: getFilters('category', 'name'),
      onFilter: (value, record) => record.category?.name === value,
      render: (_, record) => {
        // Lấy thông tin từ object category
        const catName = record.category?.name || 'Unknown';
        const catCode = record.category?.code; // VD: PC, LPT, PRT

        // Config màu sắc dựa trên Code
        const config = {
          PC: 'blue',
          LPT: 'purple', // Laptop
          TAB: 'cyan', // Tablet
          PRT: 'orange', // Printer
          MON: 'magenta', // Monitor
        };

        return (
          <Tag color={config[catCode] || 'default'} style={{ fontSize: '12px' }}>
            {catName}
          </Tag>
        );
      },
    },
    {
      title: 'Model',
      dataIndex: 'model',
      width: 120,
      ellipsis: true,
      render: (t) => <Text style={{ fontSize: '13px', color: '#262626' }}>{t}</Text>,
    },

    // --- 3. SPECS ---
    {
      title: 'CPU',
      dataIndex: ['specs', 'cpu'],
      width: 140,
      ellipsis: true,
      render: (t) => <Text style={{ fontSize: '14px', color: '#262626' }}>{t || '-'}</Text>,
    },
    {
      title: 'RAM',
      dataIndex: ['specs', 'ram'],
      width: 80,
      render: (t) => <Text style={{ fontSize: '14px', color: '#262626' }}>{t || '-'}</Text>,
    },
    {
      title: 'Disk',
      dataIndex: ['specs', 'storage'],
      width: 120,
      ellipsis: true,
      render: (t) => <Text style={{ fontSize: '14px', color: '#262626' }}>{t || '-'}</Text>,
    },

    // --- 5. STATUS & HEALTH ---
    {
      title: 'Status',
      dataIndex: 'usage_status',
      width: 90,
      align: 'center',
      filters: [
        { text: 'In Use', value: 'In Use' },
        { text: 'Spare', value: 'Spare' },
        { text: 'Broken', value: 'Broken' },
      ],
      onFilter: (value, record) => record.usage_status === value,
      render: (status) => {
        let color = 'default';
        let label = status || 'Spare';
        if (status === 'In Use') {
          color = 'processing';
        } else if (status === 'Spare') {
          color = 'success';
        } else if (status === 'Broken') {
          color = 'error';
        }

        return (
          <Tag
            color={color}
            style={{ fontSize: '11px', padding: '2px 8px', minWidth: '65px', textAlign: 'center' }}
          >
            {label.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Health',
      dataIndex: 'health_status',
      width: 90,
      align: 'center',
      filters: [
        { text: 'Good', value: 'Good' },
        { text: 'Warning', value: 'Warning' },
        { text: 'Critical', value: 'Critical' },
      ],
      onFilter: (value, record) => record.health_status === value,
      render: (h) => {
        let color = '#d9d9d9';

        if (h === 'Good') {
          color = '#389e0d';
        } else if (h === 'Warning') {
          color = '#d46b08';
        } else if (h === 'Critical') {
          color = '#cf1322';
        }

        return (
          <Tag
            color={color}
            style={{
              fontSize: '12px',
              width: '100%',
              textAlign: 'center',
              fontWeight: 600,
              border: 'none',
              color: '#fff',
            }}
          >
            {h}
          </Tag>
        );
      },
    },
    {
      title: 'OS',
      dataIndex: ['software', 'os'],
      width: 90,
      ellipsis: true,
      render: (t) => <Text style={{ fontSize: '14px', color: '#262626' }}>{t || '-'}</Text>,
    },
    // --- 4. ACCESSORIES ---
    {
      title: 'Monitor',
      dataIndex: ['monitor', 'model'],
      width: 120,
      ellipsis: true,
      filters: getFilters('monitor', 'model'),
      onFilter: (value, record) => record.monitor?.model === value,
      render: (t) =>
        t ? (
          <Space>
            <LaptopOutlined style={{ color: '#8c8c8c' }} />
            <span style={{ fontSize: '13px' }}>{t}</span>
          </Space>
        ) : (
          '-'
        ),
    },

    {
      title: 'Date',
      dataIndex: 'purchase_date',
      width: 100,
      align: 'center',
      render: (d) => (
        <Text type="secondary" style={{ fontSize: '13px' }}>
          {d ? dayjs(d).format('DD/MM/YY') : '-'}
        </Text>
      ),
    },

    // --- 6. ACTIONS (FIXED RIGHT) ---
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 100,
      align: 'center',
      render: (_, r) => (
        <Space size="small">
          <Tooltip title="View History">
            <Button
              type="default"
              size="small"
              icon={<EyeOutlined style={{ color: '#52c41a' }} />}
              onClick={() => onViewHistory(r)}
              style={{ borderColor: '#d9d9d9' }}
            />
          </Tooltip>

          {canEdit && (
            <>
              <Tooltip title="Edit Asset">
                <Button
                  type="primary"
                  ghost
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(r)}
                />
              </Tooltip>
              <Popconfirm
                title="Delete?"
                description="Cannot be undone."
                onConfirm={() => onDelete(r.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="primary" danger size="small" icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={assets}
      rowKey="id"
      loading={loading}
      size="small"
      scroll={{ x: 1600, y: 'calc(100vh - 300px)' }}
      style={{
        background: '#fff',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} assets`,
      }}
      bordered
    />
  );
};

export default AssetTable;

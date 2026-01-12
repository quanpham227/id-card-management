import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Select,
  Row,
  Col,
  message,
  Badge,
  Tooltip,
  Popconfirm, // <--- THÊM MỚI: Để hiện hộp thoại xác nhận xóa
} from 'antd';
import {
  ReloadOutlined,
  EyeOutlined,
  FilterOutlined,
  UserAddOutlined,
  ClockCircleOutlined,
  DeleteOutlined, // <--- THÊM MỚI: Icon xóa
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';
import { PRIORITY_LEVELS, TICKET_STATUS } from '../../../constants/constants';

const { Title, Text } = Typography;

const TicketManager = () => {
  const navigate = useNavigate();

  // Lấy thông tin user hiện tại để check quyền xóa
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canDelete = ['Admin', 'Manager'].includes(currentUser.role);

  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);

  // --- STATE QUẢN LÝ PHÂN TRANG ---
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // State cho bộ lọc
  const [filters, setFilters] = useState({
    status: 'All',
    priority: 'All',
  });

  // --- 1. Fetch Data ---
  const fetchTickets = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page: page,
        size: pageSize,
      };

      if (filters.status !== 'All') params.status = filters.status;
      if (filters.priority !== 'All') params.priority = filters.priority;

      const res = await axiosClient.get('/tickets/manage', { params });

      if (res && res.data) {
        setTickets(res.data.items || []);
        setPagination({
          current: res.data.page || 1,
          pageSize: res.data.size || 10,
          total: res.data.total || 0,
        });
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      message.error('Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(1, pagination.pageSize);
  }, [filters]);

  // --- 2. Xử lý khi người dùng bấm chuyển trang ---
  const handleTableChange = (newPagination) => {
    fetchTickets(newPagination.current, newPagination.pageSize);
  };

  // --- 3. Action: Assign to Me ---
  const handleAssignToMe = async (ticketId) => {
    try {
      await axiosClient.put(`/tickets/${ticketId}`, {
        assignee_id: currentUser.id,
        status: 'In Progress',
        resolution_note: 'Ticket has been claimed by IT Support.',
      });

      message.success('You have claimed this ticket!');
      fetchTickets(pagination.current, pagination.pageSize);
    } catch {
      message.error('Failed to assign ticket.');
    }
  };

  // --- 4. [THÊM MỚI] Action: Delete Ticket ---
  const handleDeleteTicket = async (ticketId) => {
    try {
      // Gọi API Delete: DELETE /api/tickets/{id}
      await axiosClient.delete(`/tickets/${ticketId}`);
      message.success('Ticket deleted successfully');

      // Load lại dữ liệu trang hiện tại
      fetchTickets(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Delete error:', error);
      message.error(error.response?.data?.detail || 'Failed to delete ticket');
    }
  };

  // --- Columns Definition ---
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      align: 'center',
      render: (id) => <Text code>#{id}</Text>,
    },
    {
      title: 'Subject & Requester',
      key: 'subject',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 15 }}>
            {record.title}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            By: {record.requester?.full_name || 'Unknown'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (p) => {
        const info = PRIORITY_LEVELS[p] || { label: p, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s) => {
        const statusKey = s ? String(s).toLowerCase() : 'open';
        const info = TICKET_STATUS[statusKey] || { label: s, status: 'default' };
        return <Badge status={info.status} text={info.label} />;
      },
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => (
        <Space size="small">
          <ClockCircleOutlined style={{ color: '#bfbfbf' }} />
          <Text type="secondary" style={{ fontSize: 13 }}>
            {dayjs(date).format('DD/MM/YYYY HH:mm')}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Assigned To',
      key: 'assignee',
      width: 150,
      render: (_, record) => {
        if (record.assignee) {
          return <Tag color="geekblue">{record.assignee.full_name}</Tag>;
        }
        if (record.status === 'Cancelled' || record.status === 'Resolved') {
          return <span style={{ color: '#ccc' }}>-</span>;
        }
        return <Tag color="warning">Waiting</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: 140, // Tăng width một chút để chứa đủ 3 nút
      render: (_, record) => (
        <Space size="small">
          {/* Nút Assign (Giữ nguyên logic cũ) */}
          {!record.assignee_id && record.status === 'Open' && (
            <Tooltip title="Assign to Me">
              <Button
                icon={<UserAddOutlined />}
                onClick={() => handleAssignToMe(record.id)}
                size="small"
              />
            </Tooltip>
          )}

          {/* Nút View Detail (Giữ nguyên) */}
          <Tooltip title="View Details">
            <Button
              type="primary"
              ghost
              icon={<EyeOutlined />}
              onClick={() => navigate(`/tickets/detail/${record.id}`)}
              size="small"
            />
          </Tooltip>

          {/* [THÊM MỚI] Nút Delete - Chỉ hiện nếu là Admin/Manager */}
          {canDelete && (
            <Tooltip title="Delete Ticket">
              <Popconfirm
                title="Delete this ticket?"
                description="Are you sure to delete this ticket permanently?"
                onConfirm={() => handleDeleteTicket(record.id)}
                okText="Yes"
                cancelText="No"
                placement="topRight"
              >
                <Button danger icon={<DeleteOutlined />} size="small" />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="layout-content" style={{ padding: '20px' }}>
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 20 }}>
        <Col span={12}>
          <Title level={3} style={{ margin: 0 }}>
            Ticket Management
          </Title>
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchTickets(pagination.current, pagination.pageSize)}
            loading={loading}
          >
            Refresh
          </Button>
        </Col>
      </Row>

      {/* FILTER BAR */}
      <Card variant="borderless" style={{ marginBottom: 20, borderRadius: 12 }}>
        <Space size="large">
          <Space>
            <FilterOutlined /> <Text strong>Status:</Text>
            <Select
              value={filters.status}
              style={{ width: 150 }}
              onChange={(v) => setFilters({ ...filters, status: v })}
            >
              <Select.Option value="All">All Status</Select.Option>
              {Object.keys(TICKET_STATUS).map((k) => (
                <Select.Option key={k} value={TICKET_STATUS[k].label}>
                  {TICKET_STATUS[k].label}
                </Select.Option>
              ))}
            </Select>
          </Space>

          <Space>
            <Text strong>Priority:</Text>
            <Select
              value={filters.priority}
              style={{ width: 150 }}
              onChange={(v) => setFilters({ ...filters, priority: v })}
            >
              <Select.Option value="All">All Priority</Select.Option>
              {Object.entries(PRIORITY_LEVELS).map(([val, info]) => (
                <Select.Option key={val} value={val}>
                  {info.label}
                </Select.Option>
              ))}
            </Select>
          </Space>
        </Space>
      </Card>

      <Card
        variant="borderless"
        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      >
        <Table
          columns={columns}
          dataSource={tickets}
          rowKey="id"
          loading={loading}
          // --- Cấu hình phân trang Server ---
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
          // --- Sự kiện thay đổi trang ---
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default TicketManager;

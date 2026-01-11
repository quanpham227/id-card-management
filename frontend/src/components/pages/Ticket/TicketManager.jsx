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
} from 'antd';
import {
  ReloadOutlined,
  EyeOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';
import { PRIORITY_LEVELS, TICKET_STATUS } from '../../../constants/constants';

const { Title, Text } = Typography;

const TicketManager = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);

  // --- STATE QUẢN LÝ PHÂN TRANG (MỚI) ---
  const [pagination, setPagination] = useState({
    current: 1, // Trang hiện tại
    pageSize: 10, // Số dòng mỗi trang
    total: 0, // Tổng số dòng (để tính số trang)
  });

  // State cho bộ lọc
  const [filters, setFilters] = useState({
    status: 'All',
    priority: 'All',
  });

  // --- 1. Fetch Data (Cập nhật để nhận Page/Size) ---
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

      // --- KIỂM TRA DÒNG NÀY ---
      // Dữ liệu ticket nằm trong res.items (vì backend trả về object phân trang)
      // Nếu res.items bị undefined, hãy thử log console.log(res) để xem cấu trúc
      if (res && res.data) {
        setTickets(res.data.items || []); // Thêm .data

        setPagination({
          current: res.data.page || 1, // Thêm .data
          pageSize: res.data.size || 10, // Thêm .data
          total: res.data.total || 0, // Thêm .data
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

  // Gọi lần đầu hoặc khi Filters thay đổi -> Về trang 1
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
      const user = JSON.parse(localStorage.getItem('user'));

      await axiosClient.put(`/tickets/${ticketId}`, {
        assignee_id: user.id,
        status: 'In Progress',
        resolution_note: 'Ticket has been claimed by IT Support.',
      });

      message.success('You have claimed this ticket!');

      // Reload lại trang hiện tại (không nhảy về trang 1)
      fetchTickets(pagination.current, pagination.pageSize);
    } catch {
      message.error('Failed to assign ticket.');
    }
  };

  // --- Columns Definition (Giữ nguyên) ---
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
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
      render: (p) => {
        const info = PRIORITY_LEVELS[p] || { label: p, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => {
        const statusKey = s ? String(s).toLowerCase() : 'open';
        const info = TICKET_STATUS[statusKey] || { label: s, status: 'default' };
        return <Badge status={info.status} text={info.label} />;
      },
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      render: (assignee) =>
        assignee ? (
          <Tag color="blue" icon={<CheckCircleOutlined />}>
            {assignee.full_name}
          </Tag>
        ) : (
          <Tag>Waiting...</Tag>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space>
          {!record.assignee_id && record.status === 'Open' && (
            <Tooltip title="Assign to Me">
              <Button
                icon={<UserAddOutlined />}
                onClick={() => handleAssignToMe(record.id)}
                size="small"
              />
            </Tooltip>
          )}
          <Button
            type="primary"
            ghost
            icon={<EyeOutlined />}
            onClick={() => navigate(`/tickets/detail/${record.id}`)}
            size="small"
          >
            Manage
          </Button>
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

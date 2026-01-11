import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, Typography, Badge, Divider, message } from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  CalendarOutlined,
  LaptopOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';
import { PRIORITY_LEVELS, TICKET_STATUS } from '../../../constants/constants';

const { Title, Text } = Typography;

const MyTickets = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);

  // State quản lý phân trang
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 8,
    total: 0,
  });

  // --- 1. Fetch Data ---
  const fetchTickets = async (page = 1, pageSize = 8) => {
    setLoading(true);
    try {
      const params = { page, size: pageSize };
      const res = await axiosClient.get('/tickets/my-tickets', { params });

      // Xử lý dữ liệu trả về từ API phân trang
      if (res && res.data) {
        setTickets(res.data.items || []);
        setPagination({
          current: res.data.page,
          pageSize: res.data.size,
          total: res.data.total,
        });
      } else {
        // Fallback nếu API trả về mảng (chưa update backend)
        const safeData = Array.isArray(res) ? res : res?.data || [];
        setTickets(safeData);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      message.error('Failed to load your tickets.');
    } finally {
      setLoading(false);
    }
  };

  // Gọi lần đầu
  useEffect(() => {
    fetchTickets(pagination.current, pagination.pageSize);
  }, []);

  // Xử lý khi chuyển trang
  const handleTableChange = (newPagination) => {
    fetchTickets(newPagination.current, newPagination.pageSize);
  };

  // --- 2. Columns Definition ---
  const columns = [
    {
      title: 'Ticket ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id) => <Text code>#{id}</Text>,
    },
    {
      title: 'Subject & Category',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Link to={`/tickets/detail/${record.id}`} style={{ fontWeight: 600, color: '#1890ff' }}>
            {text}
          </Link>
          <Space
            split={<Divider type="vertical" style={{ margin: '0 4px' }} />}
            style={{ fontSize: 12 }}
          >
            <Text type="secondary">{record.ticket_category?.name || 'General Support'}</Text>
            {record.asset_id && (
              <Text type="warning">
                <LaptopOutlined /> ID: {record.asset_id}
              </Text>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (p) => {
        const info = PRIORITY_LEVELS[p] || { label: p, color: 'default' };
        return (
          <Tag color={info.color} style={{ borderRadius: 10 }}>
            {info.label}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (s) => {
        const statusKey = s?.toLowerCase();
        const info = TICKET_STATUS[statusKey] || { label: s, status: 'default' };
        return <Badge status={info.status} text={<Text strong>{info.label}</Text>} />;
      },
    },
    {
      title: 'Created Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          <CalendarOutlined style={{ marginRight: 5 }} />
          {new Date(date).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      width: 80,
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          shape="circle"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/tickets/detail/${record.id}`)}
        />
      ),
    },
  ];

  return (
    <div className="layout-content" style={{ padding: '20px' }}>
      <Card
        variant="borderless"
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              My Support Tickets
            </Title>
            <Tag color="blue">{pagination.total} total</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchTickets(pagination.current, pagination.pageSize)}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/tickets/create')}
            >
              New Request
            </Button>
          </Space>
        }
        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={tickets}
          loading={loading}
          // Cấu hình phân trang Server
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} tickets`,
          }}
          // Sự kiện chuyển trang
          onChange={handleTableChange}
          locale={{ emptyText: 'No tickets found. Need help? Create a new request!' }}
        />
      </Card>
    </div>
  );
};

export default MyTickets;

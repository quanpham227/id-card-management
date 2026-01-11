import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Divider,
  Timeline,
  Input,
  Space,
  Image,
  Empty,
  Skeleton,
  message,
  Badge,
  Select,
} from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  SendOutlined,
  LeftOutlined,
  LaptopOutlined,
  PaperClipOutlined,
  CheckCircleOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';
import { PRIORITY_LEVELS, TICKET_STATUS } from '../../../constants/constants';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Lấy URL gốc của API để hiển thị ảnh (nếu lưu ảnh local)
  const IMAGE_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Lấy thông tin user hiện tại từ LocalStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isITAdmin = ['Admin', 'Manager'].includes(currentUser.role);

  // --- 1. FETCH DỮ LIỆU ---
  const fetchTicketDetail = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/tickets/${id}`);
      setTicket(res.data || res);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      message.error('Could not load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetail();
  }, [id]);

  // --- 2. XỬ LÝ CẬP NHẬT TRẠNG THÁI (ADMIN ONLY) ---
  const handleStatusUpdate = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await axiosClient.put(`/tickets/${id}`, {
        status: newStatus,
        resolution_note: `Status updated by IT: ${newStatus}`,
      });
      message.success(`Status changed to ${newStatus}`);
      fetchTicketDetail(); // Reload lại để cập nhật giao diện
    } catch (error) {
      console.error('Update status error:', error);
      message.error('Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // --- 3. XỬ LÝ GỬI COMMENT ---
  const handleAddComment = async () => {
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      await axiosClient.post(`/tickets/${id}/comments`, {
        content: comment,
        type: 'Comment',
      });
      message.success('Comment added!');
      setComment('');
      fetchTicketDetail(); // Reload để hiện comment mới
    } catch (error) {
      console.error('Post comment error:', error);
      message.error('Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // --- 4. RENDER UI ---

  // Loading State
  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    );
  }

  // Error State
  if (!ticket) {
    return <Empty style={{ marginTop: 100 }} description="Ticket not found" />;
  }

  // Xử lý hiển thị Label/Màu sắc
  const priority = PRIORITY_LEVELS[ticket.priority] || { label: ticket.priority, color: 'default' };
  const statusRaw = ticket.status ? String(ticket.status).toLowerCase() : 'open';
  const statusInfo = TICKET_STATUS[statusRaw] || {
    label: ticket.status || 'Open',
    status: 'default',
  };

  // Xử lý Timeline (Lịch sử trao đổi)
  const timelineItems = (ticket.comments || []).map((c) => ({
    label: (
      <Text type="secondary" style={{ fontSize: 12 }}>
        {new Date(c.created_at).toLocaleString()}
      </Text>
    ),
    color: c.type === 'System' ? 'gray' : 'blue',
    children: (
      <Card
        size="small"
        variant="borderless"
        style={{ backgroundColor: c.type === 'System' ? '#fafafa' : '#e6f7ff', borderRadius: 8 }}
      >
        <Space>
          {c.type === 'System' ? <ToolOutlined /> : <UserOutlined />}
          <Text strong>{c.user?.full_name || 'System'}: </Text>
        </Space>
        <div style={{ marginTop: 4 }}>
          <Text>{c.content}</Text>
        </div>
      </Card>
    ),
  }));

  return (
    <div className="layout-content" style={{ padding: '20px' }}>
      {/* Back Button */}
      <Button icon={<LeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
        Back to List
      </Button>

      <Row gutter={24}>
        {/* --- CỘT TRÁI: CHI TIẾT & LỊCH SỬ --- */}
        <Col span={16} xs={24} lg={16}>
          {/* Main Ticket Info */}
          <Card
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            title={
              <Space>
                <Tag color="blue">#{ticket.id}</Tag>
                <Title level={4} style={{ margin: 0 }}>
                  {ticket.title}
                </Title>
              </Space>
            }
            extra={
              <Tag color={priority.color} style={{ borderRadius: 10, px: 10 }}>
                {priority.label}
              </Tag>
            }
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">Category:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag icon={<PaperClipOutlined />} color="cyan">
                      {ticket.ticket_category?.name || 'General'}
                    </Tag>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Related Device:</Text>
                  <div style={{ marginTop: 4 }}>
                    {ticket.asset_id ? (
                      <Tag color="warning" icon={<LaptopOutlined />}>
                        Asset ID: {ticket.asset_id}
                      </Tag>
                    ) : (
                      <Text type="secondary" italic>
                        No device linked
                      </Text>
                    )}
                  </div>
                </Col>
              </Row>

              <Divider style={{ margin: '12px 0' }} />

              <div>
                <Text strong style={{ fontSize: 16 }}>
                  Description:
                </Text>
                <Paragraph
                  style={{
                    marginTop: 10,
                    whiteSpace: 'pre-wrap',
                    background: '#f9f9f9',
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  {ticket.description}
                </Paragraph>
              </div>

              {/* Image Attachments */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <Text strong>
                    <PaperClipOutlined /> Attachments:
                  </Text>
                  <div style={{ marginTop: 10 }}>
                    <Image.PreviewGroup>
                      {ticket.attachments.map((path, index) => {
                        // Logic xử lý đường dẫn ảnh an toàn
                        const imgSrc = path.startsWith('http')
                          ? path
                          : `${IMAGE_BASE_URL}/${path.replace(/^\//, '')}`; // Xóa dấu / đầu nếu có để tránh double slash

                        return (
                          <Image
                            key={index}
                            width={100}
                            height={100}
                            style={{
                              objectFit: 'cover',
                              borderRadius: 8,
                              marginRight: 8,
                              border: '1px solid #f0f0f0',
                            }}
                            src={imgSrc}
                            placeholder={
                              <div
                                style={{
                                  width: 100,
                                  height: 100,
                                  background: '#f5f5f5',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Skeleton.Image active />
                              </div>
                            }
                          />
                        );
                      })}
                    </Image.PreviewGroup>
                  </div>
                </div>
              )}
            </Space>
          </Card>

          {/* Conversation History */}
          <Card
            title="Conversation & Updates"
            style={{ marginTop: 24, borderRadius: 12 }}
            variant="borderless"
          >
            <Timeline mode="left" items={timelineItems} style={{ marginTop: 10 }} />

            <div style={{ marginTop: 20, padding: '16px', background: '#f8f9fa', borderRadius: 8 }}>
              <TextArea
                rows={3}
                placeholder="Type your reply here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{ borderRadius: 6 }}
              />
              <div style={{ textAlign: 'right', marginTop: 12 }}>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={submittingComment}
                  onClick={handleAddComment}
                  disabled={!comment.trim()}
                >
                  Post Reply
                </Button>
              </div>
            </div>
          </Card>
        </Col>

        {/* --- CỘT PHẢI: TRẠNG THÁI & ACTION --- */}
        <Col span={8} xs={24} lg={8}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card
              title="Status & Details"
              variant="borderless"
              style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            >
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: 20,
                  padding: '10px',
                  background: '#fcfcfc',
                  borderRadius: 8,
                  border: '1px dashed #d9d9d9',
                }}
              >
                <Badge status={statusInfo.status} />
                <Text
                  strong
                  style={{
                    fontSize: 20,
                    marginLeft: 8,
                    color: statusInfo.status === 'success' ? '#52c41a' : '#000',
                  }}
                >
                  {statusInfo.label}
                </Text>
              </div>

              {/* KHU VỰC DÀNH CHO IT ADMIN */}
              {isITAdmin && ticket.status !== 'Resolved' && ticket.status !== 'Cancelled' && (
                <div
                  style={{
                    background: '#e6f7ff',
                    padding: 15,
                    borderRadius: 8,
                    marginBottom: 20,
                    border: '1px solid #91caff',
                  }}
                >
                  <Text strong style={{ color: '#0050b3' }}>
                    <ToolOutlined /> Admin Actions
                  </Text>
                  <Select
                    style={{ width: '100%', marginTop: 10 }}
                    placeholder="Change Ticket Status"
                    loading={updatingStatus}
                    onChange={handleStatusUpdate}
                    defaultValue={null}
                  >
                    {ticket.status === 'Open' && (
                      <Select.Option value="In Progress">
                        Start Processing (In Progress)
                      </Select.Option>
                    )}
                    <Select.Option value="Resolved">Mark as Resolved</Select.Option>
                    <Select.Option value="Cancelled">Cancel Ticket</Select.Option>
                  </Select>
                </div>
              )}

              <Divider style={{ margin: '15px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    REQUESTER
                  </Text>
                  <div>
                    <Text strong style={{ fontSize: 15 }}>
                      <UserOutlined /> {ticket.requester?.full_name}
                    </Text>
                  </div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ASSIGNED TO
                  </Text>
                  <div>
                    {ticket.assignee ? (
                      <Tag color="geekblue" style={{ fontSize: 14, padding: '4px 8px' }}>
                        {ticket.assignee.full_name}
                      </Tag>
                    ) : (
                      <Tag>Unassigned</Tag>
                    )}
                  </div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    CREATED DATE
                  </Text>
                  <div>
                    <Text>
                      <ClockCircleOutlined /> {new Date(ticket.created_at).toLocaleString()}
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default TicketDetail;

import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Divider,
  Skeleton,
  message,
  Empty,
  Card,
} from 'antd';
import { LeftOutlined, LaptopOutlined, PaperClipOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';
import { PRIORITY_LEVELS } from '../../../constants/constants';

// IMPORT CÁC COMPONENT ĐÃ TÁCH
import TicketAttachments from './TicketAttachments';
import TicketSidebar from './TicketSidebar';
import TicketConversation from './TicketConversation';
import ResolveModal from './ResolveModal';

const { Title, Text, Paragraph } = Typography;

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isITAdmin = ['Admin', 'Manager'].includes(currentUser.role);

  // States
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolving, setResolving] = useState(false);

  // --- API CALLS ---
  const fetchTicketDetail = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/tickets/${id}`);
      let ticketData = res.data || res;

      // Chuẩn hóa attachments thành mảng
      if (ticketData.attachment_url && typeof ticketData.attachment_url === 'string') {
        ticketData.attachments = ticketData.attachment_url.split(',');
      } else if (!ticketData.attachments) {
        ticketData.attachments = [];
      }
      setTicket(ticketData);
    } catch (error) {
      console.error(error);
      message.error('Could not load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetail();
  }, [id]);

  // --- HANDLERS ---
  const handleStatusUpdate = async (newStatus, extraData = {}) => {
    setUpdatingStatus(true);
    try {
      await axiosClient.put(`/tickets/${id}`, { status: newStatus, ...extraData });
      message.success(`Status changed to ${newStatus}`);
      fetchTicketDetail();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const onAssign = () => handleStatusUpdate('In Progress', { assignee_id: currentUser.id });

  const onStatusChange = (newStatus) => {
    if (newStatus === 'Resolved') setIsResolveModalOpen(true);
    else handleStatusUpdate(newStatus);
  };

  const onConfirmResolve = async (values) => {
    setResolving(true);
    try {
      await axiosClient.put(`/tickets/${id}`, {
        status: 'Resolved',
        resolution_note: values.resolution_note,
      });
      message.success('Ticket resolved!');
      setIsResolveModalOpen(false);
      fetchTicketDetail();
    } catch {
      message.error('Failed to resolve ticket.');
    } finally {
      setResolving(false);
    }
  };

  const onAddComment = async () => {
    setSubmittingComment(true);
    try {
      await axiosClient.post(`/tickets/${id}/comments`, { content: comment, type: 'Comment' });
      message.success('Comment added!');
      setComment('');
      fetchTicketDetail();
    } catch {
      message.error('Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // --- RENDER ---
  if (loading)
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  if (!ticket) return <Empty style={{ marginTop: 100 }} description="Ticket not found" />;

  const priority = PRIORITY_LEVELS[ticket.priority] || { label: ticket.priority, color: 'default' };

  return (
    <div className="layout-content" style={{ padding: '20px' }}>
      <Button icon={<LeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
        Back to List
      </Button>

      <Row gutter={24}>
        {/* CỘT TRÁI: THÔNG TIN CHI TIẾT */}
        <Col span={16} xs={24} lg={16}>
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
            extra={<Tag color={priority.color}>{priority.label}</Tag>}
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

              {/* COMPONENT ẢNH ĐÃ TÁCH */}
              <TicketAttachments attachments={ticket.attachments} />
            </Space>
          </Card>

          {/* COMPONENT CHAT ĐÃ TÁCH */}
          <TicketConversation
            comments={ticket.comments}
            comment={comment}
            setComment={setComment}
            onAddComment={onAddComment}
            submitting={submittingComment}
          />
        </Col>

        {/* CỘT PHẢI: SIDEBAR */}
        <Col span={8} xs={24} lg={8}>
          <TicketSidebar
            ticket={ticket}
            isITAdmin={isITAdmin}
            updatingStatus={updatingStatus}
            onAssign={onAssign}
            onStatusChange={onStatusChange}
            onResolve={() => setIsResolveModalOpen(true)}
          />
        </Col>
      </Row>

      {/* COMPONENT MODAL ĐÃ TÁCH */}
      <ResolveModal
        open={isResolveModalOpen}
        onCancel={() => setIsResolveModalOpen(false)}
        onConfirm={onConfirmResolve}
        loading={resolving}
        initialNote={ticket.resolution_note}
      />
    </div>
  );
};

export default TicketDetail;

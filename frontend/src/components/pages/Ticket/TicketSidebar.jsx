import React from 'react';
import { Card, Badge, Typography, Button, Select, Divider, Tag, Space, Tooltip } from 'antd';
import {
  ToolOutlined,
  UserAddOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { TICKET_STATUS } from '../../../constants/constants';

const { Text } = Typography;

const TicketSidebar = ({
  ticket,
  isITAdmin,
  updatingStatus,
  onAssign,
  onStatusChange,
  onResolve,
}) => {
  const statusRaw = ticket.status ? String(ticket.status).toLowerCase() : 'open';
  const statusInfo = TICKET_STATUS[statusRaw] || { label: ticket.status, status: 'default' };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card
        title="Status & Details"
        variant="borderless"
        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      >
        {/* Status Badge */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 20,
            padding: 10,
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

        {/* Admin Actions */}
        {isITAdmin && ticket.status !== 'Cancelled' && (
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
            <div style={{ marginTop: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!ticket.assignee_id && ticket.status !== 'Resolved' && (
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={onAssign}
                  loading={updatingStatus}
                >
                  Assign to Me
                </Button>
              )}
              {ticket.status === 'In Progress' && (
                <Button
                  type="primary"
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  icon={<CheckCircleOutlined />}
                  onClick={onResolve}
                >
                  Mark as Resolved
                </Button>
              )}
              <Select
                style={{ width: '100%' }}
                placeholder="Other Actions..."
                loading={updatingStatus}
                onChange={onStatusChange}
                value={null}
              >
                {ticket.status === 'Open' && (
                  <Select.Option value="In Progress">Move to In Progress</Select.Option>
                )}
                {ticket.status !== 'Resolved' && (
                  <Select.Option value="Resolved">Mark as Resolved</Select.Option>
                )}
                <Select.Option value="Cancelled">Cancel Ticket</Select.Option>
              </Select>
            </div>
          </div>
        )}

        <Divider style={{ margin: '15px 0' }} />

        {/* Metadata */}
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
                <ClockCircleOutlined /> {dayjs(ticket.created_at).format('DD/MM/YYYY HH:mm')}
              </Text>
            </div>
          </div>
          {ticket.resolution_note && (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 4,
              }}
            >
              <Text type="success" strong>
                Resolution Note:
              </Text>
              <div style={{ fontSize: 13 }}>{ticket.resolution_note}</div>
            </div>
          )}
        </div>
      </Card>
    </Space>
  );
};

export default TicketSidebar;

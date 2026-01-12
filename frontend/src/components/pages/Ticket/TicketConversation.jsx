import React from 'react';
import { Card, Timeline, Input, Button, Typography, Space } from 'antd';
import { SendOutlined, ToolOutlined, UserOutlined } from '@ant-design/icons';

// [SỬA LỖI]: Tách TextArea ra khỏi Typography
const { Text } = Typography;
const { TextArea } = Input; // TextArea nằm trong Input, không phải Typography

const TicketConversation = ({ comments, comment, setComment, onAddComment, submitting }) => {
  const timelineItems = (comments || []).map((c) => ({
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
        style={{
          backgroundColor: c.type === 'System' ? '#fafafa' : '#e6f7ff',
          borderRadius: 8,
        }}
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
    <Card
      title="Conversation & Updates"
      style={{ marginTop: 24, borderRadius: 12 }}
      variant="borderless"
    >
      <Timeline mode="left" items={timelineItems} style={{ marginTop: 10 }} />
      <div
        style={{
          marginTop: 20,
          padding: '16px',
          background: '#f8f9fa',
          borderRadius: 8,
        }}
      >
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
            loading={submitting}
            onClick={onAddComment}
            disabled={!comment.trim()}
          >
            Post Reply
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TicketConversation;

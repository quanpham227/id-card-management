import React from 'react';
import { Typography, Card } from 'antd';
import { useParams } from 'react-router-dom';
const { Title } = Typography;

const TicketDetail = () => {
  const { id } = useParams(); // Lấy ID từ URL
  return (
    <Card title={`Chi Tiết Ticket #${id || 'Unknown'}`}>
      <Title level={3}>Nội dung chi tiết & Lịch sử Chat</Title>
      <p>User và IT sẽ trao đổi tại đây.</p>
    </Card>
  );
};
export default TicketDetail;
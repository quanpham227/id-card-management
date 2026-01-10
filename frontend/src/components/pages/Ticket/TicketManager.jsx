import React from 'react';
import { Typography, Card, Alert } from 'antd';
const { Title } = Typography;

const TicketManager = () => {
  return (
    <Card title="Quản Lý Ticket (IT Dept)">
      <Alert message="Chỉ IT/Admin mới thấy trang này" type="warning" showIcon style={{marginBottom: 16}} />
      <Title level={3}>Kanban Board hoặc List Ticket toàn công ty</Title>
      <p>Chức năng: Assign ticket, đổi trạng thái, thống kê...</p>
    </Card>
  );
};
export default TicketManager;
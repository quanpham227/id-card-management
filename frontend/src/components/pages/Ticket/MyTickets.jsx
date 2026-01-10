import React from 'react';
import { Typography, Card } from 'antd';
const { Title } = Typography;

const MyTickets = () => {
  return (
    <Card title="Danh Sách Yêu Cầu Của Tôi">
      <Title level={3}>Table hiển thị lịch sử ticket của User</Title>
      <p>Cột: Mã Ticket | Tiêu đề | Trạng thái | Ngày tạo</p>
    </Card>
  );
};
export default MyTickets;
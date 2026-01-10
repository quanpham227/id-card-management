import React from 'react';
import { Typography, Card, Row, Col, Statistic, Empty } from 'antd';
import { 
  CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, PieChartOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

const TicketReports = () => {
  return (
    <div className="ticket-reports">
      <Title level={2} style={{ marginBottom: 24 }}>Ticket Analytics & Reports</Title>
      
      {/* 1. KHU VỰC SỐ LIỆU TỔNG QUAN (KPIs) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card variant="borderless" style={{ background: '#e6f7ff', borderRadius: 8 }}>
            <Statistic 
              title="Tổng Ticket tháng này" 
              value={128} 
              prefix={<PieChartOutlined />} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card variant="borderless" style={{ background: '#f6ffed', borderRadius: 8 }}>
            <Statistic 
              title="Đã Xử Lý (Resolved)" 
              value={95} 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card variant="borderless" style={{ background: '#fff7e6', borderRadius: 8 }}>
            <Statistic 
              title="Đang Chờ (Pending)" 
              value={20} 
              prefix={<ClockCircleOutlined />} 
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card variant="borderless" style={{ background: '#fff1f0', borderRadius: 8 }}>
            <Statistic 
              title="Quá Hạn (Overdue)" 
              value={13} 
              prefix={<CloseCircleOutlined />} 
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 2. KHU VỰC BIỂU ĐỒ (PLACEHOLDER) */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Xu hướng Ticket theo ngày" style={{ borderRadius: 8, minHeight: 400 }}>
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, background: '#fafafa', border: '1px dashed #d9d9d9' }}>
                <Text type="secondary">[Bar Chart Area: Ticket Volume Trend]</Text>
             </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Phân loại Sự cố" style={{ borderRadius: 8, minHeight: 400 }}>
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, background: '#fafafa', border: '1px dashed #d9d9d9' }}>
                <Text type="secondary">[Pie Chart: Hardware vs Software]</Text>
             </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TicketReports;
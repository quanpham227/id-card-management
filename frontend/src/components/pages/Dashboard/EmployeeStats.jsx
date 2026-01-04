import React from 'react';
import { Row, Col, Card, Statistic, Flex } from 'antd'; // Nhớ import Flex
import { 
  TeamOutlined, 
  UserOutlined, 
  UserDeleteOutlined 
} from '@ant-design/icons';

const EmployeeStats = ({ dataSource }) => {
  // Tính toán số liệu
  const total = dataSource.length;
  const active = dataSource.filter(e => e.employee_status === 'Active').length;
  const resign = dataSource.filter(e => e.employee_status === 'Resign').length;

  const statItems = [
    {
      title: 'Total Employees',
      value: total,
      icon: <TeamOutlined />,
      color: '#1890ff',
    },
    {
      title: 'Active Employees',
      value: active,
      icon: <UserOutlined />,
      color: '#52c41a',
    },
    {
      title: 'Resigned',
      value: resign,
      icon: <UserDeleteOutlined />,
      color: '#ff4d4f',
    },
  ];

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      {statItems.map((item, index) => (
        <Col xs={24} sm={8} key={index}>
          {/* SỬA LỖI 1: bordered={false} -> variant="borderless" */}
          <Card 
            variant="borderless" 
            hoverable 
            style={{ 
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
              borderRadius: '12px' 
            }}
          >
            <Statistic 
              // Dùng Flex để căn chỉnh icon và text đẹp hơn (Thay cho Space)
              title={
                <Flex align="center" gap={8}>
                  {React.cloneElement(item.icon, { style: { color: item.color } })}
                  <span style={{ fontWeight: 500, color: '#8c8c8c' }}>{item.title}</span>
                </Flex>
              }
              value={item.value} 
              // SỬA LỖI 2: valueStyle -> styles.content
              styles={{
                content: {
                  color: item.color,
                  fontWeight: 700
                }
              }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default EmployeeStats;
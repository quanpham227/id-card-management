import React, { useEffect } from 'react';
import { Typography, Badge } from 'antd';
import { useEmployees } from '../../../context/useEmployees';

// Components
import EmployeeStats from './EmployeeStats';
import PrintStatistics from './PrintStatistics';

const { Title, Text } = Typography;

const Dashboard = () => {
  // 1. Lấy thêm biến 'source' từ Context
  const { employees, fetchEmployees, isLoaded, source } = useEmployees();

  useEffect(() => {
    if (!isLoaded) {
      fetchEmployees();
    }
    // eslint-disable-next-line
  }, []);

  // 2. Hàm hiển thị trạng thái dựa trên source
  const renderStatus = () => {
    switch (source) {
      case 'online':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Badge status="processing" color="#52c41a" />
            <Text style={{ fontSize: '12px', color: '#52c41a', fontWeight: 500 }}>
              System Status: Online
            </Text>
          </div>
        );
      case 'offline':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Badge status="warning" />
            <Text style={{ fontSize: '12px', color: '#faad14', fontWeight: 500 }}>
              System Status: Offline (Backup Mode)
            </Text>
          </div>
        );
      default: // error
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Badge status="error" />
            <Text style={{ fontSize: '12px', color: '#ff4d4f', fontWeight: 500 }}>
              System Status: Disconnected
            </Text>
          </div>
        );
    }
  };

  return (
    <div style={{ padding: '0 8px' }}>
      {/* 1. HEADER: Gọn gàng, nằm trên 1 dòng */}
      <div
        style={{
          marginBottom: 12,
          marginTop: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={4} style={{ margin: 0, color: '#001529' }}>
          Dashboard Overview
        </Title>

        {/* Hiển thị trạng thái động tại đây */}
        {renderStatus()}
      </div>

      {/* 2. HR STATS */}
      <div style={{ marginBottom: 12 }}>
        <EmployeeStats dataSource={employees} />
      </div>

      {/* 3. CHARTS */}
      <div>
        <PrintStatistics />
      </div>
    </div>
  );
};

export default Dashboard;

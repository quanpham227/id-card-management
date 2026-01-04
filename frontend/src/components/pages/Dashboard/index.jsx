import React, { useEffect } from 'react';
import { Typography } from 'antd';
import { useEmployees } from '../../../context/useEmployees';

// Components
import EmployeeStats from './EmployeeStats';
import PrintStatistics from './PrintStatistics'; // Kiểm tra lại đường dẫn import nếu cần

const { Title, Text } = Typography;

const Dashboard = () => {
  const { employees, fetchEmployees, isLoaded } = useEmployees();

  useEffect(() => {
    if (!isLoaded) {
      fetchEmployees();
    }
    // eslint-disable-next-line
  }, []);

  return (
    <div style={{ padding: '0 8px' }}>
      {/* 1. HEADER: Gọn gàng, nằm trên 1 dòng */}
      <div style={{ 
        marginBottom: 12, 
        marginTop: 4,
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Title level={4} style={{ margin: 0, color: '#001529' }}>
          Dashboard Overview
        </Title>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          System Status: Online
        </Text>
      </div>

      {/* 2. HR STATS: Đã bỏ tiêu đề phụ "Tình hình nhân sự" để tiết kiệm diện tích */}
      <div style={{ marginBottom: 12 }}>
         <EmployeeStats dataSource={employees} />
      </div>

      {/* 3. CHARTS: Đã bỏ Divider và tiêu đề phụ.
          Bản thân Component PrintStatistics đã có Card bao bọc nên sẽ tự tách biệt.
      */}
      <div>
         <PrintStatistics />
      </div>
    </div>
  );
};

export default Dashboard;
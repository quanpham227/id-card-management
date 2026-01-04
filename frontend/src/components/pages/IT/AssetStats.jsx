import React, { useMemo } from 'react';
import { Row, Col, Card, Statistic, Flex, Typography } from 'antd';
import { 
  DesktopOutlined, 
  LaptopOutlined, 
  TabletOutlined, 
  PrinterOutlined,
  FundProjectionScreenOutlined, 
  AlertOutlined,
  CheckCircleOutlined,
  InboxOutlined,
  DisconnectOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const AssetStats = ({ assets = [] }) => {
  
  // 1. TÍNH TOÁN SỐ LIỆU (Đã sửa logic đếm Monitor)
  const stats = useMemo(() => {
    return assets.reduce((acc, curr) => {
      const type = curr.type?.toLowerCase();
      
      // --- ĐẾM LOẠI THIẾT BỊ CHÍNH ---
      if (type === 'pc') acc.pc++;
      else if (type === 'laptop') acc.laptop++;
      else if (type === 'tablet') acc.tablet++;
      else if (type === 'printer') acc.printer++;

      // --- [FIX LOGIC]: ĐẾM MONITOR ---
      // Trường hợp 1: Bản thân nó là thiết bị loại "Monitor" (Monitor rời)
      if (type === 'monitor') {
        acc.monitor++;
      } 
      // Trường hợp 2: Nó là PC nhưng có kèm Màn hình (kiểm tra trường monitor bên trong)
      else if (curr.monitor && curr.monitor.model) {
        acc.monitor++;
      }

      // --- LOGIC TRẠNG THÁI ---
      let status = curr.usage_status;
      if (!status) {
        if (curr.assigned_to && curr.assigned_to.employee_id) status = 'In Use';
        else status = 'Spare';
      }

      if (status === 'In Use') acc.inUse++;
      else if (status === 'Spare') acc.spare++;
      else if (status === 'Broken') acc.broken++;

      if (curr.health_status === 'Critical') acc.critical++;

      return acc;
    }, { 
      pc: 0, laptop: 0, tablet: 0, printer: 0, monitor: 0,
      inUse: 0, spare: 0, broken: 0, critical: 0 
    });
  }, [assets]);

  // 2. CẤU HÌNH DỮ LIỆU HIỂN THỊ
  const statItems = [
    { title: 'PCs', value: stats.pc, icon: <DesktopOutlined />, color: '#1890ff', bg: '#e6f7ff' },
    { title: 'Laptops', value: stats.laptop, icon: <LaptopOutlined />, color: '#722ed1', bg: '#f9f0ff' },
    { title: 'Monitors', value: stats.monitor, icon: <FundProjectionScreenOutlined />, color: '#eb2f96', bg: '#fff0f6' }, 
    { title: 'Tablets', value: stats.tablet, icon: <TabletOutlined />, color: '#13c2c2', bg: '#e6fffb' },
    { title: 'Printers', value: stats.printer, icon: <PrinterOutlined />, color: '#fa8c16', bg: '#fff7e6' },
    
    { title: 'In Use', value: stats.inUse, icon: <CheckCircleOutlined />, color: '#52c41a', bg: '#f6ffed' },
    { title: 'Spare (Kho)', value: stats.spare, icon: <InboxOutlined />, color: '#2f54eb', bg: '#f0f5ff' },
    { title: 'Broken', value: stats.broken, icon: <DisconnectOutlined />, color: '#faad14', bg: '#fffbe6' },
    { title: 'Critical', value: stats.critical, icon: <AlertOutlined />, color: '#f5222d', bg: '#fff1f0', isAlert: true },
  ];

  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
      {statItems.map((item, index) => (
        <Col key={index} xs={12} sm={8} md={6} lg={4} xl={index < 5 ? 4 : 5} xxl={index < 5 ? 2 : 3} flex="auto">
          <Card 
            variant="borderless" 
            hoverable 
            style={{ 
              borderRadius: '10px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
              height: '100%',
              overflow: 'hidden'
            }}
            styles={{ body: { padding: '12px 16px' } }}
          >
            <Flex align="center" gap={16}>
              <Flex 
                align="center" 
                justify="center" 
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  backgroundColor: item.bg,
                  flexShrink: 0 
                }}
              >
                {React.cloneElement(item.icon, { style: { fontSize: '22px', color: item.color } })}
              </Flex>

              <Flex vertical justify="center" style={{ overflow: 'hidden' }}>
                <Text type="secondary" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {item.title}
                </Text>
                <Statistic 
                  value={item.value} 
                  valueStyle={{ 
                    fontSize: '20px', 
                    fontWeight: 700, 
                    color: item.isAlert && item.value > 0 ? '#f5222d' : '#262626',
                    lineHeight: 1.2
                  }} 
                />
              </Flex>
            </Flex>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default AssetStats;
import React, { useMemo } from 'react';
import { Row, Col, Card, Statistic, Flex, Typography } from 'antd';
import { 
  DesktopOutlined, LaptopOutlined, TabletOutlined, PrinterOutlined,
  FundProjectionScreenOutlined, AppstoreOutlined,
  CheckCircleOutlined, InboxOutlined, DisconnectOutlined, AlertOutlined,
  ClearOutlined
} from '@ant-design/icons';

// [MỚI] Import Hook điều hướng
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const AssetStats = ({ assets = [], categories = [], activeFilter, onFilterChange }) => {
  const navigate = useNavigate(); // [MỚI]

  const stats = useMemo(() => {
    // ... (Giữ nguyên logic tính toán cũ không đổi)
    const catCounts = {};
    categories.forEach(cat => {
        catCounts[cat.id] = { name: cat.name, code: cat.code, count: 0, color: getColor(cat.code) };
    });
    catCounts['unknown'] = { name: 'Other', code: 'OTHER', count: 0, color: '#8c8c8c' };

    const statusCounts = { inUse: 0, spare: 0, broken: 0, critical: 0 };

    assets.forEach(item => {
        const catId = item.category?.id || item.category_id;
        if (catCounts[catId]) catCounts[catId].count++;
        else catCounts['unknown'].count++;

        const st = item.usage_status;
        if (st === 'In Use') statusCounts.inUse++;
        else if (st === 'Spare') statusCounts.spare++;
        else if (st === 'Broken') statusCounts.broken++;

        if (item.health_status === 'Critical') statusCounts.critical++;
    });

    return { catCounts, statusCounts };
  }, [assets, categories]);

  function getColor(code) {
      const c = code?.toUpperCase();
      if (c === 'PC') return '#1890ff';
      if (c === 'LPT' || c === 'LAPTOP') return '#722ed1';
      if (c === 'TAB' || c === 'TABLET') return '#13c2c2';
      if (c === 'PRT' || c === 'PRINTER') return '#fa8c16';
      if (c === 'MON' || c === 'MONITOR') return '#eb2f96';
      return '#595959';
  }

  function getIcon(code, color) {
      const style = { fontSize: '22px', color: color };
      const c = code?.toUpperCase();
      if (c === 'PC') return <DesktopOutlined style={style} />;
      if (c === 'LPT' || c === 'LAPTOP') return <LaptopOutlined style={style} />;
      if (c === 'PRT' || c === 'PRINTER') return <PrinterOutlined style={style} />;
      if (c === 'TAB' || c === 'TABLET') return <TabletOutlined style={style} />;
      if (c === 'MON' || c === 'MONITOR') return <FundProjectionScreenOutlined style={style} />;
      return <AppstoreOutlined style={style} />;
  }

  const categoryStatsArray = Object.values(stats.catCounts).filter(c => c.count > 0 || c.code !== 'OTHER');

  const statusItems = [
    { title: 'In Use', filterKey: 'In Use', value: stats.statusCounts.inUse, icon: <CheckCircleOutlined />, color: '#52c41a', bg: '#f6ffed' },
    { title: 'Spare (Kho)', filterKey: 'Spare', value: stats.statusCounts.spare, icon: <InboxOutlined />, color: '#2f54eb', bg: '#f0f5ff' },
    { title: 'Broken', filterKey: 'Broken', value: stats.statusCounts.broken, icon: <DisconnectOutlined />, color: '#faad14', bg: '#fffbe6' },
    { title: 'Critical', filterKey: 'CRITICAL', value: stats.statusCounts.critical, icon: <AlertOutlined />, color: '#f5222d', bg: '#fff1f0', isAlert: true },
  ];

  const handleCardClick = (key) => {
      if (activeFilter === key) {
          onFilterChange(null);
      } else {
          onFilterChange(key);
      }
  };

  // [MỚI] Hàm xử lý khi bấm vào thẻ Category
  const handleCategoryClick = (code) => {
      if (code === 'OTHER') return;
      // Chuyển hướng sang trang category tương ứng
      navigate(`/it/${code.toLowerCase()}`);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {/* 1. DÒNG THỐNG KÊ DANH MỤC */}
      <Text strong style={{display: 'block', marginBottom: 8, fontSize: 12, color: '#8c8c8c'}}>BY CATEGORY</Text>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {categoryStatsArray.map((item, index) => (
          <Col key={index} xs={12} sm={8} md={6} lg={4} flex="auto">
            <Card 
                variant="borderless" 
                // [MỚI] Thêm sự kiện click chuyển trang
                onClick={() => handleCategoryClick(item.code)}
                style={{ 
                    borderRadius: '8px', 
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    cursor: 'pointer', // Biến thành hình bàn tay
                    transition: 'all 0.2s'
                }} 
                styles={{ body: { padding: '12px' } }}
                hoverable // Hiệu ứng nổi lên khi di chuột
            >
              <Flex align="center" gap={12}>
                <Flex align="center" justify="center" style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${item.color}15` }}>
                  {getIcon(item.code, item.color)}
                </Flex>
                <Flex vertical>
                  <Text type="secondary" style={{ fontSize: '11px' }}>{item.name}</Text>
                  <Statistic value={item.count} valueStyle={{ fontSize: '18px', fontWeight: 700, lineHeight: 1 }} />
                </Flex>
              </Flex>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 2. DÒNG THỐNG KÊ TRẠNG THÁI */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
          <Text strong style={{ fontSize: 12, color: '#8c8c8c' }}>BY STATUS (CLICK TO FILTER)</Text>
          {activeFilter && (
              <a onClick={() => onFilterChange(null)} style={{ fontSize: 12, cursor: 'pointer' }}>
                  <ClearOutlined /> Clear Filter
              </a>
          )}
      </Flex>
      
      <Row gutter={[12, 12]}>
        {statusItems.map((item, index) => {
            const isActive = activeFilter === item.filterKey;
            return (
                <Col key={index} xs={12} sm={6} md={6} lg={6}>
                     <Card 
                        variant="borderless" 
                        onClick={() => handleCardClick(item.filterKey)} 
                        style={{ 
                            borderRadius: '8px', 
                            borderLeft: `4px solid ${item.color}`,
                            cursor: 'pointer', 
                            transition: 'all 0.2s',
                            transform: isActive ? 'translateY(-2px)' : 'none',
                            boxShadow: isActive ? `0 4px 12px ${item.color}40` : '0 1px 2px rgba(0,0,0,0.03)',
                            background: isActive ? '#fff' : '#fafafa'
                        }} 
                        styles={{ body: { padding: '12px' } }}
                     >
                        <Flex justify="space-between" align="center">
                            <Flex vertical>
                                <Text type="secondary" style={{ fontSize: '11px', fontWeight: isActive ? 600 : 400 }}>
                                    {item.title}
                                </Text>
                                <Statistic 
                                    value={item.value} 
                                    valueStyle={{ 
                                        fontSize: '20px', 
                                        fontWeight: 700, 
                                        color: item.isAlert && item.value > 0 ? '#f5222d' : undefined 
                                    }} 
                                />
                            </Flex>
                            <div style={{ fontSize: '20px', color: item.color, opacity: isActive ? 1 : 0.5 }}>
                                {item.icon}
                            </div>
                        </Flex>
                     </Card>
                </Col>
            );
        })}
      </Row>
    </div>
  );
};

export default AssetStats;
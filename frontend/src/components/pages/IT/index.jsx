import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Statistic, Progress, Table, List, Flex, Spin } from 'antd'; // [SỬA]: Thêm Flex và Spin
import { DatabaseOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axiosClient from '../../../api/axiosClient';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    assets: [],
    categories: [],
    stats: { total: 0, totalValue: 0 },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Bắt đầu tải -> loading = true
      try {
        const [resAssets, resCats] = await Promise.all([
          axiosClient.get('/assets'),
          axiosClient.get('/categories'),
        ]);
        setData({
          assets: Array.isArray(resAssets.data) ? resAssets.data : [],
          categories: Array.isArray(resCats.data) ? resCats.data : [],
        });
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false); // Tải xong -> loading = false
      }
    };
    fetchData();
  }, []);

  // --- [SỬA] NẾU ĐANG TẢI THÌ HIỆN VÒNG XOAY ---
  // Đoạn này giúp biến 'loading' được sử dụng -> Hết lỗi
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          minHeight: '400px',
        }}
      >
        <Spin size="large" tip="Loading Dashboard data..." />
      </div>
    );
  }

  // --- TÍNH TOÁN SỐ LIỆU ---
  const assets = data.assets;

  // 1. Thống kê theo Trạng thái
  const statusStats = {
    inUse: assets.filter((a) => a.usage_status === 'In Use').length,
    spare: assets.filter((a) => a.usage_status === 'Spare').length,
    broken: assets.filter((a) => a.usage_status === 'Broken').length,
  };
  const total = assets.length || 1;

  // 2. Thống kê theo Danh mục
  const catStats = data.categories
    .map((cat) => {
      const count = assets.filter((a) => (a.category?.id || a.category_id) === cat.id).length;
      return { ...cat, count, percent: Math.round((count / total) * 100) };
    })
    .sort((a, b) => b.count - a.count);

  // 3. Danh sách thiết bị cảnh báo (Critical)
  const criticalAssets = assets.filter((a) => a.health_status === 'Critical');

  return (
    <div style={{ paddingBottom: 24 }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        System Overview
      </Title>

      {/* --- PHẦN 1: KEY METRICS --- */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card
            variant="borderless"
            style={{ height: '100%', background: '#1890ff', color: '#fff' }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Total Assets</span>}
              value={assets.length}
              valueStyle={{ color: '#fff' }}
              prefix={<DatabaseOutlined />}
            />
            <div style={{ marginTop: 8, opacity: 0.8 }}>System managed devices</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" style={{ height: '100%' }}>
            <Statistic
              title="In Use Ratio"
              value={Math.round((statusStats.inUse / total) * 100)}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
            <Progress
              percent={Math.round((statusStats.inUse / total) * 100)}
              showInfo={false}
              strokeColor="#3f8600"
              size="small"
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              {statusStats.inUse} devices currently assigned
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" style={{ height: '100%' }}>
            <Statistic
              title="Broken / Critical"
              value={statusStats.broken + criticalAssets.length}
              valueStyle={{ color: '#cf1322' }}
              prefix={<WarningOutlined />}
            />
            <Progress
              percent={Math.round(((statusStats.broken + criticalAssets.length) / total) * 100)}
              showInfo={false}
              strokeColor="#cf1322"
              size="small"
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>Action required</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* --- PHẦN 2: CHI TIẾT THEO DANH MỤC --- */}
        <Col xs={24} lg={16}>
          <Card title="Inventory by Category" variant="borderless" style={{ minHeight: 400 }}>
            <List
              itemLayout="horizontal"
              dataSource={catStats}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <Flex justify="space-between" style={{ marginBottom: 4 }}>
                      <Text strong>{item.name}</Text>
                      <Text type="secondary">
                        {item.count} assets ({item.percent}%)
                      </Text>
                    </Flex>
                    <Progress
                      percent={item.percent}
                      strokeColor={
                        item.code === 'PC' ? '#1890ff' : item.code === 'LPT' ? '#722ed1' : '#fa8c16'
                      }
                      trailColor="#f5f5f5"
                    />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* --- PHẦN 3: DANH SÁCH CẢNH BÁO --- */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: '#cf1322' }} /> Critical Health Attention
              </Space>
            }
            variant="borderless"
            style={{ minHeight: 400 }}
            bodyStyle={{ padding: 0 }}
          >
            {criticalAssets.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#52c41a' }}>
                <CheckCircleOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <p>All systems healthy!</p>
              </div>
            ) : (
              <Table
                dataSource={criticalAssets}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Code',
                    dataIndex: 'asset_code',
                    render: (t) => <Text strong>{t}</Text>,
                  },
                  { title: 'Model', dataIndex: 'model', ellipsis: true },
                  {
                    title: 'Issue',
                    dataIndex: 'notes',
                    ellipsis: true,
                    render: (t) => (
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {t || 'No notes'}
                      </Text>
                    ),
                  },
                ]}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

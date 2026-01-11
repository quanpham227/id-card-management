import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Statistic, Skeleton, message, Empty } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  PieChartOutlined,
  FireOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { Column, Pie } from '@ant-design/plots';
import axiosClient from '../../../api/axiosClient';

const { Title } = Typography;

const TicketReports = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    critical: 0,
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/tickets/stats/summary');
      const data = res.data ? res.data : res;
      setStats(data);
    } catch {
      message.error('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // --- CẤU HÌNH BIỂU ĐỒ TRÒN (v2) ---
  const pieConfig = {
    data: [
      { type: 'Open', value: stats.open },
      { type: 'In Progress', value: stats.in_progress },
      { type: 'Resolved', value: stats.resolved },
    ].filter((d) => d.value > 0),
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    // Fix lỗi: v2 dùng text thay vì content, và chỉ cần tên trường
    label: {
      text: 'value',
      position: 'outside',
      style: {
        fontWeight: 'bold',
      },
    },
    legend: {
      color: {
        position: 'right',
        itemMarker: 'circle',
      },
    },
    // Fix màu sắc cho v2
    scale: {
      color: {
        range: ['#ff4d4f', '#1890ff', '#52c41a'],
      },
    },
  };

  // --- CẤU HÌNH BIỂU ĐỒ CỘT (v2) ---
  const columnConfig = {
    data: [
      { status: 'Total', count: stats.total },
      { status: 'Open', count: stats.open },
      { status: 'In Progress', count: stats.in_progress },
      { status: 'Resolved', count: stats.resolved },
    ],
    xField: 'status',
    yField: 'count',
    // Fix lỗi "middle": v2 dùng label.text và position trực quan hơn
    label: {
      text: 'count',
      position: 'top',
      style: {
        fill: '#000',
        dy: -10,
      },
    },
    style: {
      fill: ({ status }) => {
        if (status === 'Resolved') return '#52c41a';
        if (status === 'Open') return '#ff4d4f';
        return '#1890ff';
      },
      maxWidth: 40,
    },
    axis: {
      y: { labelFormatter: (v) => v.toFixed(0) },
    },
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    );
  }

  return (
    <div className="ticket-reports" style={{ padding: '20px' }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Ticket Analytics & Reports
      </Title>

      {/* 1. KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ background: '#e6f7ff', borderRadius: 12 }}>
            <Statistic
              title="Total Requests"
              value={stats.total}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ background: '#f6ffed', borderRadius: 12 }}>
            <Statistic
              title="Resolved"
              value={stats.resolved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ background: '#fff7e6', borderRadius: 12 }}>
            <Statistic
              title="Active"
              value={stats.in_progress + stats.open}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ background: '#fff1f0', borderRadius: 12 }}>
            <Statistic
              title="Critical"
              value={stats.critical}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 2. CHARTS */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <HistoryOutlined /> Ticket Volume Overview
              </Space>
            }
            variant="borderless"
            style={{ borderRadius: 12, minHeight: 450, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            {stats.total > 0 ? <Column {...columnConfig} height={350} /> : <Empty />}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <PieChartOutlined /> Status Distribution
              </Space>
            }
            variant="borderless"
            style={{ borderRadius: 12, minHeight: 450, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            {stats.total > 0 ? <Pie {...pieConfig} height={350} /> : <Empty />}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const Space = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{children}</div>
);

export default TicketReports;

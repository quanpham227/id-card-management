import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Statistic, Empty, Spin, message, Typography } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import axiosClient from '../../../api/axiosClient';

const { Title } = Typography;

const COLORS = {
  Pregnancy: '#ff4d4f', // Red
  HasBaby: '#722ed1',   // Purple
  Normal: '#1890ff',    // Blue
  Tools: '#faad14'      // Gold
};

const CHART_HEIGHT = 350;

const PrintStatistics = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false); // Fix Recharts width/height -1 warning
  
  const [summary, setSummary] = useState({ total: 0, pregnancy: 0, hasBaby: 0, tools: 0, normal: 0 });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/print/stats');
      const result = res.data;

      if (Array.isArray(result)) {
        setData(result);
        const pregnancy = result.reduce((acc, curr) => acc + (curr.Pregnancy || 0), 0);
        const hasBaby = result.reduce((acc, curr) => acc + (curr.HasBaby || 0), 0);
        const tools = result.reduce((acc, curr) => acc + (curr.Tools || 0), 0);
        const total = result.reduce((acc, curr) => acc + (curr.total || 0), 0);
        const normal = total - pregnancy - hasBaby - tools;

        setSummary({ total, pregnancy, hasBaby, tools, normal });
      }
    } catch {
      message.error("Failed to load statistics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    setIsMounted(true); // Đánh dấu đã mount xong để vẽ biểu đồ an toàn
  }, []);

  const pieData = useMemo(() => [
    { name: 'Maternity', value: summary.pregnancy, color: COLORS.Pregnancy },
    { name: 'Child Care', value: summary.hasBaby, color: COLORS.HasBaby },
    { name: 'Standard', value: summary.normal, color: COLORS.Normal },
    { name: 'Tools', value: summary.tools, color: COLORS.Tools },
  ].filter(v => v.value > 0), [summary]);

  if (loading) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
  if (data.length === 0) return <Card><Empty description="No print data available" /></Card>;

  return (
    <div style={{ padding: '10px 0' }}>
      <Title level={4} style={{ marginBottom: 20 }}>Print Classification Report</Title>

      {/* KEY METRICS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={4}> 
          <Card variant="borderless" style={{ background: '#fff1f0', borderLeft: `4px solid ${COLORS.Pregnancy}` }}>
            <Statistic title="Maternity" value={summary.pregnancy} valueStyle={{ color: COLORS.Pregnancy, fontWeight: 800 }} />
          </Card>
        </Col>
        <Col xs={12} sm={4}>
          <Card variant="borderless" style={{ background: '#f9f0ff', borderLeft: `4px solid ${COLORS.HasBaby}` }}>
            <Statistic title="Child Care" value={summary.hasBaby} valueStyle={{ color: COLORS.HasBaby, fontWeight: 800 }} />
          </Card>
        </Col>
        <Col xs={12} sm={4}>
          <Card variant="borderless" style={{ background: '#e6f7ff', borderLeft: `4px solid ${COLORS.Normal}` }}>
            <Statistic title="Standard" value={summary.normal} valueStyle={{ color: COLORS.Normal, fontWeight: 800 }} />
          </Card>
        </Col>
        <Col xs={12} sm={4}>
          <Card variant="borderless" style={{ background: '#fffbe6', borderLeft: `4px solid ${COLORS.Tools}` }}>
            <Statistic title="Tools" value={summary.tools} valueStyle={{ color: COLORS.Tools, fontWeight: 800 }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}> 
          <Card variant="borderless" style={{ background: '#f0f2f5', borderLeft: `4px solid #595959` }}>
            <Statistic title="TOTAL" value={summary.total} valueStyle={{ color: '#000', fontWeight: 800 }} />
          </Card>
        </Col>
      </Row>

      {/* DETAILED CHARTS */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card title="Monthly Print Analysis" variant="borderless" hoverable>
            <div style={{ width: '100%', height: CHART_HEIGHT, minHeight: CHART_HEIGHT }}>
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                    <Legend verticalAlign="top" align="right" iconType="circle" height={40} />
                    <Bar name="Maternity" dataKey="Pregnancy" stackId="a" fill={COLORS.Pregnancy} barSize={35} />
                    <Bar name="Child Care" dataKey="HasBaby" stackId="a" fill={COLORS.HasBaby} />
                    <Bar name="Standard" dataKey="Normal" stackId="a" fill={COLORS.Normal} />
                    <Bar name="Tools" dataKey="Tools" stackId="a" fill={COLORS.Tools} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Card Type Distribution" variant="borderless" hoverable>
            <div style={{ width: '100%', height: CHART_HEIGHT, minHeight: CHART_HEIGHT }}>
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={70} outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PrintStatistics;
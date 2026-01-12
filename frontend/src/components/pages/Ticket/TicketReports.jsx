import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Skeleton,
  message,
  Empty,
  DatePicker,
  Button,
  Space,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  PieChartOutlined,
  FireOutlined,
  HistoryOutlined,
  DownloadOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { Column, Pie } from '@ant-design/plots';
import axiosClient from '../../../api/axiosClient';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const TicketReports = () => {
  const [loading, setLoading] = useState(true);

  // State lưu khoảng thời gian lọc (Mặc định là 30 ngày gần nhất hoặc tháng này)
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'), // Từ đầu tháng
    dayjs().endOf('month'), // Đến cuối tháng
  ]);

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    critical: 0,
  });

  // --- 1. HÀM LẤY DATA (Có tham số ngày) ---
  const fetchStats = async () => {
    setLoading(true);
    try {
      // Tạo object params rỗng trước
      const params = {};

      // Chỉ thêm vào nếu dateRange hợp lệ
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      const res = await axiosClient.get('/tickets/stats/summary', { params });
      setStats(res.data || res);
    } catch (error) {
      // Log lỗi ra để xem
      console.error('Fetch Stats Error:', error.response?.data || error);
      message.error('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  // Gọi API mỗi khi user đổi ngày (dateRange thay đổi)
  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  // --- 2. HÀM XUẤT EXCEL/CSV ---
  const handleExport = async () => {
    try {
      message.loading('Đang tạo file Excel...', 1);

      // --- 1. SỬA LỖI 422: CHỈ GỬI DỮ LIỆU SẠCH ---
      // Tạo object rỗng trước
      const params = {};

      // Chỉ thêm start_date/end_date VÀO params NẾU nó có giá trị thật sự
      if (dateRange && dateRange[0]) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
      }
      if (dateRange && dateRange[1]) {
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      // Lúc này params sẽ là {} hoặc {start_date: "...", end_date: "..."}
      // Không bao giờ bị {start_date: null} -> Backend sẽ không báo lỗi 422 nữa.

      const response = await axiosClient.get('/tickets/export', {
        params,
        responseType: 'blob', // Quan trọng: Nhận dữ liệu nhị phân
      });

      // Tạo link tải xuống
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Đặt tên file
      const startStr = params.start_date || 'All';
      const endStr = params.end_date || 'All';
      const fileName = `Report_${startStr}_to_${endStr}.xlsx`;

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      message.success('Xuất file Excel thành công!');
    } catch (error) {
      // Logic đọc lỗi thông minh hơn
      if (error.response && error.response.data instanceof Blob) {
        // Nếu server trả về Blob (file lỗi), cần đọc nó ra text
        const errorText = await error.response.data.text();
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Lỗi từ Server:', errorJson);
          // Hiển thị chi tiết lỗi đầu tiên tìm thấy
          const msg = errorJson.detail?.[0]?.msg || errorJson.detail || 'Lỗi không xác định';
          message.error(`Lỗi xuất file: ${msg}`);
        } catch {
          message.error(`Lỗi xuất file: ${errorText}`);
        }
      } else {
        console.error(error);
        message.error('Có lỗi xảy ra khi kết nối server.');
      }
    }
  };

  // --- CONFIG CHART (GIỮ NGUYÊN NHƯ CŨ) ---
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
    label: { text: 'value', position: 'outside', style: { fontWeight: 'bold' } },
    legend: { color: { position: 'right', itemMarker: 'circle' } },
    scale: { color: { range: ['#ff4d4f', '#1890ff', '#52c41a'] } },
  };

  const columnConfig = {
    data: [
      { status: 'Total', count: stats.total },
      { status: 'Open', count: stats.open },
      { status: 'In Progress', count: stats.in_progress },
      { status: 'Resolved', count: stats.resolved },
    ],
    xField: 'status',
    yField: 'count',
    label: { text: 'count', position: 'top', style: { fill: '#000', dy: -10 } },
    style: {
      fill: ({ status }) => {
        if (status === 'Resolved') return '#52c41a';
        if (status === 'Open') return '#ff4d4f';
        return '#1890ff';
      },
      maxWidth: 40,
    },
    axis: { y: { labelFormatter: (v) => v.toFixed(0) } },
  };

  return (
    <div className="ticket-reports" style={{ padding: '20px' }}>
      {/* HEADER + FILTERS */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Ticket Analytics
        </Title>

        {/* THANH CÔNG CỤ LỌC & XUẤT */}

        <Space>
          <Text strong>
            <CalendarOutlined /> Filter Period:
          </Text>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            presets={[
              { label: 'This Month', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
              {
                label: 'Last Month',
                value: [
                  dayjs().subtract(1, 'month').startOf('month'),
                  dayjs().subtract(1, 'month').endOf('month'),
                ],
              },
              { label: 'This Year', value: [dayjs().startOf('year'), dayjs().endOf('year')] },
            ]}
          />
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
            Export Excel
          </Button>
        </Space>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 12 }} />
      ) : (
        <>
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
                    <HistoryOutlined /> Ticket Volume (
                    {dateRange
                      ? `${dateRange[0].format('DD/MM')} - ${dateRange[1].format('DD/MM')}`
                      : 'All Time'}
                    )
                  </Space>
                }
                variant="borderless"
                style={{ borderRadius: 12, minHeight: 450 }}
              >
                {stats.total > 0 ? (
                  <Column {...columnConfig} height={350} />
                ) : (
                  <Empty description="No data in this period" />
                )}
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
                style={{ borderRadius: 12, minHeight: 450 }}
              >
                {stats.total > 0 ? (
                  <Pie {...pieConfig} height={350} />
                ) : (
                  <Empty description="No data in this period" />
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default TicketReports;

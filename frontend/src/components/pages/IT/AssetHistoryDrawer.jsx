import React, { useState, useEffect } from 'react';
import { Drawer, Timeline, Typography, Tag, Space, Button, Divider, Row, Col, Avatar, Form, Select, Input, DatePicker, message, Flex, Spin } from 'antd';
import { 
  ShoppingCartOutlined, UserOutlined, ToolOutlined, HistoryOutlined,
  SyncOutlined, PlusOutlined, SaveOutlined, CloseOutlined, LoadingOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
// [QUAN TRỌNG] Import axios để gọi API
import axiosClient from '../../../api/axiosClient';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AssetHistoryDrawer = ({ open, onClose, asset, canEdit }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false); // Loading khi tải danh sách
  const [historyList, setHistoryList] = useState([]); // Danh sách lịch sử
  const [form] = Form.useForm();

  // --- 1. TẢI DỮ LIỆU TỪ DB KHI MỞ DRAWER ---
  useEffect(() => {
    if (open && asset?.id) {
      fetchHistory();
    } else {
      setHistoryList([]); // Reset khi đóng
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, asset]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Gọi API lấy lịch sử: GET /api/assets/{id}/history
      const res = await axiosClient.get(`/api/assets/${asset.id}/history`);
      if (Array.isArray(res.data)) {
        setHistoryList(res.data);
      }
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
      message.error("Không thể tải lịch sử thiết bị");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. LƯU DỮ LIỆU VÀO DB ---
  const handleSaveEvent = async (values) => {
    try {
      // Chuẩn bị dữ liệu gửi lên Backend
      const payload = {
        date: values.date.format('YYYY-MM-DD'),
        action_type: values.type,    // Backend dùng 'action_type'
        description: values.desc,
        performed_by: 'IT Admin'     // Tạm thời để cứng hoặc lấy từ localStorage user
      };

      // Gọi API lưu: POST /api/assets/{id}/history
      await axiosClient.post(`/api/assets/${asset.id}/history`, payload);
      
      message.success('Đã lưu lịch sử thành công!');
      setIsAdding(false);
      form.resetFields();
      
      // Tải lại danh sách để cập nhật dữ liệu mới nhất từ DB
      fetchHistory();

    } catch (error) {
      console.error("Lỗi lưu lịch sử:", error);
      message.error("Lưu thất bại!");
    }
  };

  // --- HELPER FUNCTIONS (Hiển thị đẹp) ---
  const getTitleByType = (type) => {
    const map = {
      'repair': 'Maintenance / Repair',
      'upgrade': 'Hardware Upgrade',
      'software': 'Software Update',
      'note': 'General Note',
      'purchase': 'Procured / Purchased', // Thêm mapping cho các loại tự động
      'assign': 'Handover / Assign',
      'checkin': 'Returned to Stock',
      'broken': 'Reported Broken',
      'status_change': 'Status Changed'
    };
    return map[type] || 'Activity Log';
  };

  const getIcon = (type) => {
    switch (type) {
      case 'purchase': return <ShoppingCartOutlined style={{ fontSize: 16 }} />;
      case 'assign': 
      case 'checkin': return <UserOutlined style={{ fontSize: 16 }} />;
      case 'repair': 
      case 'broken': return <ToolOutlined style={{ fontSize: 16 }} />;
      case 'upgrade': return <SyncOutlined style={{ fontSize: 16 }} />;
      default: return <HistoryOutlined style={{ fontSize: 16 }} />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'purchase': return 'blue';
      case 'assign': return 'green';
      case 'checkin': return 'orange';
      case 'repair': 
      case 'broken': return 'red';
      case 'upgrade': return 'purple';
      default: return 'gray';
    }
  };

  if (!asset) return null;

  // Chuyển đổi dữ liệu API sang format Timeline của Antd
  const timelineItems = historyList.map((ev, index) => ({
    key: ev.id || index, // Dùng ID từ DB làm key
    color: getColor(ev.action_type), // Backend trả về action_type
    dot: getIcon(ev.action_type),
    label: <Text type="secondary" style={{fontSize: 12}}>{dayjs(ev.date).format('DD/MM/YY')}</Text>,
    children: (
      <>
        <Text strong>{getTitleByType(ev.action_type)}</Text>
        <br />
        <Text style={{ fontSize: 13, color: '#595959' }}>{ev.description}</Text>
        <div style={{ marginTop: 4, fontSize: 11, color: '#bfbfbf' }}>
           By: {ev.performed_by}
        </div>
      </>
    )
  }));

  return (
    <Drawer
      title={
        <Space>
          <HistoryOutlined />
          <span>Asset Lifecycle History</span>
        </Space>
      }
      width={600}
      onClose={onClose}
      open={open}
      styles={{ body: { paddingBottom: 80 } }}
      extra={
        canEdit && !isAdding && (
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setIsAdding(true)}>
            Add Log
          </Button>
        )
      }
    >
      {/* HEADER INFO */}
      <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <Row align="middle" gutter={16}>
            <Col>
                 <Avatar shape="square" size={64} style={{ backgroundColor: '#1890ff' }} icon={<HistoryOutlined />} />
            </Col>
            <Col flex="auto">
                <Title level={4} style={{ margin: 0 }}>{asset.model}</Title>
                <Space>
                    <Tag color="blue">{asset.asset_code}</Tag>
                    <Tag color={asset.usage_status === 'In Use' ? 'green' : 'orange'}>{asset.usage_status || 'Spare'}</Tag>
                </Space>
            </Col>
        </Row>
      </div>

      <Divider orientation="left">Activity Timeline</Divider>

      {/* FORM THÊM MỚI */}
      {isAdding && (
        <div style={{ marginBottom: 24, padding: 16, border: '1px dashed #1890ff', borderRadius: 8, background: '#f0f9ff' }}>
          <Text strong style={{display: 'block', marginBottom: 12}}>Log New Activity</Text>
          <Form form={form} layout="vertical" onFinish={handleSaveEvent} initialValues={{ date: dayjs(), type: 'note' }}>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="date" label="Date" rules={[{required: true}]}>
                  <DatePicker style={{width: '100%'}} format="DD/MM/YYYY"/>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="type" label="Activity Type">
                  <Select>
                    <Option value="note">General Note</Option>
                    <Option value="repair">Repair / Fix</Option>
                    <Option value="upgrade">Hardware Upgrade</Option>
                    <Option value="software">Software Install</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="desc" label="Description" rules={[{required: true, message: 'Please enter details'}]}>
              <TextArea rows={2} placeholder="e.g. Upgraded RAM to 16GB..." />
            </Form.Item>
            
            <Flex justify="end" gap={8}>
              <Button size="small" icon={<CloseOutlined />} onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="primary" size="small" icon={<SaveOutlined />} htmlType="submit">Save Log</Button>
            </Flex>
          </Form>
        </div>
      )}

      {/* TIMELINE HIỂN THỊ */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}><Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} /></div>
      ) : (
        <Timeline 
          mode="left"
          items={timelineItems} 
        />
      )}
      
      {!loading && historyList.length === 0 && (
         <div style={{textAlign: 'center', color: '#999', marginTop: 20}}>No history records found.</div>
      )}

    </Drawer>
  );
};

export default AssetHistoryDrawer;
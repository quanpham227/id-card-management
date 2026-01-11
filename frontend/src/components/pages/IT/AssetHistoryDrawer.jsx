import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Timeline,
  Typography,
  Tag,
  Space,
  Button,
  Divider,
  Row,
  Col,
  Avatar,
  Form,
  Select,
  Input,
  DatePicker,
  message,
  Flex,
  Spin,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  ShoppingCartOutlined,
  UserOutlined,
  ToolOutlined,
  HistoryOutlined,
  SyncOutlined,
  PlusOutlined,
  SaveOutlined,
  CloseOutlined,
  LoadingOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosClient from '../../../api/axiosClient';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AssetHistoryDrawer = ({ open, onClose, asset, canEdit }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  const [loading, setLoading] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [form] = Form.useForm();

  // --- 1. TẢI DỮ LIỆU ---
  useEffect(() => {
    if (open && asset?.id) {
      fetchHistory();
    } else {
      setHistoryList([]);
      // [FIX LỖI WARNING]: Khi đóng Drawer, chỉ reset state, KHÔNG gọi form.resetFields()
      // vì lúc này Drawer đã đóng, Form không còn tồn tại trên DOM.
      setIsFormVisible(false);
      setEditingLog(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, asset]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/assets/${asset.id}/history`);
      if (Array.isArray(res.data)) {
        // Sắp xếp giảm dần theo ngày (mới nhất lên đầu)
        const sorted = res.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setHistoryList(sorted);
      }
    } catch (error) {
      console.error('Lỗi tải lịch sử:', error);
      message.error('Không thể tải lịch sử thiết bị');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. XỬ LÝ LƯU (THÊM MỚI HOẶC CẬP NHẬT) ---
  const handleSaveEvent = async (values) => {
    try {
      const payload = {
        date: values.date.format('YYYY-MM-DD'),
        action_type: values.type,
        description: values.desc,
        performed_by: 'IT Admin',
      };

      if (editingLog) {
        // --- CASE UPDATE ---
        await axiosClient.put(`/assets/history/${editingLog.id}`, payload);
        message.success('Cập nhật lịch sử thành công!');
      } else {
        // --- CASE CREATE ---
        await axiosClient.post(`/assets/${asset.id}/history`, payload);
        message.success('Thêm lịch sử thành công!');
      }

      handleCancelForm();
      fetchHistory();
    } catch (error) {
      console.error('Lỗi lưu lịch sử:', error);
      message.error('Lưu thất bại! (Kiểm tra Backend đã có API Update chưa)');
    }
  };

  // --- 3. XỬ LÝ XÓA ---
  const handleDeleteLog = async (logId) => {
    try {
      await axiosClient.delete(`/assets/history/${logId}`);
      message.success('Đã xóa dòng lịch sử');
      fetchHistory();
    } catch (error) {
      console.error('Lỗi xóa:', error);
      message.error('Xóa thất bại!');
    }
  };

  // --- 4. CÁC HÀM TIỆN ÍCH FORM ---
  const handleEditClick = (logItem) => {
    setEditingLog(logItem);
    setIsFormVisible(true);
    // Cần set timeout nhỏ hoặc dùng setFieldsValue ngay lập tức nếu form đã mount
    // Do logic render có điều kiện {isFormVisible && ...}, Form chưa có ngay lập tức
    // Cách an toàn nhất cho Antd Form trong conditional render:
    setTimeout(() => {
      form.setFieldsValue({
        date: dayjs(logItem.date),
        type: logItem.action_type,
        desc: logItem.description,
      });
    }, 0);
  };

  const handleAddNewClick = () => {
    setEditingLog(null);
    setIsFormVisible(true);
    // Tương tự, reset fields sau khi form mount
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({ date: dayjs(), type: 'note' });
    }, 0);
  };

  const handleCancelForm = () => {
    // [FIX LỖI WARNING]: Reset form TRƯỚC khi ẩn form đi
    // Để đảm bảo instance form vẫn còn kết nối với DOM khi reset
    form.resetFields();

    // Sau đó mới ẩn
    setIsFormVisible(false);
    setEditingLog(null);
  };

  // --- HELPER UI ---
  const getTitleByType = (type) => {
    const map = {
      repair: 'Maintenance / Repair',
      upgrade: 'Hardware Upgrade',
      software: 'Software Update',
      note: 'General Note',
      purchase: 'Procured / Purchased',
      assign: 'Handover / Assign',
      checkin: 'Returned to Stock',
      broken: 'Reported Broken',
      status_change: 'Status Changed',
    };
    return map[type] || 'Activity Log';
  };

  const getIcon = (type) => {
    switch (type) {
      case 'purchase':
        return <ShoppingCartOutlined style={{ fontSize: 16 }} />;
      case 'assign':
      case 'checkin':
        return <UserOutlined style={{ fontSize: 16 }} />;
      case 'repair':
      case 'broken':
        return <ToolOutlined style={{ fontSize: 16 }} />;
      case 'upgrade':
        return <SyncOutlined style={{ fontSize: 16 }} />;
      default:
        return <HistoryOutlined style={{ fontSize: 16 }} />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'purchase':
        return 'blue';
      case 'assign':
        return 'green';
      case 'checkin':
        return 'orange';
      case 'repair':
      case 'broken':
        return 'red';
      case 'upgrade':
        return 'purple';
      default:
        return 'gray';
    }
  };

  if (!asset) return null;

  const timelineItems = historyList.map((ev, index) => ({
    key: ev.id || index,
    color: getColor(ev.action_type),
    dot: getIcon(ev.action_type),
    label: (
      <Text type="secondary" style={{ fontSize: 12 }}>
        {dayjs(ev.date).format('DD/MM/YY')}
      </Text>
    ),
    children: (
      <div className="timeline-item-content">
        <Flex justify="space-between" align="start">
          <div>
            <Text strong>{getTitleByType(ev.action_type)}</Text>
            <br />
            <Text style={{ fontSize: 13, color: '#595959' }}>{ev.description}</Text>
            <div style={{ marginTop: 4, fontSize: 11, color: '#bfbfbf' }}>
              By: {ev.performed_by}
            </div>
          </div>

          {canEdit && (
            <Space size="small">
              <Tooltip title="Edit">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined style={{ color: '#1890ff' }} />}
                  onClick={() => handleEditClick(ev)}
                />
              </Tooltip>

              <Popconfirm
                title="Delete this log?"
                description="Are you sure?"
                onConfirm={() => handleDeleteLog(ev.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          )}
        </Flex>
      </div>
    ),
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
        canEdit &&
        !isFormVisible && (
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddNewClick}>
            Add Log
          </Button>
        )
      }
    >
      <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <Row align="middle" gutter={16}>
          <Col>
            <Avatar
              shape="square"
              size={64}
              style={{ backgroundColor: '#1890ff' }}
              icon={<HistoryOutlined />}
            />
          </Col>
          <Col flex="auto">
            <Title level={4} style={{ margin: 0 }}>
              {asset.model}
            </Title>
            <Space>
              <Tag color="blue">{asset.asset_code}</Tag>
              <Tag color={asset.usage_status === 'In Use' ? 'green' : 'orange'}>
                {asset.usage_status || 'Spare'}
              </Tag>
            </Space>
          </Col>
        </Row>
      </div>

      <Divider orientation="left">Activity Timeline</Divider>

      {/* FORM: DÙNG CHUNG CHO ADD VÀ EDIT */}
      {isFormVisible && (
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            border: `1px dashed ${editingLog ? '#faad14' : '#1890ff'}`,
            borderRadius: 8,
            background: editingLog ? '#fffbe6' : '#f0f9ff',
          }}
        >
          <Text strong style={{ display: 'block', marginBottom: 12 }}>
            {editingLog ? 'Edit Activity Log' : 'Log New Activity'}
          </Text>
          <Form form={form} layout="vertical" onFinish={handleSaveEvent}>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="type" label="Activity Type">
                  <Select>
                    <Option value="note">General Note</Option>
                    <Option value="repair">Repair / Fix</Option>
                    <Option value="upgrade">Hardware Upgrade</Option>
                    <Option value="software">Software Install</Option>
                    <Option value="purchase">Purchase</Option>
                    <Option value="assign">Assign</Option>
                    <Option value="broken">Broken</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="desc"
              label="Description"
              rules={[{ required: true, message: 'Please enter details' }]}
            >
              <TextArea rows={2} placeholder="e.g. Upgraded RAM to 16GB..." />
            </Form.Item>

            <Flex justify="end" gap={8}>
              <Button size="small" icon={<CloseOutlined />} onClick={handleCancelForm}>
                Cancel
              </Button>
              <Button type="primary" size="small" icon={<SaveOutlined />} htmlType="submit">
                {editingLog ? 'Update' : 'Save'}
              </Button>
            </Flex>
          </Form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        </div>
      ) : (
        <Timeline mode="left" items={timelineItems} />
      )}

      {!loading && historyList.length === 0 && (
        <div style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>
          No history records found.
        </div>
      )}
    </Drawer>
  );
};

export default AssetHistoryDrawer;

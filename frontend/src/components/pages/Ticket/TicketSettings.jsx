import React, { useState } from 'react';
import { 
  Card, Tabs, Table, Button, Tag, Space, Switch, Modal, Form, Input, Select, Typography, message 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined, ClockCircleOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const TicketSettings = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  // --- MOCK DATA: DANH MỤC LỖI ---
  const [categories, setCategories] = useState([
    { key: '1', name: 'Phần cứng (Hardware)', code: 'HW', status: true },
    { key: '2', name: 'Phần mềm (Software)', code: 'SW', status: true },
    { key: '3', name: 'Mạng / Internet', code: 'NET', status: true },
    { key: '4', name: 'Máy in (Printer)', code: 'PRT', status: true },
    { key: '5', name: 'Yêu cầu cấp mới', code: 'REQ', status: false },
  ]);

  // --- MOCK DATA: MỨC ĐỘ ƯU TIÊN ---
  const priorities = [
    { key: '1', level: 'Low', color: 'green', sla: '48h' },
    { key: '2', level: 'Medium', color: 'blue', sla: '24h' },
    { key: '3', level: 'High', color: 'orange', sla: '8h' },
    { key: '4', level: 'Critical', color: 'red', sla: '2h' },
  ];

  // Cột cho bảng Categories
  const categoryColumns = [
    { title: 'Tên Danh Mục', dataIndex: 'name', key: 'name', render: (text) => <strong>{text}</strong> },
    { title: 'Mã Code', dataIndex: 'code', key: 'code', render: (text) => <Tag>{text}</Tag> },
    { 
      title: 'Trạng thái', dataIndex: 'status', key: 'status', 
      render: (status) => <Switch checked={status} size="small" /> 
    },
    {
      title: 'Hành động', key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} type="text" />
          <Button icon={<DeleteOutlined />} type="text" danger />
        </Space>
      ),
    },
  ];

  // Cột cho bảng Priorities
  const priorityColumns = [
    { 
        title: 'Mức độ', dataIndex: 'level', key: 'level', 
        render: (text, record) => <Tag color={record.color}>{text.toUpperCase()}</Tag> 
    },
    { 
        title: 'Cam kết xử lý (SLA)', dataIndex: 'sla', key: 'sla',
        render: (text) => <span><ClockCircleOutlined /> {text}</span>
    },
    {
        title: 'Màu hiển thị', dataIndex: 'color', key: 'color',
        render: (color) => <div style={{ width: 20, height: 20, background: color, borderRadius: 4 }}></div>
    }
  ];

  // Nội dung Tab 1: Quản lý danh mục
  const CategoryTab = () => (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Text>Định nghĩa các loại sự cố mà người dùng có thể chọn.</Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Thêm Danh Mục
        </Button>
      </div>
      <Table dataSource={categories} columns={categoryColumns} pagination={false} />
    </div>
  );

  // Nội dung Tab 2: Quản lý SLA
  const PriorityTab = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Text>Cấu hình thời gian cam kết xử lý (SLA) cho từng mức độ ưu tiên.</Text>
      </div>
      <Table dataSource={priorities} columns={priorityColumns} pagination={false} />
    </div>
  );

  const items = [
    { key: '1', label: 'Danh Mục Lỗi', children: <CategoryTab /> },
    { key: '2', label: 'Priority & SLA', children: <PriorityTab /> },
  ];

  return (
    <Card 
      title={<Space><SettingOutlined /> Cấu Hình Ticket System</Space>}
      style={{ borderRadius: 8 }}
    >
      <Tabs defaultActiveKey="1" items={items} />

      {/* Modal thêm danh mục (Giao diện mẫu) */}
      <Modal 
        title="Thêm Danh Mục Mới" 
        open={isModalVisible} 
        onOk={() => {
            message.success('Thêm thành công (Demo)');
            setIsModalVisible(false);
        }} 
        onCancel={() => setIsModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="Tên danh mục" required><Input placeholder="Ví dụ: Sự cố mạng" /></Form.Item>
          <Form.Item label="Mã Code" required><Input placeholder="VD: NET" /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default TicketSettings;
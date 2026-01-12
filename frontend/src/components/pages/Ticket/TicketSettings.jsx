import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Tag,
  Space,
  Switch,
  Typography,
  message,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import axiosClient from '../../../api/axiosClient';
import TicketCategoryModal from './TicketCategoryModal';
import { PRIORITY_LEVELS } from '../../../constants/constants';

const { Text } = Typography;

const TicketSettings = () => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // --- 1. FETCH DATA (CATEGORIES) ---
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/ticket-categories');
      const safeData = Array.isArray(res)
        ? res
        : res?.data && Array.isArray(res.data)
          ? res.data
          : [];
      setCategories(safeData);
    } catch (error) {
      console.error(error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- 2. DATA & COLUMNS FOR PRIORITY TAB (Tab 2) ---
  // Chuyển đổi Object PRIORITY_LEVELS thành Array để hiển thị trong Table
  const priorityData = Object.entries(PRIORITY_LEVELS).map(([key, value]) => ({
    key: key,
    level: key,
    ...value,
  }));

  const priorityColumns = [
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      align: 'center',
      render: (lvl) => <Text strong>{lvl}</Text>,
    },
    {
      title: 'Priority Name',
      dataIndex: 'label',
      key: 'label',
      width: 150,
      render: (text, record) => <Tag color={record.color}>{text}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'desc',
      key: 'desc',
    },
    {
      title: 'SLA Target',
      dataIndex: 'sla',
      key: 'sla',
      width: 120,
      render: (text) => (
        <Tag icon={<ClockCircleOutlined />} color="default">
          {text || 'N/A'}
        </Tag>
      ),
    },
  ];

  // --- 3. ACTIONS ---
  const handleOpenModal = (category = null) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      // Gọi API xóa
      const res = await axiosClient.delete(`/ticket-categories/${id}`);

      // Lấy status trả về từ backend (deleted hoặc archived)
      // Tùy vào interceptor của bạn mà dữ liệu nằm ở res hoặc res.data
      const status = res.status || res.data?.status;

      if (status === 'archived') {
        // Trường hợp Soft Delete
        message.warning(
          'Danh mục này đang được sử dụng bởi các Ticket cũ -> Hệ thống đã chuyển sang trạng thái "Ẩn" (Archived) để bảo toàn dữ liệu.'
        );
      } else {
        // Trường hợp Hard Delete
        message.success('Đã xóa vĩnh viễn danh mục (Do chưa có dữ liệu liên quan).');
      }

      // Tải lại danh sách
      fetchCategories();
    } catch (error) {
      console.error(error);
      message.error('Có lỗi xảy ra khi xóa danh mục.');
    }
  };

  const handleToggleStatus = async (record, checked) => {
    // Optimistic Update (Cập nhật giao diện trước khi gọi API cho mượt)
    const originalCategories = [...categories];
    setCategories(categories.map((c) => (c.id === record.id ? { ...c, is_active: checked } : c)));

    try {
      await axiosClient.put(`/ticket-categories/${record.id}`, { is_active: checked });
      message.success('Status updated successfully');
    } catch {
      setCategories(originalCategories); // Revert nếu lỗi
      message.error('Failed to update status');
    }
  };

  // --- 4. TABLE COLUMNS (CATEGORIES) ---
  const categoryColumns = [
    { title: 'Category Name', dataIndex: 'name', key: 'name', render: (t) => <b>{t}</b> },
    { title: 'Code', dataIndex: 'code', key: 'code', render: (t) => <Tag color="blue">{t}</Tag> },
    { title: 'Description', dataIndex: 'description', key: 'desc', ellipsis: true },
    {
      title: 'SLA',
      dataIndex: 'sla_hours',
      key: 'sla',
      render: (t) => <Tag icon={<ClockCircleOutlined />}>{t}h</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'status',
      render: (val, record) => (
        <Switch
          size="small"
          checked={val}
          onChange={(c) => handleToggleStatus(record, c)}
          checkedChildren="Active"
          unCheckedChildren="Archived"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      align: 'center',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} size="small" onClick={() => handleOpenModal(record)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete this category?"
              description={
                record.is_active
                  ? 'If used, it will be archived. If not, it will be deleted permanently.'
                  : 'Delete permanently?'
              }
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // --- 5. RENDER ---
  return (
    <div className="layout-content">
      <Card
        title={
          <Space>
            <SettingOutlined /> Ticket System Configuration
          </Space>
        }
      >
        <Tabs
          items={[
            {
              key: '1',
              label: 'Ticket Categories',
              children: (
                <>
                  <div
                    style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Text type="secondary">Manage types of issues users can report.</Text>
                    <Space>
                      <Button icon={<ReloadOutlined />} onClick={fetchCategories} />
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => handleOpenModal(null)}
                      >
                        Add New
                      </Button>
                    </Space>
                  </div>
                  <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={categories}
                    columns={categoryColumns}
                    pagination={{ pageSize: 8 }}
                  />
                </>
              ),
            },
            {
              key: '2',
              label: 'Priority & SLA',
              children: (
                <div style={{ marginTop: 10 }}>
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">
                      Reference table for Priority Levels and Service Level Agreements (SLA). These
                      values are defined in system constants.
                    </Text>
                  </div>
                  <Table
                    columns={priorityColumns}
                    dataSource={priorityData}
                    pagination={false}
                    bordered
                    size="middle"
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Modal Component */}
      <TicketCategoryModal
        open={isModalOpen}
        initialValues={editingCategory}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCategories}
      />
    </div>
  );
};

export default TicketSettings;

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

const { Text } = Typography;

const TicketSettings = () => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // --- 1. FETCH DATA ---
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

  // --- 2. ACTIONS ---
  const handleOpenModal = (category = null) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`/ticket-categories/${id}`);
      message.success('Category deleted successfully');
      fetchCategories();
    } catch {
      message.error('Failed to delete category (it might be in use)');
    }
  };

  const handleToggleStatus = async (record, checked) => {
    // Optimistic Update
    const originalCategories = [...categories];
    setCategories(categories.map((c) => (c.id === record.id ? { ...c, is_active: checked } : c)));

    try {
      await axiosClient.put(`/ticket-categories/${record.id}`, { is_active: checked });
      message.success('Status updated successfully');
    } catch {
      setCategories(originalCategories); // Revert on error
      message.error('Failed to update status');
    }
  };

  // --- 3. TABLE COLUMNS ---
  const columns = [
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
        <Switch size="small" checked={val} onChange={(c) => handleToggleStatus(record, c)} />
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

  // --- 4. RENDER ---
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
                    columns={columns}
                    pagination={{ pageSize: 8 }}
                  />
                </>
              ),
            },
            {
              key: '2',
              label: 'Priority & SLA',
              children: (
                <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                  Priority Reference Table (Static)
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

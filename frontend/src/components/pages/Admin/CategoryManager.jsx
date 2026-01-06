import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm, Card, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined } from '@ant-design/icons';
import axiosClient from '../../../api/axiosClient';
import { useCategories } from '../../../context/CategoryProvider';

const { Title } = Typography;
const { TextArea } = Input;

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Context
    const { fetchCategories: reloadGlobalCategories } = useCategories();

    // State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    // [QUAN TRỌNG] Tạo instance form
    const [form] = Form.useForm();

    // Load dữ liệu
    useEffect(() => {
        fetchLocalCategories();
    }, []);

    const fetchLocalCategories = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/categories');
            setCategories(res.data);
        } catch (error) {
            console.error(error);
            message.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    // [FIX LỖI WARNING]: Dùng useEffect để điền form KHI modal đã mở
    useEffect(() => {
        if (isModalOpen) {
            // Reset form trước để tránh lưu dữ liệu cũ (quan trọng)
            form.resetFields();
            
            if (editingCategory) {
                // Nếu đang sửa -> Điền dữ liệu vào
                form.setFieldsValue(editingCategory);
            }
        }
    }, [isModalOpen, editingCategory, form]);

    const handleSave = async (values) => {
        setSubmitting(true);
        try {
            const payload = {
                ...values,
                code: values.code.toUpperCase().trim(),
                name: values.name.trim()
            };

            if (editingCategory) {
                await axiosClient.put(`/categories/${editingCategory.id}`, payload);
                message.success("Category updated successfully");
            } else {
                await axiosClient.post('/categories', payload);
                message.success("Category created successfully");
            }

            setIsModalOpen(false);
            
            fetchLocalCategories(); 
            reloadGlobalCategories(); 
            
        } catch (error) {
            const errorMsg = error.response?.data?.detail || "Action failed";
            message.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axiosClient.delete(`/categories/${id}`);
            message.success("Category deleted");
            fetchLocalCategories(); 
            reloadGlobalCategories(); 
        } catch (error) {
            const errorMsg = error.response?.data?.detail || "Delete failed";
            message.error(errorMsg);
        }
    };

    // Mở Modal (Chỉ set state, không set form ở đây nữa)
    const openModal = (record = null) => {
        setEditingCategory(record);
        setIsModalOpen(true);
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', width: 60, align: 'center' },
        { title: 'Code', dataIndex: 'code', width: 100, render: (text) => <b style={{ color: '#1890ff' }}>{text}</b> },
        { title: 'Name', dataIndex: 'name', width: 200, fontWeight: 'bold' },
        { title: 'Description', dataIndex: 'description', ellipsis: true },
        {
            title: 'Action', key: 'action', width: 150, align: 'center',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openModal(record)} />
                    <Popconfirm 
                        title="Delete?" 
                        description="Cannot undo."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes" cancelText="No"
                    >
                        <Button icon={<DeleteOutlined />} size="small" danger />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0 }}>
                    <AppstoreOutlined /> Category Management
                </Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null)}>
                    Add New Category
                </Button>
            </div>

            <Card variant="borderless" styles={{ body: { padding: 0 } }}>
                <Table 
                    columns={columns} 
                    dataSource={categories} 
                    rowKey="id" 
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    bordered
                />
            </Card>

            <Modal
                title={editingCategory ? "Edit Category" : "Add New Category"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnHidden // Form bị hủy khi đóng
            >
                {/* [QUAN TRỌNG] Phải truyền form={form} vào đây */}
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item 
                        name="name" 
                        label="Category Name" 
                        rules={[{ required: true, message: 'Required' }]}
                    >
                        <Input placeholder="e.g. Projector" />
                    </Form.Item>

                    <Form.Item 
                        name="code" 
                        label="Category Code" 
                        rules={[{ required: true, message: 'Required' }]}
                        help="Unique code (e.g. PROJ)"
                    >
                        <Input placeholder="e.g. PROJ" maxLength={10} style={{ textTransform: 'uppercase' }} />
                    </Form.Item>

                    <Form.Item name="description" label="Description">
                        <TextArea rows={3} />
                    </Form.Item>

                    <div style={{ textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={submitting}>
                                {editingCategory ? "Update" : "Create"}
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default CategoryManager;
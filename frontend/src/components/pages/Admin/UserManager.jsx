// src/pages/Admin/UserManager.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Popconfirm, message, Card, Avatar, Tooltip } from 'antd';
import { UserAddOutlined, DeleteOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import axiosClient from '../../../api/axiosClient';
import { PERMISSIONS } from '../../utils/permissions'; 

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 1. Get current session user
  const currentUser = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  
  // 2. Define administrative permission
  // [CẬP NHẬT] Đổi từ IS_ADMIN thành IS_SYSTEM_ADMIN
  const canEdit = PERMISSIONS.IS_SYSTEM_ADMIN(currentUser.role);

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/users');
      // Flexible data extraction
      const data = res.data?.users || res.data?.data || res.data;
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      message.error("Could not load user list");
      setUsers([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- HANDLE CREATE (WITH DUPLICATE CHECK) ---
  const handleCreate = async (values) => {
    // A. CLIENT-SIDE VALIDATION: Check for duplicate username immediately
    const isUsernameDuplicate = users.some(
        u => u.username.toLowerCase() === values.username.trim().toLowerCase()
    );

    if (isUsernameDuplicate) {
        // Show error directly on the input field
        form.setFields([
            {
                name: 'username',
                errors: ['This username is already taken!'],
            },
        ]);
        message.error("Username already exists in the system.");
        return; // Stop execution, do not call API
    }

    // B. SERVER-SIDE EXECUTION
    setSubmitting(true);
    try {
      await axiosClient.post('/users', values);
      message.success("Account created successfully!");
      setIsModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.detail || "Error creating account";
      
      // If server returns a specific duplicate error (backup check)
      if (msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('duplicate')) {
        form.setFields([
            { name: 'username', errors: ['Username taken (Server check)'] }
        ]);
      } else {
        message.error(msg);
      }
    } finally { setSubmitting(false); }
  };

  // --- HANDLE DELETE ---
  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`/users/${id}`);
      message.success("Account deleted");
      fetchData();
    } catch {
      message.error("Delete failed");
    }
  }

  // --- TABLE COLUMN CONFIG ---
  const columns = [
    { 
        title: 'User', 
        key: 'avatar',
        width: 80,
        align: 'center',
        render: () => <Avatar icon={<UserOutlined />} style={{backgroundColor: '#1890ff'}}/>
    },
    { 
        title: 'Full Name', 
        dataIndex: 'full_name', 
        key: 'full_name',
        render: (text) => <span style={{fontWeight: 600}}>{text}</span>
    },
    { 
        title: 'Username', 
        dataIndex: 'username', 
        key: 'username',
        render: (text) => <Tag color="blue">{text}</Tag>
    },
    { 
      title: 'Role', 
      dataIndex: 'role', 
      render: (role) => {
        let color = 'default';
        const r = role ? role.toUpperCase() : 'USER';

        if (r === 'ADMIN') color = 'red';
        else if (r === 'MANAGER') color = 'gold'; // Đã xóa IT
        else if (r === 'HR') color = 'purple';
        else if (r === 'STAFF') color = 'cyan';

        return <Tag color={color} style={{fontWeight: 'bold'}}>{r}</Tag>;
      } 
    },
    // Only show Action column if the logged-in user is an Admin/Manager/IT
    ...(canEdit ? [{
      title: 'Action',
      align: 'center',
      render: (_, record) => {
        const isSelf = record.username === currentUser.username;
        // PROTECT ROOT ACCOUNT: Prevents deletion of the 'admin' user
        const isRootAccount = record.username === 'admin'; 
        
        const cannotDelete = isSelf || isRootAccount;

        return (
          <Tooltip title={isRootAccount ? "Cannot delete Root Admin" : isSelf ? "You cannot delete yourself" : ""}>
            <span>
              <Popconfirm 
                title={`Delete user "${record.username}"?`}
                description="This action cannot be undone."
                onConfirm={() => handleDelete(record.id)}
                disabled={cannotDelete}
                okText="Yes"
                cancelText="No"
              >
                <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    disabled={cannotDelete} 
                />
              </Popconfirm>
            </span>
          </Tooltip>
        )
      }
    }] : [])
  ];

  return (
    <Card
        variant="borderless" 
        title={<span><SettingOutlined /> System Account Management</span>} 
        style={{borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}
        extra={
            canEdit && (
                <Button type="primary" icon={<UserAddOutlined />} onClick={() => setIsModalOpen(true)}>
                    Add New User
                </Button>
            )
        }
    >
      <Table 
        dataSource={users} 
        columns={columns} 
        rowKey="id" 
        loading={loading} 
        pagination={{ pageSize: 10 }}
      />
      
      <Modal 
        title="Create New Account" 
        open={isModalOpen} 
        onOk={() => form.submit()} 
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        okText="Create Account"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="full_name" label="Full Name" rules={[{required: true, message: 'Please enter full name'}]}>
            <Input placeholder="e.g., John Doe" />
          </Form.Item>
          
          <Form.Item name="username" label="Username" rules={[{required: true, message: 'Please enter username'}]}>
            <Input placeholder="e.g., john.staff" />
          </Form.Item>
          
          <Form.Item name="password" label="Password" rules={[{required: true, message: 'Please enter password'}]}>
            {/* Added autoComplete="new-password" to prevent browser warnings */}
            <Input.Password placeholder="Enter secure password" autoComplete="new-password" />
          </Form.Item>
          
          <Form.Item name="role" label="System Role" rules={[{required: true}]} initialValue="Staff">
            <Select
                options={[
                    // [CẬP NHẬT] Xóa role IT ảo, chỉ để lại 4 role chuẩn
                    { value: 'Admin', label: 'Admin (System Owner / IT)' },
                    { value: 'Manager', label: 'Manager' },
                    { value: 'HR', label: 'HR (Personnel Management)' },
                    { value: 'Staff', label: 'Staff (Read-only / Operation)' },
                ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManager;
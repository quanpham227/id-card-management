// src/pages/Admin/UserManager.jsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Popconfirm, message, Card, Avatar } from 'antd';
import { UserAddOutlined, DeleteOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import axiosClient from '../../../api/axiosClient';

// 1. IMPORT FILE CHECK QUYỀN
import { PERMISSIONS } from '../../utils/permissions'; 

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // 2. XÁC ĐỊNH QUYỀN CỦA USER ĐANG ĐĂNG NHẬP
  // IS_ADMIN bao gồm: Admin, Manager, IT (như đã định nghĩa ở permissions.js)
  const canEdit = PERMISSIONS.IS_ADMIN(currentUser.role);

  // --- HÀM FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/users/');
      if (Array.isArray(res.data)) setUsers(res.data);
      else if (res.data && Array.isArray(res.data.data)) setUsers(res.data.data);
      else if (res.data && Array.isArray(res.data.users)) setUsers(res.data.users);
      else setUsers([]);
    } catch (error) {
      console.error(error);
      message.error("Không thể tải danh sách người dùng");
      setUsers([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (values) => {
    setSubmitting(true);
    try {
      await axiosClient.post('/api/users/', values);
      message.success("Tạo tài khoản thành công!");
      setIsModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.detail || "Lỗi khi tạo tài khoản";
      message.error(msg);
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
      try {
          await axiosClient.delete(`/api/users/${id}`);
          message.success("Đã xóa tài khoản");
          fetchData();
      } catch  {
          message.error("Xóa thất bại");
      }
  }

  // --- CẤU HÌNH CỘT BẢNG ---
  const columns = [
    { 
        title: 'Avatar', 
        key: 'avatar',
        width: 80,
        align: 'center',
        render: () => <Avatar icon={<UserOutlined />} style={{backgroundColor: '#87d068'}}/>
    },
    { 
        title: 'Full Name', 
        dataIndex: 'full_name', 
        key: 'full_name',
        render: (text) => <span style={{fontWeight: 500}}>{text}</span>
    },
    { 
        title: 'Username', 
        dataIndex: 'username', 
        key: 'username',
        render: (text) => <Tag>{text}</Tag>
    },
    { 
      title: 'Role', 
      dataIndex: 'role', 
      render: (role) => {
        let color = 'default';
        let label = 'USER';
        const r = role ? role.toLowerCase() : '';

        if (r === 'admin') { color = 'red'; label = 'SYSTEM ADMIN'; } 
        else if (r === 'manager' || r === 'it') { color = 'gold'; label = 'MANAGER'; } 
        else if (r === 'hr') { color = 'purple'; label = 'HR'; } 
        else if (r === 'staff') { color = 'blue'; label = 'STAFF'; }

        return <Tag color={color}>{label}</Tag>;
      } 
    },
    // 3. ẨN CỘT ACTION NẾU KHÔNG CÓ QUYỀN
    // Logic: Nếu canEdit là true thì thêm cột Action vào, ngược lại thì không thêm gì cả
    ...(canEdit ? [{
      title: 'Action',
      align: 'center',
      render: (_, record) => {
        const isSelf = record.username === currentUser.username;
        return (
            <Popconfirm 
              title="Xóa người dùng này?" 
              onConfirm={() => handleDelete(record.id)}
              disabled={isSelf}
            >
              <Button type="text" danger icon={<DeleteOutlined />} disabled={isSelf} />
            </Popconfirm>
        )
      }
    }] : [])
  ];

  return (
    <Card
        variant="borderless" 
        title={<span><SettingOutlined /> Quản lý tài khoản (System Users)</span>} 
        style={{borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}
        // 4. ẨN NÚT ADD USER NẾU KHÔNG CÓ QUYỀN
        extra={
            canEdit && (
                <Button type="primary" icon={<UserAddOutlined />} onClick={() => setIsModalOpen(true)}>
                    Add User
                </Button>
            )
        }
    >
      <Table 
        dataSource={Array.isArray(users) ? users : []} 
        columns={columns} 
        rowKey="id" 
        loading={loading} 
        pagination={{ pageSize: 10 }}
      />
      
      {/* Modal chỉ render nhưng người dùng HR/Staff sẽ không bao giờ mở được vì không thấy nút */}
      <Modal 
        title="Tạo tài khoản mới" 
        open={isModalOpen} 
        onOk={() => form.submit()} 
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        okText="Tạo mới"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="full_name" label="Tên hiển thị" rules={[{required: true}]}><Input placeholder="Ví dụ: Nguyễn Văn A" /></Form.Item>
          <Form.Item name="username" label="Tên đăng nhập" rules={[{required: true}]}><Input placeholder="admin, staff..." /></Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{required: true}]}><Input.Password placeholder="Nhập mật khẩu" /></Form.Item>
          
          <Form.Item name="role" label="Phân quyền (Role)" rules={[{required: true}]} initialValue="Staff">
            <Select
                options={[
                    { value: 'Admin', label: 'Admin (Quản trị hệ thống)' },
                    { value: 'Manager', label: 'Manager' },
                    { value: 'HR', label: 'HR (Quản lý Nhân sự)' },
                    { value: 'Staff', label: 'Staff (Nhân viên thường)' },
                ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManager;
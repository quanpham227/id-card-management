import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Typography } from 'antd';
// import { useNavigate } from 'react-router-dom'; // Không dùng navigate nữa
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axiosClient from '../../../api/axiosClient';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axiosClient.post('/api/login', values);
      
      // Bóc tách dữ liệu an toàn
      const data = response.data ? response.data : response;
      const token = data.access_token || data.token;

      if (token) {
        message.success('Đăng nhập thành công!');
        
        // 1. Lưu Token và User
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // 2. [QUAN TRỌNG] Dùng window.location để ép tải lại trang -> Vào thẳng Dashboard
        window.location.href = '/dashboard'; 
      } else {
        message.error('Lỗi: Không nhận được Token từ Server');
      }

    } catch (error) {
      console.error("Login Error:", error);
      const msg = error.response?.data?.detail || 'Đăng nhập thất bại';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Title level={3}>ID System</Title>
          <Text type="secondary">Internal Management System</Text>
        </div>

        <Form name="login" onFinish={onFinish} layout="vertical">
          <Form.Item name="username" rules={[{ required: true, message: 'Nhập Username' }]}>
            <Input size="large" prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Nhập Password' }]}>
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
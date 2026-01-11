import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axiosClient from '../../../api/axiosClient';

const { Title } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // --- [CẬP NHẬT QUAN TRỌNG] ---
      // Chuyển đổi dữ liệu JSON sang Form Data chuẩn OAuth2
      const formData = new URLSearchParams();
      formData.append('username', values.username);
      formData.append('password', values.password);

      // Gửi request với header form-urlencoded
      // Lưu ý: Endpoint phải là '/api/login' (khớp với backend auth.py)
      const response = await axiosClient.post('/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      // -----------------------------

      // Bóc tách dữ liệu an toàn
      const data = response.data ? response.data : response;
      const token = data.access_token || data.token;

      if (token) {
        message.success('Login successful!');

        // 1. Lưu Token và User
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // 2. Vào thẳng Dashboard
        window.location.href = '/dashboard';
      } else {
        message.error('Error: No token received from server');
      }
    } catch (error) {
      console.error('Login Error:', error);
      // Xử lý thông báo lỗi đẹp hơn
      const msg = error.response?.data?.detail || 'Login failed. Please check your credentials.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f2f5',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <img
            src="/assets/logo.png"
            alt="Company Logo"
            style={{ width: 100, height: 'auto', objectFit: 'contain' }}
            onError={(e) => (e.target.style.display = 'none')}
          />
          <Title level={3}>Internal Management System</Title>
        </div>

        <Form name="login" onFinish={onFinish} layout="vertical">
          <Form.Item name="username" rules={[{ required: true, message: 'Please enter Username' }]}>
            <Input size="large" prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Please enter Password' }]}>
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Space,
  message,
  Dropdown,
  Typography,
  Badge,
  Tooltip,
  List,
  Card,
  notification,
} from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  ProfileOutlined,
  SettingOutlined,
  BellOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

import { useCategories } from '../../context/CategoryProvider';
import { getMenuItems } from './SidebarConfig';
import './MainLayout.css';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // State quản lý thông báo
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { categories: assetCategories } = useCategories();

  // Memoize user để tránh re-parse liên tục gây re-render
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const userRole = user.role;

  // --- 1. LOGIC GỌI API & XỬ LÝ THÔNG BÁO ---
  // Sử dụng useCallback để giữ tham chiếu hàm ổn định
  const fetchNotifications = useCallback(async () => {
    // Chỉ Admin/Manager mới cần chạy logic này
    if (!['Admin', 'Manager'].includes(userRole)) return;

    try {
      // Gọi API lấy danh sách ticket chưa xử lý (Open)
      // Lưu ý: Đảm bảo Backend đã có endpoint /manage/open-only như hướng dẫn trước
      // Nếu chưa có, dùng tạm: /tickets/manage?status=Open
      const res = await axiosClient.get('/tickets/manage/open-only');
      const data = res.data || res; // Xử lý dữ liệu trả về tùy cấu hình axios

      // Cập nhật số lượng và hiển thị Popup nếu có tin mới
      setUnreadCount((prevCount) => {
        // Nếu số lượng mới lớn hơn số cũ (và không phải lần load đầu tiên từ 0)
        if (data.length > prevCount && prevCount !== 0) {
          notification.info({
            message: 'New Ticket Alert',
            description: `You have ${data.length} open tickets requiring attention.`,
            placement: 'bottomRight',
            duration: 4, // Tự tắt sau 4s
          });

          // (Tùy chọn) Phát âm thanh
          // const audio = new Audio('/assets/notification.mp3');
          // audio.play().catch(e => console.log("Audio play failed", e));
        }
        return data.length;
      });

      // Cập nhật danh sách hiển thị trong Dropdown
      // So sánh JSON string để tránh set state nếu dữ liệu y hệt (tránh render thừa)
      setNotifications((prev) => {
        const newData = data.slice(0, 5); // Chỉ lấy 5 cái mới nhất
        return JSON.stringify(prev) === JSON.stringify(newData) ? prev : newData;
      });
    } catch (error) {
      console.error('Polling Notification Error:', error);
    }
  }, [userRole]);

  // --- 2. EFFECT KÍCH HOẠT POLLING ---
  useEffect(() => {
    let isMounted = true;

    const runPolling = async () => {
      if (isMounted) await fetchNotifications();
    };

    // Gọi ngay lần đầu khi mount
    runPolling();

    // Thiết lập chu kỳ lặp lại mỗi 30 giây
    const interval = setInterval(() => {
      runPolling();
    }, 30000);

    // Cleanup khi component unmount
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // --- 3. CÁC HÀM XỬ LÝ KHÁC ---
  const handleLogout = () => {
    localStorage.clear();
    message.success('Logged out successfully');
    window.location.href = '/';
  };

  const menuItems = useMemo(
    () => getMenuItems(userRole, assetCategories),
    [userRole, assetCategories]
  );

  // Nội dung Dropdown khi nhấn vào Chuông
  const notificationContent = (
    <Card
      title={<Text strong>Pending Requests</Text>}
      extra={<a onClick={() => navigate('/tickets/manage')}>View All</a>}
      style={{ width: 320, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      styles={{ body: { padding: '0' } }}
    >
      <List
        dataSource={notifications}
        locale={{ emptyText: 'No open tickets' }}
        renderItem={(item) => (
          <List.Item
            style={{
              padding: '12px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            className="notification-item"
            onClick={() => navigate(`/tickets/detail/${item.id}`)}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  icon={<FileTextOutlined />}
                  style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }}
                />
              }
              title={
                <Text ellipsis style={{ width: 180, fontSize: 13, fontWeight: 600 }}>
                  {item.title}
                </Text>
              }
              description={
                <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                  <span>{item.requester?.full_name || 'Unknown'}</span>
                  <span style={{ margin: '0 4px' }}>•</span>
                  <span
                    style={{
                      color: item.priority === 'Critical' ? '#f5222d' : '#fa8c16',
                    }}
                  >
                    {item.priority}
                  </span>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );

  const userMenuItems = {
    items: [
      {
        key: 'info',
        label: (
          <div style={{ padding: '4px 0', minWidth: '150px' }}>
            <Text strong>{user.full_name || 'User'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {userRole}
            </Text>
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' },
      { key: 'profile', label: 'My Profile', icon: <ProfileOutlined /> },
      { key: 'settings', label: 'Account Settings', icon: <SettingOutlined /> },
      { type: 'divider' },
      {
        key: 'logout',
        label: 'Sign Out',
        icon: <LogoutOutlined />,
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* SIDEBAR */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        className="modern-sider"
        style={{
          overflow: 'hidden',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* LOGO */}
          <div
            style={{
              height: 70,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
            onClick={() => navigate('/dashboard')}
          >
            <img
              src="/assets/logo.png"
              alt="Logo"
              style={{ width: collapsed ? 32 : 38, transition: 'all 0.3s' }}
            />
            {!collapsed && (
              <div style={{ marginLeft: 12 }}>
                <div style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                  PI VINA<span style={{ color: '#1890ff' }}> DANANG</span>
                </div>
              </div>
            )}
          </div>

          {/* MENU */}
          <div style={{ flex: 1, overflowY: 'auto', paddingTop: 16 }} className="custom-scrollbar">
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={(e) => navigate(e.key)}
              style={{ borderRight: 0, background: 'transparent' }}
            />
          </div>

          {/* FOOTER */}
          {!collapsed && (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '12px 10px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Text
                  style={{
                    color: 'rgba(255, 255, 255, 0.65)',
                    fontSize: '11px',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  IT System v1.0.2
                </Text>
                <Text
                  style={{
                    color: 'rgba(255, 255, 255, 0.35)',
                    fontSize: '10px',
                  }}
                >
                  © 2026 Quan Pham
                </Text>
              </div>
            </div>
          )}
        </div>
      </Sider>

      {/* MAIN LAYOUT */}
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 260,
          transition: 'all 0.3s',
          background: '#f4f7fe',
        }}
      >
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'fixed',
            top: 0,
            right: 0,
            width: `calc(100% - ${collapsed ? '80px' : '260px'})`,
            zIndex: 99,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          {/* Toggle Button */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '18px', width: 46, height: 46 }}
          />

          {/* Header Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* NOTIFICATION BELL */}
            <Dropdown
              popupRender={() => notificationContent}
              trigger={['click']}
              placement="bottomRight"
              overlayStyle={{ position: 'fixed' }}
            >
              <Tooltip title={unreadCount > 0 ? `${unreadCount} Open Tickets` : 'No notifications'}>
                <Badge count={unreadCount} size="small" offset={[-2, 5]}>
                  <Button
                    type="text"
                    shape="circle"
                    icon={
                      <BellOutlined
                        style={{
                          fontSize: '20px',
                          color: unreadCount > 0 ? '#1890ff' : '#595959',
                          animation: unreadCount > 0 ? 'swing 1s infinite' : 'none',
                        }}
                      />
                    }
                  />
                </Badge>
              </Tooltip>
            </Dropdown>

            {/* USER PROFILE */}
            <Dropdown menu={userMenuItems} placement="bottomRight">
              <Space
                style={{
                  cursor: 'pointer',
                  padding: '4px 12px',
                  borderRadius: '30px',
                  backgroundColor: '#f8f9fa',
                }}
              >
                <Avatar
                  style={{
                    backgroundColor: userRole === 'Admin' ? '#ff4d4f' : '#1890ff',
                  }}
                  icon={<UserOutlined />}
                />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    lineHeight: '1',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>{user.full_name}</span>
                  <small style={{ color: '#8c8c8c', fontSize: '10px' }}>{userRole}</small>
                </div>
              </Space>
            </Dropdown>
          </div>
        </Header>

        {/* PAGE CONTENT */}
        <Content style={{ margin: '94px 24px 24px' }}>
          <div
            style={{
              padding: 24,
              background: '#fff',
              borderRadius: 16,
              minHeight: 'calc(100vh - 142px)',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;

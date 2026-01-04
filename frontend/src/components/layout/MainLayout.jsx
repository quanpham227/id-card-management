import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Space, message, Dropdown, Divider, Typography } from 'antd';
import { 
  UserOutlined, CloudUploadOutlined, FileSearchOutlined, LogoutOutlined,
  MenuUnfoldOutlined, MenuFoldOutlined, DesktopOutlined, LaptopOutlined,     
  PrinterOutlined, SettingOutlined, TabletOutlined, ProfileOutlined,
  SafetyOutlined, AppstoreAddOutlined, PieChartOutlined, TeamOutlined 
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role; 

  const handleLogout = () => {
    localStorage.clear();
    message.success('Logged out successfully');
    window.location.href = '/';
  };

  const userMenuItems = {
    items: [
      { 
        key: 'info', 
        label: (
          <div style={{ padding: '4px 0' }}>
            <Text strong>{user.full_name || 'User'}</Text><br />
            <Text type="secondary" style={{ fontSize: '12px' }}></Text>
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' },
      { key: 'profile', label: 'My Profile', icon: <ProfileOutlined /> },
      { key: 'settings', label: 'Account Settings', icon: <SettingOutlined /> },
      { type: 'divider' },
      { key: 'logout', label: 'Sign Out', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
    ],
  };

  const menuItems = [
    { key: '/dashboard', icon: <PieChartOutlined />, label: 'Overview' },

    {
      key: 'grp_hr', label: 'HR MANAGEMENT', type: 'group', 
      children: [
        { key: '/employees', icon: <TeamOutlined />, label: 'Employee Directory' }, 
        { key: '/upload', icon: <CloudUploadOutlined />, label: 'Upload ID Photos' },
        { key: '/search-image', icon: <FileSearchOutlined />, label: 'Image Lookup' },
      ],
    },

    {
      key: 'grp_tools', label: 'PRINT CENTER', type: 'group',
      children: [
        { key: '/print-tools', icon: <AppstoreAddOutlined />, label: 'Batch ID Printing' },
      ],
    },

    {
      key: 'grp_it', label: 'IT ASSETS', type: 'group',
      children: [
        { key: '/it/pc', icon: <DesktopOutlined />, label: 'Desktop PCs' },
        { key: '/it/laptop', icon: <LaptopOutlined />, label: 'Laptops' },
        { key: '/it/tablet', icon: <TabletOutlined />, label: 'Tablets' },
        { key: '/it/printer', icon: <PrinterOutlined />, label: 'Printers' },
      ],
    },

    ['Admin', 'IT', 'Manager'].includes(userRole) && {
      key: 'grp_sys', label: 'SYSTEM ADMINISTRATION', type: 'group',
      children: [
        { key: '/admin/users', icon: <SafetyOutlined />, label: 'User Management' },
      ],
    },
  ].filter(Boolean);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={260} theme="dark"
             style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ height: 64, marginTop: 16, marginBottom: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }} 
               onClick={() => navigate('/dashboard')}>
            <img src="/assets/logo.png" alt="Logo" style={{ width: collapsed ? 32 : 45, height: 'auto' }} />
            {!collapsed && (
              <span style={{ color: 'white', fontWeight: 'bold', marginLeft: 12, fontSize: 16, whiteSpace: 'nowrap' }}>
                PI VINA <span style={{ color: '#1890ff' }}>DANANG</span>
              </span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} onClick={(e) => navigate(e.key)} items={menuItems} />
          </div>
          {!collapsed && (
            <div style={{ padding: '16px', color: 'rgba(255,255,255,0.45)', fontSize: '11px', textAlign: 'center' }}>
              <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
              <p style={{ margin: 0 }}>© 2026 Designed by Quan Pham</p>
            </div>
          )}
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.2s', background: '#f0f2f5' }}>
        <Header style={{ 
            padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            position: 'fixed', top: 0, right: 0, width: `calc(100% - ${collapsed ? '80px' : '260px'})`, zIndex: 99,
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)' 
        }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
          <Dropdown menu={userMenuItems} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: userRole === 'Admin' ? '#f5222d' : '#1890ff' }} icon={<UserOutlined />} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                <span style={{ fontWeight: 600 }}>{user.full_name}</span>
                <small style={{ color: '#8c8c8c' }}>{userRole}</small>
              </div>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '88px 24px 24px' }}>
          <div style={{ padding: 24, background: '#fff', borderRadius: 12, minHeight: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Outlet /> 
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
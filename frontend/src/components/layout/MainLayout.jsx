import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Space, message, Dropdown, Divider, Typography } from 'antd';
import { 
  UserOutlined, 
  CloudUploadOutlined, 
  FileSearchOutlined, 
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DesktopOutlined,    
  LaptopOutlined,     
  PrinterOutlined,
  SettingOutlined,
  TabletOutlined,
  ProfileOutlined,
  SafetyOutlined,
  AppstoreAddOutlined,
  PieChartOutlined, 
  TeamOutlined 
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // User Info
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role; 

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    message.success('Logged out successfully');
    navigate('/');
  };

  // Dropdown Menu
  const userMenuItems = {
    items: [
      { 
        key: 'info', 
        label: (
          <div style={{ padding: '4px 0' }}>
            <Text strong>{user.full_name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>{user.employee_id || 'N/A'}</Text>
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' },
      { key: 'profile', label: 'My Profile', icon: <ProfileOutlined /> },
      { key: 'settings', label: 'Account Settings', icon: <SettingOutlined /> },
      { type: 'divider' },
      { key: 'logout', label: 'Logout System', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
    ],
  };

  // --- MENU CONFIGURATION ---
  const menuItems = [
    // 0. DASHBOARD
    {
      key: '/dashboard',
      icon: <PieChartOutlined />,
      label: 'Dashboard Overview',
    },

    // 1. HR MANAGEMENT
    {
      key: 'grp_hr',
      label: 'HR MANAGEMENT',
      type: 'group', 
      children: [
        { key: '/employees', icon: <TeamOutlined />, label: 'Employee List' }, 
        { key: '/upload', icon: <CloudUploadOutlined />, label: 'Upload Images' },
        { key: '/search-image', icon: <FileSearchOutlined />, label: 'Image Search' },
      ],
    },

    // 2. PRINT CENTER
    {
      key: 'grp_tools',
      label: 'PRINT CENTER',
      type: 'group',
      children: [
        { key: '/print-tools', icon: <AppstoreAddOutlined />, label: 'Batch ID Cards' },
      ],
    },

    // 3. IT ASSETS
    {
      key: 'grp_it',
      label: 'IT ASSETS', 
      type: 'group',
      children: [
        { key: '/it/pc', icon: <DesktopOutlined />, label: 'PC Management' },
        { key: '/it/laptop', icon: <LaptopOutlined />, label: 'Laptop Management' },
        { key: '/it/tablet', icon: <TabletOutlined />, label: 'Tablet Management' },
        { key: '/it/printer', icon: <PrinterOutlined />, label: 'Printer Management' },
      ],
    },

    // 4. SYSTEM (Admin Only)
    ['Admin', 'IT'].includes(userRole) && {
      key: 'grp_sys',
      label: 'SYSTEM SETTINGS',
      type: 'group',
      children: [
        { key: '/admin/users', icon: <SafetyOutlined />, label: 'User Management' },
      ],
    },
  ].filter(Boolean);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* SIDEBAR */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        width={260} 
        theme="dark"
        style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* --- [ĐÃ SỬA LẠI] LOGO AREA --- */}
          {/* Chỉ dùng marginTop để đẩy xuống, bỏ overflow: hidden để tránh mất hình */}
          <div style={{ 
             height: 64, 
             marginTop: 12,       // Đẩy xuống 12px
             marginBottom: 12,    // Cách menu bên dưới 12px
             display: 'flex', 
             justifyContent: 'center', 
             alignItems: 'center',
             cursor: 'pointer'
          }} onClick={() => navigate('/dashboard')}>
            
            {/* Ảnh Logo */}
            <img src="/assets/logo.png" alt="Logo" style={{ width: collapsed ? 32 : 40, height: 'auto', display: 'block' }} />
            
            {/* Tên công ty */}
            {!collapsed && (
              <span style={{ 
                  color: 'white', 
                  fontWeight: 'bold', 
                  marginLeft: 12, 
                  fontSize: 16, 
                  whiteSpace: 'nowrap',
                  opacity: 1 // Đảm bảo hiện rõ
              }}>
                PI VINA <span style={{ color: '#1890ff' }}>DANANG</span>
              </span>
            )}
          </div>

          {/* MENU */}
          <div style={{ flex: 1 }}>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[location.pathname]}
              onClick={(e) => navigate(e.key)}
              items={menuItems}
            />
          </div>

          {/* COPYRIGHT */}
          {!collapsed && (
            <div style={{ padding: '16px', color: 'rgba(255,255,255,0.45)', fontSize: '11px', textAlign: 'center' }}>
              <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
              <p style={{ margin: 0 }}>System Version 1.1.0</p>
              <p style={{ margin: 0 }}>© 2026 Designed by <span style={{color: '#1890ff'}}>Quan Pham</span></p>
            </div>
          )}
        </div>
      </Sider>

      {/* CONTENT LAYOUT */}
      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.2s', background: '#f0f2f5' }}>
        <Header style={{ 
          padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          position: 'fixed', top: 0, right: 0, width: `calc(100% - ${collapsed ? '80px' : '260px'})`, 
          zIndex: 99, boxShadow: '0 1px 4px rgba(0,21,41,0.08)', transition: 'all 0.2s'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          
          <div style={{ paddingRight: 8 }}>
             <Dropdown menu={userMenuItems} placement="bottomRight" arrow={{ pointAtCenter: true }}>
                <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6, transition: 'all 0.3s' }} className="user-profile-trigger">
                   <Avatar 
                    style={{ backgroundColor: userRole === 'Admin' ? '#f5222d' : userRole === 'IT' ? '#1890ff' : '#52c41a' }} 
                    icon={<UserOutlined />} 
                   />
                   <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                      <span style={{ fontWeight: 600, color: '#262626' }}>{user.full_name || 'System User'}</span>
                      <small style={{ color: '#8c8c8c', fontSize: 11 }}>{userRole}</small>
                   </div>
                </Space>
             </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: '88px 24px 24px', minHeight: 'calc(100vh - 112px)' }}>
          <div style={{ padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', minHeight: '100%' }}>
            <Outlet /> 
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
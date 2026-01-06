import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Space, message, Dropdown, Typography, theme } from 'antd';
import { 
  UserOutlined, CloudUploadOutlined, FileSearchOutlined, LogoutOutlined,
  MenuUnfoldOutlined, MenuFoldOutlined, DesktopOutlined, LaptopOutlined,     
  PrinterOutlined, SettingOutlined, TabletOutlined, ProfileOutlined,
  SafetyOutlined, AppstoreAddOutlined, PieChartOutlined, TeamOutlined,
  FundProjectionScreenOutlined, AppstoreOutlined, CameraOutlined,
  HddOutlined, WifiOutlined, BuildOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

// [QUAN TRỌNG] Thay vì import axiosClient, ta import Context
import { useCategories } from '../../context/CategoryProvider';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  // [QUAN TRỌNG] Lấy danh sách category từ Context thay vì State nội bộ
  // Khi trang Admin thêm mới, Context cập nhật -> Biến này tự đổi -> Sidebar tự vẽ lại
  const { categories: assetCategories } = useCategories();
  
  const { token } = theme.useToken(); 

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role; 

  const handleLogout = () => {
    localStorage.clear();
    message.success('Logged out successfully');
    window.location.href = '/';
  };

  // Mapping Icon phong phú hơn
  const getCategoryIcon = (code) => {
      const c = code?.toUpperCase();
      switch (c) {
          case 'PC': return <DesktopOutlined />;
          case 'LPT': case 'LAPTOP': return <LaptopOutlined />;
          case 'PRT': case 'PRINTER': return <PrinterOutlined />;
          case 'TAB': case 'TABLET': return <TabletOutlined />;
          case 'MON': case 'MONITOR': return <FundProjectionScreenOutlined />;
          case 'CAM': case 'CAMERA': return <CameraOutlined />;
          case 'SRV': case 'SERVER': return <HddOutlined />;
          case 'NET': case 'NETWORK': return <WifiOutlined />;
          default: return <BuildOutlined />;
      }
  };

  const userMenuItems = {
    items: [
      { 
        key: 'info', 
        label: (
          <div style={{ padding: '4px 0', minWidth: '150px' }}>
            <Text strong>{user.full_name || 'User'}</Text><br />
            <Text type="secondary" style={{ fontSize: '12px' }}>{userRole}</Text>
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
    
    { type: 'divider' }, 

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
      children: assetCategories.length > 0 ? assetCategories.map(cat => ({
          key: `/it/${cat.code.toLowerCase()}`, 
          icon: getCategoryIcon(cat.code),
          label: cat.name
      })) : [
          { key: '/it/all', icon: <AppstoreOutlined />, label: 'All Assets' }
      ],
    },

    ['Admin', 'IT', 'Manager'].includes(userRole) && {
      key: 'grp_sys', label: 'SYSTEM ADMIN', type: 'group',
      children: [
        { key: '/admin/users', icon: <SafetyOutlined />, label: 'User Management' },
        { key: '/admin/categories', icon: <BuildOutlined />, label: 'Category Settings' },
      ],
    },
  ].filter(Boolean);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        width={250} 
        theme="dark"
        style={{ 
            overflow: 'hidden', 
            height: '100vh', 
            position: 'fixed', 
            left: 0, top: 0, bottom: 0, 
            zIndex: 100,
            boxShadow: '2px 0 8px rgba(0,0,0,0.15)' 
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* 1. LOGO SECTION */}
          <div 
            style={{ 
                height: 64, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)', 
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }} 
            onClick={() => navigate('/dashboard')}
          >
            <img src="/assets/logo.png" alt="Logo" style={{ width: collapsed ? 30 : 36, height: 'auto', transition: 'all 0.2s' }} />
            {!collapsed && (
              <div style={{ marginLeft: 12, lineHeight: 1.2 }}>
                 <div style={{ color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: '0.5px' }}>STAFF<span style={{ color: '#1890ff' }}>HUB</span></div>
                 <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, letterSpacing: '1px' }}>MANAGEMENT</div>
              </div>
            )}
          </div>

          {/* 2. MENU SECTION (CUSTOM SCROLLBAR) */}
          <div 
            style={{ 
                flex: 1, 
                overflowY: 'auto', 
                overflowX: 'hidden',
                scrollbarWidth: 'thin', 
                scrollbarColor: '#434343 transparent' 
            }}
            className="custom-scrollbar"
          >
            <Menu 
                theme="dark" 
                mode="inline" 
                selectedKeys={[location.pathname]} 
                defaultOpenKeys={['grp_hr', 'grp_it']} 
                items={menuItems} 
                onClick={(e) => navigate(e.key)}
                style={{ borderRight: 0, paddingTop: 8 }}
            />
          </div>

          {/* 3. FOOTER SECTION */}
          {!collapsed && (
            <div style={{ padding: '16px', textAlign: 'center', background: 'rgba(0,0,0,0.1)' }}>
              <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>
                v1.0.2 • © 2026 PI VINA
              </Text>
            </div>
          )}
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'all 0.2s', background: '#f0f2f5' }}>
        <Header style={{ 
            padding: '0 24px', 
            background: '#fff', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            position: 'fixed', top: 0, right: 0, 
            width: `calc(100% - ${collapsed ? '80px' : '250px'})`, 
            zIndex: 99,
            boxShadow: '0 1px 4px rgba(0,21,41,0.05)',
            transition: 'width 0.2s'
        }}>
          <Button 
            type="text" 
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
            onClick={() => setCollapsed(!collapsed)} 
            style={{ fontSize: '16px', width: 46, height: 46 }}
          />
          
          <Dropdown menu={userMenuItems} placement="bottomRight" arrow>
            <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', transition: '0.3s' }} className="user-dropdown-trigger">
              <Avatar style={{ backgroundColor: userRole === 'Admin' ? '#f5222d' : '#1890ff' }} icon={<UserOutlined />} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{user.full_name}</span>
                <small style={{ color: '#8c8c8c', fontSize: '11px' }}>{userRole}</small>
              </div>
            </Space>
          </Dropdown>
        </Header>
        
        <Content style={{ margin: '88px 24px 24px' }}>
          {/* Card hiệu ứng cho nội dung chính */}
          <div style={{ 
              padding: 24, 
              background: '#fff', 
              borderRadius: 12, 
              minHeight: 'calc(100vh - 136px)', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)' 
          }}>
            <Outlet /> 
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
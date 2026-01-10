// components/layout/MainLayout.jsx
import React, { useState, useMemo } from 'react';
import { Layout, Menu, Button, Avatar, Space, message, Dropdown, Typography, Badge, Tooltip } from 'antd';
import { 
  UserOutlined, LogoutOutlined, MenuUnfoldOutlined, MenuFoldOutlined, 
  ProfileOutlined, SettingOutlined, BellOutlined 
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

// Import Context & Config
import { useCategories } from '../../context/CategoryProvider';
import { getMenuItems } from './SidebarConfig'; 

// [QUAN TRỌNG] Import file CSS đã tách
import './MainLayout.css'; 

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  const { categories: assetCategories } = useCategories();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role; 

  const handleLogout = () => {
    localStorage.clear();
    message.success('Logged out successfully');
    window.location.href = '/';
  };

  const menuItems = useMemo(() => getMenuItems(userRole, assetCategories), [userRole, assetCategories]);

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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ĐÃ XÓA THẺ <style> VÌ ĐÃ IMPORT FILE CSS Ở TRÊN */}

      <Sider 
        trigger={null} collapsible collapsed={collapsed} width={260} 
        className="modern-sider"
        style={{ overflow: 'hidden', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* LOGO */}
          <div 
            style={{ 
                height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0' 
            }} 
            onClick={() => navigate('/dashboard')}
          >
            <img src="/assets/logo.png" alt="Logo" style={{ width: collapsed ? 32 : 38, height: 'auto', transition: 'all 0.3s' }} />
            {!collapsed && (
              <div style={{ marginLeft: 12, lineHeight: 1.2 }}>
                 <div style={{ color: '#f0f0f0', fontWeight: '800', fontSize: 18, fontFamily: 'Arial, sans-serif' }}>PI VINA<span style={{ color: '#1890ff' }}> DANANG</span></div>
              </div>
            )}
          </div>

          {/* MENU */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: 16 }} className="custom-scrollbar">
            <Menu 
                theme="light" 
                mode="inline" 
                selectedKeys={[location.pathname]} 
                defaultOpenKeys={['grp_hr', 'grp_support', 'sub_ticket']} 
                items={menuItems} 
                onClick={(e) => navigate(e.key)}
                style={{ borderRight: 0 }}
            />
          </div>

          {/* FOOTER */}
          {!collapsed && (
            <div style={{ padding: '16px', textAlign: 'center' }}>
               <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px' }}>
                  <Text style={{ color: '#8c8c8c', fontSize: '10px', display: 'block' }}>IT Management System v1.0.2</Text>
                  <Text style={{ color: '#bfbfbf', fontSize: '10px' }}>© 2026 Quan Pham</Text>
               </div>
            </div>
          )}
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.3s ease-in-out', background: '#f0f2f5' }}>
        <Header style={{ 
            padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            position: 'fixed', top: 0, right: 0, width: `calc(100% - ${collapsed ? '80px' : '260px'})`, zIndex: 99,
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)', transition: 'width 0.3s ease-in-out',
            borderBottom: '1px solid #f0f0f0'
        }}>
          {/* Nút Toggle */}
          <Button 
            type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
            onClick={() => setCollapsed(!collapsed)} 
            style={{ fontSize: '18px', width: 46, height: 46, color: '#595959' }}
          />

          {/* Header Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Chuông thông báo */}
            <Tooltip title="Notifications">
              <Badge count={0} size="small" dot offset={[-2, 2]}> 
                 <Button 
                   type="text" shape="circle"
                   icon={<BellOutlined style={{ fontSize: '20px', color: '#595959' }} />}
                 />
              </Badge>
            </Tooltip>

            {/* User Info */}
            <Dropdown menu={userMenuItems} placement="bottomRight" arrow={{ pointAtCenter: true }}>
              <Space style={{ cursor: 'pointer', padding: '6px 12px', borderRadius: '30px', transition: '0.3s', backgroundColor: '#f5f5f5' }} className="user-dropdown-trigger">
                <Avatar style={{ backgroundColor: userRole === 'Admin' ? '#ff4d4f' : '#1890ff' }} icon={<UserOutlined />} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#262626' }}>{user.full_name}</span>
                  <small style={{ color: '#8c8c8c', fontSize: '11px', textTransform: 'uppercase' }}>{userRole}</small>
                </div>
              </Space>
            </Dropdown>
          </div>
        </Header>
        
        <Content style={{ margin: '94px 24px 24px' }}>
          <div style={{ padding: 24, background: '#fff', borderRadius: 16, minHeight: 'calc(100vh - 142px)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Outlet /> 
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
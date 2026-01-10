import React from 'react';
import { 
  PieChartOutlined, TeamOutlined, CloudUploadOutlined, FileSearchOutlined,
  AppstoreOutlined, DesktopOutlined, LaptopOutlined, PrinterOutlined, TabletOutlined,
  FundProjectionScreenOutlined, CameraOutlined, HddOutlined, WifiOutlined, BuildOutlined,
  CustomerServiceOutlined, FileAddOutlined, UnorderedListOutlined, SolutionOutlined,
  DatabaseOutlined,  SafetyOutlined,
  BarChartOutlined, SettingOutlined, ToolOutlined // [MỚI] Thêm icon Tool
} from '@ant-design/icons';

// Import bộ quy tắc phân quyền
import { PERMISSIONS } from '../utils/permissions.js'; 

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

export const getMenuItems = (userRole, assetCategories) => {
  return [
    // 1. DASHBOARD
    { key: '/dashboard', icon: <PieChartOutlined />, label: 'Overview' },
    
    // 2. HR & PERSONNEL
    {
      key: 'grp_hr', label: 'HR & PERSONNEL', type: 'group', 
      children: [
        { key: '/employees', icon: <TeamOutlined />, label: 'Staff Directory' },
        { key: '/search-image', icon: <FileSearchOutlined />, label: 'Image Lookup' },

        ...(PERMISSIONS.CAN_MANAGE_HR_DATA(userRole) ? [
             { key: '/upload', icon: <CloudUploadOutlined />, label: 'Upload Data', style: { color: '#fa8c16' } }, 
             { key: '/print-tools', icon: <PrinterOutlined />, label: 'Batch Printing', style: { color: '#fa8c16' } },
        ] : [])
      ],
    },

    // 3. IT ASSETS (Chứa cả Inventory và Cấu hình Danh mục)
    ...(PERMISSIONS.CAN_VIEW_ASSETS(userRole) ? [{
      key: 'grp_it', label: 'IT ASSETS', type: 'group',
      children: [
        // 3.1. Danh sách thiết bị (Inventory) - Manager xem được
        {
          key: 'sub_inventory', label: 'Device Inventory', icon: <DatabaseOutlined />, 
          children: assetCategories.length > 0 ? assetCategories.map(cat => ({
              key: `/it/${cat.code.toLowerCase()}`, 
              icon: getCategoryIcon(cat.code),
              label: cat.name
          })) : [
              { key: '/it/all', icon: <AppstoreOutlined />, label: 'All Assets' }
          ]
        },

        // 3.2. Cấu hình Danh mục - [MOVED] Chỉ Admin (IT) thấy
        ...(PERMISSIONS.IS_SYSTEM_ADMIN(userRole) ? [
             { 
               key: '/admin/categories', 
               icon: <ToolOutlined />, // Icon công cụ cho hợp ngữ cảnh settings
               label: 'Asset Categories', // Đổi tên chút cho rõ nghĩa
               style: { color: '#595959' } 
             }
        ] : [])
      ]
    }] : []),

    // 4. SUPPORT CENTER
    {
      key: 'grp_support', label: 'SUPPORT CENTER', type: 'group',
      children: [
        {
          key: 'sub_ticket', label: 'IT Helpdesk', icon: <CustomerServiceOutlined />,
          children: [
            { key: '/tickets/create', icon: <FileAddOutlined />, label: 'Create Ticket' },
            { key: '/tickets/my-tickets', icon: <UnorderedListOutlined />, label: 'My Tickets' },
            
            ...(PERMISSIONS.CAN_MANAGE_TICKET(userRole) ? [
                { key: '/tickets/manage', icon: <SolutionOutlined />, label: 'Manage Tickets', style: { color: '#1890ff' } },
                { key: '/tickets/reports', icon: <BarChartOutlined />, label: 'Reports & Stats', style: { color: '#722ed1' } }
            ] : []),

            ...(PERMISSIONS.IS_SYSTEM_ADMIN(userRole) ? [
                { key: '/tickets/settings', icon: <SettingOutlined />, label: 'Ticket Settings', style: { color: '#595959' } }
            ] : [])
          ].filter(Boolean)
        }
      ]
    },

    // 5. SYSTEM ADMIN (Chỉ còn User Management)
    ...(PERMISSIONS.IS_SYSTEM_ADMIN(userRole) ? [{
      key: 'grp_sys', label: 'SYSTEM ADMIN', type: 'group',
      children: [
        { key: '/admin/users', icon: <SafetyOutlined />, label: 'User Management' },
        // Category Settings đã chuyển lên trên
      ],
    }] : []),
  ].filter(Boolean);
};
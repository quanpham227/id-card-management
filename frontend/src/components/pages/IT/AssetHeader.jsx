import React from 'react';
import { Flex, Typography, Input, Button } from 'antd';
import { SearchOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const AssetHeader = ({ 
  defaultType,     // Loại thiết bị mặc định (PC/Laptop...)
  filteredCount,   // Số lượng kết quả tìm thấy
  onSearch,        // Hàm xử lý tìm kiếm
  onAdd,           // Hàm xử lý khi bấm nút Add New
  onReload,        // Hàm xử lý khi bấm nút Refresh
  loading,         // Trạng thái đang tải dữ liệu
  canEdit          // Quyền hạn của user
}) => {
  return (
    <Flex 
      justify="space-between" 
      align="center" 
      wrap="wrap" 
      gap="middle"
      style={{ 
        marginBottom: 16, 
        background: '#fff', 
        padding: '16px', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)' 
      }}
    >
      <div>
        <Title level={4} style={{ margin: 0 }}>
           {defaultType ? `${defaultType} Inventory` : 'Full Asset Management'}
        </Title>
        <Text type="secondary">Found {filteredCount} matching items</Text>
      </div>
      
      <Flex gap="small" wrap="wrap" style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Input 
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
          placeholder="Search anything..." 
          onChange={(e) => onSearch(e.target.value)} 
          style={{ width: '100%', maxWidth: '350px', borderRadius: '8px' }} 
          allowClear 
        />
        
        {canEdit && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={onAdd} 
            style={{ borderRadius: '8px' }}
          >
            Add New
          </Button>
        )}
        
        <Button 
          icon={<ReloadOutlined />} 
          onClick={onReload} 
          loading={loading} 
          style={{ borderRadius: '8px' }} 
        />
      </Flex>
    </Flex>
  );
};

export default AssetHeader;
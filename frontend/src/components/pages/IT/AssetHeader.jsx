import React from 'react';
import { Flex, Typography, Input, Button, Tooltip, Upload } from 'antd';
import { 
  SearchOutlined, PlusOutlined, ReloadOutlined, 
  FileExcelOutlined, CloudUploadOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

const AssetHeader = ({ 
  defaultType,     // Loại thiết bị mặc định (PC/Laptop...)
  filteredCount,   // Số lượng kết quả tìm thấy
  onSearch,        // Hàm xử lý tìm kiếm
  onAdd,           // Hàm xử lý khi bấm nút Add New
  onReload,        // Hàm xử lý khi bấm nút Refresh
  onExport,        // Hàm xử lý xuất Excel
  onImport,        // [MỚI] Hàm xử lý Import Excel
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
          placeholder="Search (Code, Model, User...)" 
          onChange={(e) => onSearch(e.target.value)} 
          style={{ width: '100%', maxWidth: '280px', borderRadius: '8px' }} 
          allowClear 
        />
        
        {/* NÚT XUẤT EXCEL */}
        <Tooltip title="Export current list to Excel">
            <Button 
                icon={<FileExcelOutlined />} 
                onClick={onExport}
                style={{ color: '#52c41a', borderColor: '#b7eb8f', borderRadius: '8px' }}
            >
                Export
            </Button>
        </Tooltip>

        {canEdit && (
          <>
            {/* [MỚI] NÚT IMPORT EXCEL */}
            <Upload 
              beforeUpload={(file) => {
                onImport(file);
                return false; // Ngăn không cho tự động upload, để xử lý thủ công
              }}
              showUploadList={false}
              accept=".xlsx, .xls"
            >
              <Tooltip title="Import assets from Excel">
                <Button 
                  icon={<CloudUploadOutlined />} 
                  style={{ color: '#1890ff', borderColor: '#91d5ff', borderRadius: '8px' }}
                >
                  Import
                </Button>
              </Tooltip>
            </Upload>

            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={onAdd} 
              style={{ borderRadius: '8px' }}
            >
              Add New
            </Button>
          </>
        )}
        
        <Tooltip title="Reload Data">
            <Button 
              icon={<ReloadOutlined />} 
              onClick={onReload} 
              loading={loading} 
              style={{ borderRadius: '8px' }} 
            />
        </Tooltip>
      </Flex>
    </Flex>
  );
};

export default AssetHeader;
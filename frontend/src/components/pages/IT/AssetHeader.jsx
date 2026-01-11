import React from 'react';
import { Flex, Typography, Input, Button, Tooltip, Upload, Dropdown } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;

const AssetHeader = ({
  defaultType,
  filteredCount,
  onSearch,
  onAdd,
  onReload,
  onExport,
  onImport,
  loading,
  canEdit,
}) => {
  // Hàm tạo file mẫu
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Asset Code': 'PC-TEST-01',
        Type: 'PC',
        Model: 'Dell Optiplex 7090',
        Health: 'Good',
        Status: 'In Use',
        'User Name': 'Nguyen Van A',
        'Emp ID': 'EMP001',
        Department: 'IT',
        'Purchase Date': '2024-01-01',
        CPU: 'i5-12500',
        RAM: '16GB',
        Storage: '512GB SSD',
        OS: 'Windows 11',
        Office: '2021',
        Monitor: 'Dell P2422H',
        Notes: 'Sample data',
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'Asset_Import_Template.xlsx');
  };

  // [SỬA LỖI] Thay vì tạo <Menu>, ta tạo danh sách items
  const importMenuItems = [
    {
      key: 'upload',
      label: (
        <Upload
          beforeUpload={(file) => {
            onImport(file);
            return false;
          }}
          showUploadList={false}
          accept=".xlsx, .xls"
        >
          <div style={{ padding: '4px 0' }}>Upload File</div>
        </Upload>
      ),
      icon: <CloudUploadOutlined />,
    },
    {
      key: 'template',
      label: 'Download Template',
      icon: <DownloadOutlined />,
      onClick: handleDownloadTemplate,
    },
  ];

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
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
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

        <Tooltip title="Export current list">
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
            {/* [SỬA LỖI] Dùng prop 'menu' thay vì 'overlay' */}
            <Dropdown menu={{ items: importMenuItems }} placement="bottomRight" arrow>
              <Button
                icon={<CloudUploadOutlined />}
                style={{ color: '#1890ff', borderColor: '#91d5ff', borderRadius: '8px' }}
              >
                Import
              </Button>
            </Dropdown>

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

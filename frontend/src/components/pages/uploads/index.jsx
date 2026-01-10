import React, { useMemo, useState } from 'react';
import { 
  Upload, message, Card, Typography, Alert, 
  Tag, Flex, List, Avatar, Badge, Row, Col, Tooltip 
} from 'antd';
import { 
  InboxOutlined, LockOutlined, CloudUploadOutlined, 
  CheckCircleFilled, CloseCircleFilled,
  FileImageOutlined 
} from '@ant-design/icons';

// IMPORT CENTRALIZED PERMISSIONS
import { PERMISSIONS } from '../../utils/permissions';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

const UploadPage = () => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  // --- 1. AUTH & CONFIG ---
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  
  // [CẬP NHẬT] Đổi tên hàm từ CAN_OPERATE thành CAN_MANAGE_HR_DATA cho khớp với file permissions mới
  const canUpload = PERMISSIONS.CAN_MANAGE_HR_DATA(user.role);
  
  const API_URL = import.meta.env.VITE_API_URL || '';

  // --- 2. UPLOAD PROPS CONFIG ---
  const uploadProps = useMemo(() => ({
    name: 'files', 
    multiple: true,
    action: API_URL ? `${API_URL}/api/upload` : '/api/upload',
    headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`, 
        'X-User-Role': user.role 
    },
    accept: '.jpg,.jpeg,.png', 
    // Vô hiệu hóa hành động nếu không có quyền
    disabled: !canUpload || uploading,
    fileList,
    showUploadList: false, 

    beforeUpload(file) {
      if (!canUpload) {
        message.error("Access denied: You do not have permission to upload.");
        return Upload.LIST_IGNORE;
      }
      
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error(`${file.name} is too large (> 5MB). File skipped.`);
        return Upload.LIST_IGNORE; 
      }
      return true;
    },

    onChange(info) {
      const { status } = info.file;
      
      let newFileList = [...info.fileList];
      newFileList = newFileList.slice(-5); // Giữ 5 hoạt động gần nhất
      setFileList(newFileList);

      if (status === 'uploading') {
        setUploading(true);
      }
      
      if (status === 'done') {
        setUploading(false);
        message.success(`${info.file.name}: Uploaded successfully.`);
      } else if (status === 'error') {
        setUploading(false);
        const errorMsg = info.file.response?.detail || "Upload failed.";
        message.error(`${info.file.name}: ${errorMsg}`);
      }
    },
  }), [canUpload, uploading, fileList, user.role, API_URL]);

  return (
    <div style={{ padding: '16px', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* HEADER SECTION */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Flex align="center" gap={12}>
          <Avatar 
             icon={<CloudUploadOutlined />} 
             style={{ backgroundColor: canUpload ? '#1890ff' : '#8c8c8c' }} 
             size="large" 
          />
          <Title level={2} style={{ margin: 0 }}>Photo Management</Title>
        </Flex>
        <Tag color={canUpload ? "blue" : "default"} style={{ padding: '4px 12px', borderRadius: 4 }}>
          Role: {user.role?.toUpperCase() || 'GUEST'}
        </Tag>
      </Flex>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          {/* PERMISSION STATUS ALERT */}
          {!canUpload ? (
            <Alert
              message="View-Only Mode" 
              description="Your account (Staff) does not have permission to upload photos. You may only view recent activity."
              type="warning"
              showIcon
              icon={<LockOutlined />}
              style={{ marginBottom: 24, borderRadius: 12 }}
            />
          ) : (
            <Alert
              message="Upload Instructions"
              description={
                <Paragraph style={{ marginBottom: 0 }}>
                  Rename files to match <Text strong>Employee ID </Text> (e.g., <Text code>18100012.png</Text>). 
                  Max size: 5MB. Supports JPG/PNG.
                </Paragraph>
              }
              type="info"
              showIcon
              style={{ marginBottom: 24, borderRadius: 12 }}
            />
          )}

          {/* MAIN UPLOAD CARD */}
          <Card variant="outlined" style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
            <Tooltip title={!canUpload ? "You don't have permission to upload" : ""}>
              <Dragger 
                {...uploadProps} 
                style={{ 
                  borderRadius: 12, 
                  padding: 32, 
                  background: canUpload ? '#fafafa' : '#f5f5f5',
                  cursor: canUpload ? 'pointer' : 'not-allowed'
                }}
              >
                <p className="ant-upload-drag-icon">
                  {canUpload ? (
                    <InboxOutlined style={{ color: uploading ? '#40a9ff' : '#1890ff' }} />
                  ) : (
                    <LockOutlined style={{ color: '#ff4d4f' }} />
                  )}
                </p>
                <Title level={4}>
                  {canUpload ? "Click or drag photos to this area to upload" : "Upload Feature Locked"}
                </Title>
                <Paragraph type="secondary">
                  {canUpload 
                    ? "Support for a single or bulk upload. Strict filename policy applied."
                    : "Please contact HR Manager or IT Admin to request upload access."}
                </Paragraph>
              </Dragger>
            </Tooltip>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* RECENT ACTIVITY LOG - STAFF CAN STILL SEE THIS */}
          <Card 
            title={
              <Flex justify="space-between" align="center">
                <span>Recent Upload Log</span>
                <Badge count={fileList.length} showZero color={canUpload ? 'blue' : '#d9d9d9'} />
              </Flex>
            }
            style={{ borderRadius: 16, height: '100%', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}
          >
            <List
              dataSource={fileList}
              locale={{ emptyText: 'No recent uploads found' }}
              renderItem={(file) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      file.status === 'done' ? 
                      <CheckCircleFilled style={{ color: '#52c41a', fontSize: 24 }} /> : 
                      file.status === 'error' ? 
                      <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 24 }} /> :
                      <Avatar icon={<FileImageOutlined />} style={{ backgroundColor: '#bfbfbf' }} />
                    }
                    title={<Text ellipsis style={{ maxWidth: 180 }}>{file.name}</Text>}
                    description={
                      <Text type={file.status === 'done' ? "success" : file.status === 'error' ? "danger" : "secondary"} style={{ fontSize: 12 }}>
                        {file.status?.toUpperCase() || 'PENDING'}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UploadPage;
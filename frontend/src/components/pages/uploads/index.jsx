import React, { useMemo, useState } from 'react';
import { 
  Upload, message, Card, Typography, Alert, Result, 
  Tag, Flex, List, Avatar, Badge, Row, Col 
} from 'antd';
import { 
  InboxOutlined, LockOutlined, CloudUploadOutlined, 
  CheckCircleFilled, CloseCircleFilled,
  FileImageOutlined 
} from '@ant-design/icons';

// 1. [QUAN TRỌNG] THÊM DÒNG NÀY ĐỂ IMPORT LOGIC QUYỀN MỚI
import { PERMISSIONS } from '../../utils/permissions';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

const UploadPage = () => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  // --- 1. AUTH & CONFIG ---
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  
  // 2. [ĐÃ SỬA] THAY ĐỔI LOGIC CHECK QUYỀN TẠI ĐÂY
  // Logic cũ: const canUpload = ['admin', 'it', 'hr'].includes(role); -> Thiếu Manager
  // Logic mới: Dùng CAN_OPERATE (Bao gồm Admin, Manager, HR)
  const canUpload = PERMISSIONS.CAN_OPERATE(user.role);
  
  const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000';

  // --- 2. UPLOAD HANDLERS ---
  const uploadProps = useMemo(() => ({
    name: 'files', 
    multiple: true,
    action: `${API_URL}/api/upload`,
    headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`, 
        'X-User-Role': user.role 
    },
    accept: '.jpg,.jpeg,.png', 
    disabled: !canUpload || uploading,
    fileList,
    showUploadList: false, 

    beforeUpload(file) {
      if (!canUpload) {
        message.error("Bạn không có thẩm quyền!");
        return Upload.LIST_IGNORE;
      }
      
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error(`${file.name} quá nặng (> 5MB). Đã bỏ qua.`);
        return Upload.LIST_IGNORE; 
      }
      
      return true;
    },

    onChange(info) {
      const { status } = info.file;
      
      let newFileList = [...info.fileList];
      newFileList = newFileList.slice(-5);
      setFileList(newFileList);

      if (status === 'uploading') {
        setUploading(true);
      }
      
      if (status === 'done') {
        setUploading(false);
        message.success(`${info.file.name}: Tải lên thành công.`);
      } else if (status === 'error') {
        setUploading(false);
        const errorMsg = info.file.response?.detail || "Lỗi tải lên.";
        message.error(`${info.file.name}: ${errorMsg}`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [canUpload, uploading, fileList, user.role, API_URL]);

  return (
    <div style={{ padding: '16px', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* HEADER SECTION */}
      <Flex justify="space-between" align="flex-end" style={{ marginBottom: 24 }}>
        <div>
          <Flex align="center" gap={12}>
            <Avatar 
               icon={<CloudUploadOutlined />} 
               style={{ backgroundColor: '#1890ff' }} 
               size="large" 
            />
            <Title level={2} style={{ margin: 0 }}>Photo Management</Title>
          </Flex>
          
        </div>
        <Tag color="blue">Account: {user.username || 'Unknown'}</Tag>
      </Flex>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          {/* CẢNH BÁO QUYỀN HẠN */}
          {!canUpload ? (
            <Alert
              message="Access Restricted" 
              description="Tài khoản Staff chỉ có quyền xem dữ liệu. Vui lòng liên hệ IT để cấp quyền upload."
              type="error"
              showIcon
              icon={<LockOutlined />}
              style={{ marginBottom: 24, borderRadius: 12 }}
            />
          ) : (
            <Alert
              description={
                <Paragraph style={{ marginBottom: 0 }}>
                  Use the <Text strong>Employee ID </Text> as the file name(VD: <Text code>18100012.png</Text>). 
                  Files larger than 5MB will be automatically rejected.
                </Paragraph>
              }
              type="info"
              showIcon
              style={{ marginBottom: 24, borderRadius: 12 }}
            />
          )}

          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
            {canUpload ? (
              <Dragger {...uploadProps} style={{ borderRadius: 12, padding: 32, background: '#fafafa' }}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: uploading ? '#40a9ff' : '#1890ff' }} />
                </p>
                <Title level={4}>Kéo thả ảnh nhân viên vào đây</Title>
                <Paragraph type="secondary">
                  Hỗ trợ tải nhiều file cùng lúc. Chỉ chấp nhận file ảnh dưới 5MB.
                </Paragraph>
              </Dragger>
            ) : (
              <Result
                status="403"
                title="403 Unauthorized"
                subTitle="Xin lỗi, bạn không có quyền thực hiện thao tác này."
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* LOG TẢI LÊN GẦN ĐÂY */}
          <Card variant="borderless"
            title={<Flex justify="space-between"><span>Hoạt động gần đây</span><Badge count={fileList.length} showZero color={uploading ? 'blue' : '#d9d9d9'} /></Flex>}
            
            style={{ borderRadius: 16, height: '100%', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}
          >
            <List
              dataSource={fileList}
              locale={{ emptyText: 'Chưa có file nào được tải lên' }}
              renderItem={(file) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      file.status === 'done' ? 
                      <CheckCircleFilled style={{ color: '#52c41a', fontSize: 24 }} /> : 
                      file.status === 'error' ? 
                      <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 24 }} /> :
                      <Avatar icon={<FileImageOutlined />} style={{ backgroundColor: '#1890ff' }} />
                    }
                    title={<Text ellipsis style={{ maxWidth: 180 }}>{file.name}</Text>}
                    description={
                        file.status === 'done' ? <Text type="success" style={{fontSize: 12}}>Thành công</Text> : 
                        file.status === 'uploading' ? <Text type="warning" style={{fontSize: 12}}>Đang xử lý...</Text> : 
                        <Text type="danger" style={{fontSize: 12}}>Thất bại</Text>
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
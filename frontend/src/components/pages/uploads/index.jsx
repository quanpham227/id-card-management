import React, { useMemo, useState, useEffect } from 'react';
import {
  Upload,
  message,
  Card,
  Typography,
  Alert,
  Tag,
  Flex,
  List,
  Avatar,
  Badge,
  Row,
  Col,
  Tooltip,
  Button, //  Thêm Button
  notification, //  Thêm Notification để báo kết quả chi tiết
  Spin,
} from 'antd';
import {
  InboxOutlined,
  LockOutlined,
  CloudUploadOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  FileImageOutlined,
  SyncOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

// IMPORT PERMISSIONS
import { PERMISSIONS } from '../../utils/permissions';
// IMPORT CONTEXT
import { useEmployees } from '../../../context/useEmployees';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

const UploadPage = () => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  // 🆕 STATE CHO NÚT SYNC
  const [syncing, setSyncing] = useState(false);

  // --- LẤY DANH SÁCH NHÂN VIÊN TỪ CONTEXT ---
  const { employees, fetchEmployees, isLoaded } = useEmployees();

  useEffect(() => {
    if (!isLoaded) {
      fetchEmployees();
    }
  }, [isLoaded]);

  // --- AUTH & CONFIG ---
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const canUpload = PERMISSIONS.CAN_MANAGE_HR_DATA(user.role);

  // Cấu hình Base URL động
  let baseUrl = import.meta.env.VITE_API_URL;
  if (!baseUrl) baseUrl = 'http://localhost:8000/api';
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

  const uploadAction = `${baseUrl}/upload`;

  // ------------------------------------------------------------------
  // 🆕 HÀM GỌI API ĐỒNG BỘ ẢNH (TÍNH NĂNG MỚI)
  // ------------------------------------------------------------------
  const handleSyncOldPhotos = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseUrl}/sync-old-photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-User-Role': user.role, // Gửi role để backend check quyền Admin
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Lỗi kết nối Server');
      }

      // Thông báo kết quả
      if (data.synced_count > 0) {
        notification.success({
          message: 'Đồng bộ thành công!',
          description: (
            <div>
              Đã tự động tìm thấy và cập nhật ảnh cho <b>{data.synced_count}</b> nhân viên cũ quay
              lại làm việc.
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Xem log server để biết chi tiết từng ID.
              </Text>
            </div>
          ),
          duration: 6,
        });
      } else {
        message.info('Hệ thống đã quét: Không có nhân viên cũ nào cần cập nhật ảnh.');
      }
    } catch (error) {
      notification.error({
        message: 'Đồng bộ thất bại',
        description: error.message,
      });
    } finally {
      setSyncing(false);
    }
  };

  // ------------------------------------------------------------------
  // UPLOAD PROPS CONFIG (GIỮ NGUYÊN LOGIC VALIDATION CŨ)
  // ------------------------------------------------------------------
  const uploadProps = useMemo(
    () => ({
      name: 'files',
      multiple: true,
      action: uploadAction,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'X-User-Role': user.role,
      },
      accept: '.jpg,.jpeg,.png',
      disabled: !canUpload || uploading,
      fileList,
      showUploadList: false,

      // 🔥 [QUAN TRỌNG] LOGIC VALIDATION TÊN FILE
      beforeUpload(file) {
        if (!canUpload) {
          message.error('Access denied: You do not have permission to upload.');
          return Upload.LIST_IGNORE;
        }

        // 1. Check kích thước (Max 5MB)
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
          message.error(`${file.name}: File quá lớn (> 5MB).`);
          return Upload.LIST_IGNORE;
        }

        // 2. Lấy tên file (bỏ đuôi)
        const fileName = file.name;
        const lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex === -1) {
          message.error(`${fileName}: File không hợp lệ (không có đuôi file).`);
          return Upload.LIST_IGNORE;
        }
        const nameWithoutExt = fileName.substring(0, lastDotIndex);

        // 🔥 3. CHECK KÝ TỰ: Chỉ cho phép SỐ (0-9)
        // Regex /^\d+$/ nghĩa là: Bắt đầu và kết thúc đều là số
        const isOnlyNumbers = /^\d+$/.test(nameWithoutExt);

        if (!isOnlyNumbers) {
          message.error({
            content: (
              <span>
                File <b>{fileName}</b> bị từ chối.
                <br />
                Lý do: Tên file chứa chữ cái hoặc ký tự đặc biệt.{' '}
                <b>Chỉ chấp nhận file tên là SỐ.</b>
              </span>
            ),
            duration: 5,
          });
          return Upload.LIST_IGNORE;
        }

        // 🔥 4. CHECK ĐỘ DÀI: Khoảng 15 số (Chặn nếu quá dài > 20)
        if (nameWithoutExt.length > 20) {
          message.error({
            content: (
              <span>
                File <b>{fileName}</b> bị từ chối.
                <br />
                Lý do: Mã số quá dài (Lớn hơn 20 ký tự).
              </span>
            ),
            duration: 5,
          });
          return Upload.LIST_IGNORE;
        }

        // 🔥 5. CHECK TỒN TẠI: Mã số này có trong DB nhân viên không?
        const isValidEmployeeID = employees.some(
          (emp) => emp.employee_id.trim() === nameWithoutExt.trim()
        );

        if (!isValidEmployeeID) {
          message.error({
            content: (
              <span>
                File <b>{fileName}</b> bị từ chối.
                <br />
                Lý do: Mã nhân viên <b>{nameWithoutExt}</b> không tồn tại trong hệ thống.
              </span>
            ),
            duration: 5,
          });
          return Upload.LIST_IGNORE;
        }

        return true; // ✅ Hợp lệ
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
          message.success(`${info.file.name}: Upload thành công.`);
        } else if (status === 'error') {
          setUploading(false);
          const errorMsg = info.file.response?.detail || 'Upload thất bại.';
          message.error(`${info.file.name}: ${errorMsg}`);
        }
      },
    }),
    [canUpload, uploading, fileList, user.role, uploadAction, employees]
  );
  const antIcon = <LoadingOutlined style={{ fontSize: 40 }} spin />;
  return (
    <Spin
      spinning={syncing}
      indicator={antIcon}
      tip={
        <div style={{ marginTop: 15, fontWeight: 600 }}>
          Hệ thống đang quét và đồng bộ ảnh... Vui lòng đợi!
        </div>
      }
      size="large"
    >
      <div style={{ padding: '16px', maxWidth: 1200, margin: '0 auto' }}>
        {/* HEADER */}
        <Flex
          justify="space-between"
          align="center"
          style={{ marginBottom: 24 }}
          wrap="wrap"
          gap="small"
        >
          <Flex align="center" gap={12}>
            <Avatar
              icon={<CloudUploadOutlined />}
              style={{ backgroundColor: canUpload ? '#1890ff' : '#8c8c8c' }}
              size="large"
            />
            <Title level={2} style={{ margin: 0 }}>
              Photo Management
            </Title>
          </Flex>

          <Flex gap="small" align="center">
            <Tag
              color={canUpload ? 'blue' : 'default'}
              style={{ padding: '4px 12px', marginRight: 0 }}
            >
              Role: {user.role?.toUpperCase() || 'GUEST'}
            </Tag>

            {/* 🆕 NÚT BẤM SYNC MỚI */}
            {canUpload && (
              <Button
                type="default"
                icon={<SyncOutlined spin={syncing} />}
                onClick={handleSyncOldPhotos}
                loading={syncing}
                title="Tự động tìm và copy ảnh cũ cho nhân viên mới vào lại"
              >
                Sync Old Photos
              </Button>
            )}
          </Flex>
        </Flex>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            {/* INFO ALERT */}
            {!canUpload ? (
              <Alert
                message="View-Only Mode"
                description="Bạn không có quyền upload."
                type="warning"
                showIcon
                icon={<LockOutlined />}
                style={{ marginBottom: 24 }}
              />
            ) : (
              <Alert
                message="Quy tắc đặt tên file (Nghiêm ngặt)"
                description={
                  <Paragraph style={{ marginBottom: 0 }}>
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      <li>
                        Tên file phải là{' '}
                        <Text strong type="danger">
                          Mã Nhân Viên (Chỉ bao gồm SỐ)
                        </Text>
                        .
                      </li>
                      <li>Không chứa chữ cái (A-Z), khoảng trắng hay ký tự đặc biệt (@, -, _).</li>
                      <li>
                        Ví dụ đúng:{' '}
                        <Text code type="success">
                          18100012.png
                        </Text>
                      </li>
                      <li>
                        Ví dụ sai:{' '}
                        <Text code delete>
                          NV1810.png
                        </Text>
                        ,{' '}
                        <Text code delete>
                          avatar.jpg
                        </Text>
                      </li>
                    </ul>
                  </Paragraph>
                }
                type="info"
                showIcon
                style={{ marginBottom: 24, borderRadius: 12, border: '1px solid #91caff' }}
              />
            )}

            {/* UPLOAD AREA */}
            <Card
              variant="outlined"
              style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}
            >
              <Tooltip title={!canUpload ? 'Bạn không có quyền upload' : ''}>
                <Dragger
                  {...uploadProps}
                  style={{
                    borderRadius: 12,
                    padding: 32,
                    background: canUpload ? '#fafafa' : '#f5f5f5',
                    cursor: canUpload ? 'pointer' : 'not-allowed',
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
                    {canUpload ? 'Kéo ảnh vào đây để upload' : 'Tính năng đang khóa'}
                  </Title>
                  <Paragraph type="secondary">
                    Chỉ chấp nhận file ảnh (.png, .jpg). Tên file phải là số ID nhân viên.
                  </Paragraph>
                </Dragger>
              </Tooltip>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            {/* LOG */}
            <Card
              title={
                <Flex justify="space-between" align="center">
                  <span>Lịch sử Upload</span>
                  <Badge count={fileList.length} showZero color={canUpload ? 'blue' : '#d9d9d9'} />
                </Flex>
              }
              style={{ borderRadius: 16, height: '100%' }}
            >
              <List
                dataSource={fileList}
                locale={{ emptyText: 'Chưa có file nào vừa upload' }}
                renderItem={(file) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        file.status === 'done' ? (
                          <CheckCircleFilled style={{ color: '#52c41a', fontSize: 24 }} />
                        ) : file.status === 'error' ? (
                          <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 24 }} />
                        ) : (
                          <Avatar icon={<FileImageOutlined />} />
                        )
                      }
                      title={
                        <Text ellipsis style={{ maxWidth: 180 }}>
                          {file.name}
                        </Text>
                      }
                      description={
                        <Text
                          type={file.status === 'done' ? 'success' : 'danger'}
                          style={{ fontSize: 12 }}
                        >
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
    </Spin>
  );
};

export default UploadPage;

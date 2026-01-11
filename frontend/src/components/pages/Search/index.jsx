import React, { useState, useMemo } from 'react';
// 1. Đảm bảo import đầy đủ các component cần thiết
import {
  Input,
  Card,
  Button,
  Typography,
  Empty,
  message,
  Spin,
  Image,
  Flex,
  AutoComplete,
  Badge,
  Descriptions,
  Tag,
  Row,
  Col,
} from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
  FileImageOutlined,
  PictureOutlined,
  UserOutlined,
} from '@ant-design/icons';
import axiosClient from '../../../api/axiosClient';
import { useEmployees } from '../../../context/useEmployees';

const { Title, Text } = Typography;

const SearchPage = () => {
  const API_URL = import.meta.env.VITE_API_URL || '';
  const { employees } = useEmployees();

  const [searchId, setSearchId] = useState('');
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Logic AutoComplete
  const options = useMemo(() => {
    if (searchId.length < 2) return [];
    return employees
      .filter(
        (e) =>
          e.employee_id.includes(searchId) ||
          (e.employee_old_id && e.employee_old_id.includes(searchId)) || // Tìm cả mã cũ
          e.employee_name.toLowerCase().includes(searchId.toLowerCase())
      )
      .slice(0, 10)
      .map((e) => ({
        value: e.employee_id,
        label: (
          <Flex justify="space-between">
            <span>
              {e.employee_id} - <b>{e.employee_name}</b>
            </span>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {e.employee_department}
            </Text>
          </Flex>
        ),
      }));
  }, [searchId, employees]);

  const handleSearch = (value) => {
    const cleanId = value.trim().toUpperCase();
    if (!cleanId) return;

    setLoading(true);
    setImageError(false);
    setImageUrl(null);

    const empInfo = employees.find((e) => e.employee_id === cleanId);
    setSelectedEmp(empInfo);

    const url = `${API_URL}/images/${cleanId}.png`;
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      setImageUrl(url);
      setLoading(false);
    };
    img.onerror = () => {
      setImageError(true);
      setLoading(false);
    };
  };

  const handleDownload = async () => {
    if (!imageUrl || imageError) return;
    setDownloading(true);
    try {
      const response = await axiosClient.get(`/download/${selectedEmp?.employee_id || searchId}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'image/png' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${selectedEmp?.employee_id || searchId}.png`;
      link.click();
      message.success(`Đã tải xuống: ${link.download}`);
    } catch {
      message.error('Lỗi tải ảnh từ Server.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 10px' }}>
      <Flex vertical align="center" style={{ marginBottom: 40 }}>
        <Badge count={<PictureOutlined style={{ color: '#1890ff', fontSize: 20 }} />}>
          <Title level={2} style={{ margin: 0 }}>
            Employee Directory
          </Title>
        </Badge>
        <Text type="secondary">Tra cứu hồ sơ ảnh và thông tin nhân sự</Text>
      </Flex>

      <Card
        variant="borderless"
        style={{ marginBottom: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.05)', borderRadius: 16 }}
      >
        <AutoComplete
          popupMatchSelectWidth={true}
          style={{ width: '100%' }}
          options={options}
          onSelect={(val) => {
            setSearchId(val);
            handleSearch(val);
          }}
          onSearch={setSearchId}
        >
          <Input.Search
            placeholder="Nhập ID, Tên hoặc Mã thẻ cũ..."
            enterButton={
              <Button type="primary" icon={<SearchOutlined />}>
                Tra cứu
              </Button>
            }
            size="large"
            onSearch={handleSearch}
          />
        </AutoComplete>
      </Card>

      {loading ? (
        // SỬA LỖI SPIN: Bọc trong container để không bị Warning tip
        <Flex vertical align="center" justify="center" style={{ padding: 100 }}>
          <Spin size="large" />
          <Text type="secondary" style={{ marginTop: 16 }}>
            Đang truy xuất dữ liệu...
          </Text>
        </Flex>
      ) : imageUrl || imageError ? (
        <Row gutter={[24, 24]}>
          <Col xs={24} md={10}>
            <Card
              variant="borderless"
              style={{
                textAlign: 'center',
                borderRadius: 16,
                overflow: 'hidden',
                background: '#fafafa',
              }}
            >
              {imageError ? (
                <Empty description="Không có ảnh chân dung" />
              ) : (
                <Image
                  src={imageUrl}
                  style={{
                    borderRadius: 8,
                    width: '100%',
                    maxWidth: 280,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  placeholder={<Spin />}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} md={14}>
            <Card
              title={
                <Flex gap={8} align="center">
                  <UserOutlined /> Hồ sơ chi tiết
                </Flex>
              }
              variant="borderless"
              style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}
            >
              {selectedEmp ? (
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Họ tên">
                    <Text strong>{selectedEmp.employee_name}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mã NV">{selectedEmp.employee_id}</Descriptions.Item>
                  <Descriptions.Item label="Mã thẻ cũ">
                    {selectedEmp.employee_old_id || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Bộ phận">
                    {selectedEmp.employee_department}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    {/* LỖI THIẾU TAG ĐÃ ĐƯỢC FIX TẠI ĐÂY */}
                    <Tag color={selectedEmp.employee_status === 'Active' ? 'green' : 'red'}>
                      {selectedEmp.employee_status?.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Empty description="Thông tin nhân sự không có sẵn" />
              )}

              <Button
                type="primary"
                icon={<DownloadOutlined />}
                block
                size="large"
                onClick={handleDownload}
                disabled={imageError}
                loading={downloading}
                style={{ marginTop: 24, height: 45, borderRadius: 8 }}
              >
                Tải ảnh PNG gốc
              </Button>
            </Card>
          </Col>
        </Row>
      ) : (
        <Flex vertical align="center" style={{ marginTop: 80, color: '#d9d9d9' }}>
          <FileImageOutlined style={{ fontSize: 80, marginBottom: 20 }} />
          <Text type="secondary">Nhập thông tin nhân viên để bắt đầu</Text>
        </Flex>
      )}
    </div>
  );
};

export default SearchPage;

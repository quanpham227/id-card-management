import React, { useState, useMemo } from 'react';
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
          (e.employee_old_id && e.employee_old_id.includes(searchId)) ||
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

  // --- [CẬP NHẬT] HÀM XỬ LÝ TÌM KIẾM ---
  const handleSearch = (value) => {
    const cleanId = value.trim().toUpperCase();
    if (!cleanId) return;

    setLoading(true);
    setImageError(false);
    setImageUrl(null);

    // 1. Tìm nhân viên trong danh sách
    const empInfo = employees.find((e) => e.employee_id === cleanId);
    setSelectedEmp(empInfo);

    if (empInfo) {
      // 2. Xác định tên file ảnh
      const imageName = empInfo.image || empInfo.image_path || `${cleanId}.png`;

      let finalUrl = '';

      // 3. Xây dựng đường dẫn (Logic Dynamic - Chuẩn Production)
      if (imageName.startsWith('http')) {
        finalUrl = imageName;
      } else {
        // --- LOGIC MỚI: Tự động nhận diện môi trường ---
        let apiUrl = import.meta.env.VITE_API_URL;

        // Nếu không có biến môi trường (Localhost) -> Fallback về localhost:8000
        if (!apiUrl) {
          apiUrl = 'http://localhost:8000';
        }

        // Nếu là Docker (/api) -> Cắt bỏ /api để lấy root server
        // Kết quả: apiUrl="" (rỗng) -> Đường dẫn sẽ là tương đối
        const SERVER_ROOT = apiUrl.replace(/\/api$/, '');

        // Xử lý đường dẫn file (Fix lỗi Windows backslash)
        let cleanPath = imageName.replace(/\\/g, '/');

        // Bỏ dấu / ở đầu nếu có
        if (cleanPath.startsWith('/')) {
          cleanPath = cleanPath.substring(1);
        }

        // Ghép URL:
        // - Local: http://localhost:8000/images/NV01.png
        // - Docker: /images/NV01.png (Nginx tự điều hướng)
        finalUrl = `${SERVER_ROOT}/images/${cleanPath}`;
        // ---------------------------------------------------
      }

      // 4. Preload ảnh để kiểm tra tồn tại
      const img = new window.Image();
      img.src = finalUrl;
      img.onload = () => {
        setImageUrl(finalUrl);
        setLoading(false);
      };
      img.onerror = () => {
        console.error('Không tìm thấy ảnh tại:', finalUrl);
        setImageError(true);
        setLoading(false);
      };
    } else {
      setLoading(false);
      message.warning('Không tìm thấy nhân viên này trong hệ thống');
    }
  };

  // --- HÀM DOWNLOAD (Giữ nguyên vì dùng axiosClient đã chuẩn) ---
  const handleDownload = async () => {
    if (!imageUrl || imageError) return;
    setDownloading(true);
    try {
      const targetId = selectedEmp?.employee_id || searchId;

      const response = await axiosClient.get(`/download/${targetId}`, {
        responseType: 'blob',
      });

      const contentType = response.headers['content-type'] || 'image/png';
      const blob = new Blob([response.data], { type: contentType });

      let extension = 'png';
      if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = 'jpg';
      else if (contentType.includes('webp')) extension = 'webp';

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${targetId}.${extension}`;
      link.click();

      message.success(`Đã tải xuống: ${link.download}`);
    } catch (error) {
      console.error(error);
      message.error('Lỗi tải ảnh (File không tồn tại trên Server).');
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

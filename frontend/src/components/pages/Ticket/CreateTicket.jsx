import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Upload,
  message,
  Row,
  Col,
  Typography,
  Divider,
  Tag,
} from 'antd';
import { UploadOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';
import { PRIORITY_LEVELS } from '../../../constants/constants';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CreateTicket = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // States
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data State
  const [categories, setCategories] = useState([]);
  const [assets, setAssets] = useState([]);
  const [fileList, setFileList] = useState([]);

  // --- 1. Fetch Categories & Assets ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, assetRes] = await Promise.all([
          axiosClient.get('/ticket-categories?active_only=true'),
          axiosClient.get('/assets'),
        ]);
        setCategories(Array.isArray(catRes) ? catRes : catRes.data || []);
        setAssets(Array.isArray(assetRes) ? assetRes : assetRes.data || []);
      } catch (error) {
        console.error('Fetch error:', error);
        message.warning('Could not load full system data. Some options may be limited.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 2. Helper: Safe Error Message ---
  const getErrorMessage = (error) => {
    if (!error.response) return 'Connection error. Please check your network.';
    const { detail } = error.response.data || {};
    if (Array.isArray(detail)) return `Validation Error: ${detail[0].msg}`;
    return typeof detail === 'string' ? detail : 'An unexpected error occurred.';
  };

  // --- 3. Image Validation & Handling ---
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error(`${file.name} is not an image file!`);
      return Upload.LIST_IGNORE;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error(`Image ${file.name} must be smaller than 5MB!`);
      return Upload.LIST_IGNORE;
    }

    return false; // Chặn auto-upload
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // --- 4. Form Submission ---
  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      let attachmentUrls = '';

      // Step A: Upload Images
      if (fileList.length > 0) {
        const formData = new FormData();
        fileList.forEach((fileItem) => {
          if (fileItem.originFileObj) {
            formData.append('files', fileItem.originFileObj);
          }
        });

        // --- [SỬA ĐỔI QUAN TRỌNG]: Xử lý URL Upload ---
        let uploadEndpoint = '/ticket-upload';

        // Nếu là Localhost (không có biến môi trường), ta ép cứng URL tuyệt đối
        // Lý do: axiosClient mặc định baseURL='/api'. Nếu gọi '/ticket-upload' -> '/api/ticket-upload'
        // Trên localhost port 5173, đường dẫn này sẽ 404.
        // Ta ép cứng http://localhost:8000/... để axios bỏ qua baseURL và gọi thẳng server.
        if (!import.meta.env.VITE_API_URL) {
          uploadEndpoint = 'http://localhost:8000/api/ticket-upload';
        }

        // Gọi API Upload
        const uploadRes = await axiosClient.post(uploadEndpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        attachmentUrls = (uploadRes.data?.filenames || []).join(',');
      }

      // Step B: Post Ticket Data
      const payload = {
        title: values.title,
        description: values.description,
        priority: Number(values.priority),
        category_id: Number(values.category_id),
        asset_id: values.asset_id ? Number(values.asset_id) : null,
        attachment_url: attachmentUrls,
      };

      await axiosClient.post('/tickets', payload);
      message.success('Ticket submitted successfully!');
      navigate('/tickets/my-tickets');
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="layout-content" style={{ maxWidth: 800, margin: '20px auto' }}>
      <Card
        variant="borderless"
        style={{ borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Title level={2}>Create Support Ticket</Title>
          <Text type="secondary">Please provide accurate information for faster resolution.</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ priority: 2 }}
          disabled={loading || submitting}
          requiredMark="optional"
        >
          {/* Subject Line */}
          <Form.Item
            name="title"
            label={<Text strong>Subject</Text>}
            rules={[{ required: true, message: 'Please enter a brief subject' }]}
          >
            <Input placeholder="Short summary (e.g., VPN connection failed)" size="large" />
          </Form.Item>

          <Row gutter={16}>
            {/* Category selection */}
            <Col span={12} xs={24} sm={12}>
              <Form.Item
                name="category_id"
                label={<Text strong>Category</Text>}
                rules={[{ required: true, message: 'Please select an issue category' }]}
              >
                <Select placeholder="Select issue type" size="large">
                  {categories.map((cat) => (
                    <Option key={cat.id} value={cat.id}>
                      {cat.name}{' '}
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        ({cat.sla_hours}h SLA)
                      </Text>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Priority level */}
            <Col span={12} xs={24} sm={12}>
              <Form.Item
                name="priority"
                label={<Text strong>Priority</Text>}
                rules={[{ required: true }]}
              >
                <Select size="large">
                  {Object.entries(PRIORITY_LEVELS).map(([value, info]) => (
                    <Option key={value} value={Number(value)}>
                      <Tag color={info.color}>{info.label}</Tag> - {info.desc}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Related Asset selection */}
          <Form.Item
            name="asset_id"
            label={<Text strong>Related Asset (Optional)</Text>}
            tooltip="Search by Device Code or Employee ID"
          >
            <Select
              placeholder="Search your device..."
              allowClear
              showSearch
              size="large"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {assets.map((asset) => {
                const assignee = asset.assigned_to || {};
                const empId = assignee.employee_id || '---';
                const empName = assignee.employee_name || 'Unassigned';

                return (
                  <Option
                    key={asset.id}
                    value={asset.id}
                    label={`${asset.asset_code} ${empId} ${empName}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Tag color="cyan" style={{ minWidth: 85, textAlign: 'center' }}>
                        {asset.asset_code}
                      </Tag>
                      <Text strong style={{ minWidth: 80, margin: '0 8px' }}>
                        {empId}
                      </Text>
                      <span style={{ color: '#d9d9d9', margin: '0 8px' }}>|</span>
                      <Text type="secondary" ellipsis title={empName}>
                        {empName}
                      </Text>
                    </div>
                  </Option>
                );
              })}
            </Select>
          </Form.Item>

          {/* Detailed description */}
          <Form.Item
            name="description"
            label={<Text strong>Detailed Description</Text>}
            rules={[{ required: true, message: 'Please describe the issue' }]}
          >
            <TextArea
              rows={5}
              placeholder="What happened? Error messages?"
              showCount
              maxLength={1500}
            />
          </Form.Item>

          {/* Attachments */}
          <Form.Item
            label={<Text strong>Image Attachments</Text>}
            extra="Only JPG/PNG/WEBP images under 5MB are allowed."
          >
            <Upload
              fileList={fileList}
              beforeUpload={beforeUpload}
              onChange={handleUploadChange}
              multiple={true}
              listType="picture-card"
              accept="image/*"
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload Image</div>
              </div>
            </Upload>
          </Form.Item>

          <Divider />

          {/* Form buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={() => navigate(-1)} size="large" style={{ width: 120 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={submitting}
              size="large"
              style={{ width: 180 }}
            >
              Submit Ticket
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CreateTicket;

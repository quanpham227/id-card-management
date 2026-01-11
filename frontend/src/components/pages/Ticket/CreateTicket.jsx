import React, { useState, useMemo } from 'react';
import { 
  Card, Form, Input, Select, Button, Upload, 
  message, Typography, Row, Col, Alert, Divider 
} from 'antd';
import { 
  InboxOutlined, SendOutlined, InfoCircleOutlined, 
  DesktopOutlined, WifiOutlined, SaveOutlined 
} from '@ant-design/icons';
import axiosClient from '../../../api/axiosClient';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Option } = Select;

const CreateTicket = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  // Get current user info for display purposes
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);

  // Static Categories (Or you can fetch from API /admin/categories)
  const TICKET_CATEGORIES = [
    { value: 'Hardware', label: 'Hardware Issue (PC, Laptop, Printer)', icon: <DesktopOutlined /> },
    { value: 'Software', label: 'Software / OS / License', icon: <SaveOutlined /> },
    { value: 'Network', label: 'Network / Internet / WiFi', icon: <WifiOutlined /> },
    { value: 'Access', label: 'Account Access / Email / Password', icon: <InfoCircleOutlined /> },
    { value: 'Other', label: 'Other Request', icon: <InfoCircleOutlined /> },
  ];

  const PRIORITIES = [
    { value: 'Low', label: 'Low - No urgency', color: 'green' },
    { value: 'Medium', label: 'Medium - Affects work partially', color: 'blue' },
    { value: 'High', label: 'High - Cannot work', color: 'orange' },
    { value: 'Critical', label: 'Critical - System wide failure', color: 'red' },
  ];

  // Handle File Upload Change
  const handleFileChange = ({ fileList: newFileList }) => {
    // Limit to 3 files
    setFileList(newFileList.slice(-3));
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Use FormData for file upload support
      const formData = new FormData();
      
      formData.append('title', values.subject);
      formData.append('description', values.description);
      formData.append('category', values.category);
      formData.append('priority', values.priority);
      
      // Append files
      fileList.forEach(file => {
        if (file.originFileObj) {
            formData.append('files', file.originFileObj);
        }
      });

      // API Call
      await axiosClient.post('/tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      message.success('Ticket created successfully! IT Team has been notified.');
      
      // Reset form and redirect
      form.resetFields();
      setFileList([]);
      navigate('/tickets/my-tickets'); // Redirect to My Tickets list
      
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.detail || "Failed to create ticket.";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Submit a Support Ticket</Title>
        <Text type="secondary">
          Please describe your issue in detail. Our IT team will respond as soon as possible.
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* LEFT COLUMN: FORM */}
        <Col xs={24} lg={16}>
          <Card 
            variant="borderless" 
            style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            <Form 
              form={form} 
              layout="vertical" 
              onFinish={onFinish}
              initialValues={{ priority: 'Medium' }}
            >
              {/* 1. Subject */}
              <Form.Item 
                name="subject" 
                label="Subject / Title" 
                rules={[{ required: true, message: 'Please enter a subject' }]}
              >
                <Input placeholder="e.g., Printer on 2nd floor is not working" size="large" />
              </Form.Item>

              <Row gutter={16}>
                {/* 2. Category */}
                <Col xs={24} md={12}>
                  <Form.Item 
                    name="category" 
                    label="Category" 
                    rules={[{ required: true, message: 'Please select a category' }]}
                  >
                    <Select placeholder="Select Issue Type" size="large">
                      {TICKET_CATEGORIES.map(cat => (
                        <Option key={cat.value} value={cat.value}>
                           <span style={{ marginRight: 8 }}>{cat.icon}</span> {cat.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                {/* 3. Priority */}
                <Col xs={24} md={12}>
                  <Form.Item name="priority" label="Priority Level">
                    <Select size="large">
                      {PRIORITIES.map(p => (
                        <Option key={p.value} value={p.value}>
                          <span style={{ color: p.color, fontWeight: 'bold' }}>•</span> {p.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {/* 4. Description */}
              <Form.Item 
                name="description" 
                label="Detailed Description" 
                rules={[{ required: true, message: 'Please describe the issue' }]}
              >
                <TextArea 
                  rows={6} 
                  placeholder="Describe what happened, error messages, steps to reproduce..." 
                  showCount 
                  maxLength={1000} 
                />
              </Form.Item>

              {/* 5. Attachments */}
              <Form.Item label="Attachments (Screenshots/Logs)">
                <Dragger 
                  fileList={fileList}
                  onChange={handleFileChange}
                  beforeUpload={() => false} // Prevent auto upload, send with form
                  multiple
                  maxCount={3}
                  listType="picture"
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ color: '#1890ff' }} />
                  </p>
                  <p className="ant-upload-text">Click or drag file to this area to upload</p>
                  <p className="ant-upload-hint">
                    Support for a single or bulk upload. Strictly prohibited from uploading company data files.
                  </p>
                </Dragger>
              </Form.Item>

              <Divider />

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SendOutlined />} 
                  size="large" 
                  loading={loading}
                  block
                >
                  Submit Ticket
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* RIGHT COLUMN: INFO & GUIDELINE */}
        <Col xs={24} lg={8}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* User Info Card */}
            <Card title="Requester Info" size="small" style={{ borderRadius: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div><Text type="secondary">Full Name:</Text> <br/><Text strong>{user.full_name}</Text></div>
                <div><Text type="secondary">Department:</Text> <br/><Text strong>{user.department || 'N/A'}</Text></div>
                <div><Text type="secondary">Email:</Text> <br/><Text copyable>{user.email || user.username}</Text></div>
              </div>
            </Card>

            {/* Quick Tips */}
            <Alert
              message="Tips for faster support"
              description={
                <ul style={{ paddingLeft: 16, margin: 0 }}>
                  <li>Include screenshots of the error.</li>
                  <li>Mention the specific Device ID (Asset Code).</li>
                  <li>Is it affecting only you or the whole team?</li>
                </ul>
              }
              type="info"
              showIcon
              style={{ borderRadius: 8 }}
            />

            {/* SLA Info */}
            <Card title="SLA Commitment" size="small" style={{ borderRadius: 8 }}>
              <p><span style={{color: 'red'}}>● Critical:</span> Within 2 hours</p>
              <p><span style={{color: 'orange'}}>● High:</span> Within 8 hours</p>
              <p><span style={{color: 'blue'}}>● Medium:</span> Within 24 hours</p>
              <p><span style={{color: 'green'}}>● Low:</span> Within 48 hours</p>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default CreateTicket;
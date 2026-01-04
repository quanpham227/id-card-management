import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Row, Col, Divider, Button, Flex, Typography } from 'antd';
import { SaveOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const AssetFormModal = ({ open, onCancel, onFinish, editingAsset, employees = [], defaultType, loading }) => {
  const [form] = Form.useForm();
  
  // State quản lý loại thiết bị để hiển thị trường nhập liệu tương ứng
  const [selectedType, setSelectedType] = useState(defaultType || 'PC');

  // --- 1. EFFECT: KHỞI TẠO DỮ LIỆU KHI MỞ MODAL ---
  useEffect(() => {
    if (open) {
      if (editingAsset) {
        // === MODE: CHỈNH SỬA ===
        // Cập nhật state loại thiết bị
        setSelectedType(editingAsset.type);

        // Đổ dữ liệu vào form (Làm phẳng object specs/software)
        form.setFieldsValue({
          ...editingAsset,
          // Flatten nested specs
          cpu: editingAsset.specs?.cpu,
          ram: editingAsset.specs?.ram,
          storage: editingAsset.specs?.storage,
          mainboard: editingAsset.specs?.mainboard,
          
          // Flatten nested software
          os: editingAsset.software?.os,
          office: editingAsset.software?.office,
          
          // Flatten monitor & assigned
          monitor_model: editingAsset.monitor?.model,
          assigned_id: editingAsset.assigned_to?.employee_id,
          
          // Xử lý ngày tháng an toàn
          purchase_date: editingAsset.purchase_date ? dayjs(editingAsset.purchase_date) : null
        });
      } else {
        // === MODE: THÊM MỚI ===
        form.resetFields();
        const initType = defaultType || 'PC';
        setSelectedType(initType);
        
        // Set giá trị mặc định
        form.setFieldsValue({ 
          type: initType, 
          health_status: 'Good', 
          purchase_date: dayjs() 
        });
      }
    }
  }, [open, editingAsset, defaultType, form]);

  // --- 2. XỬ LÝ SUBMIT & LÀM SẠCH DỮ LIỆU ---
  const handleSubmit = (values) => {
    // Copy values để xử lý
    const cleanValues = { ...values };

    // Nếu là Printer hoặc Monitor -> Xóa thông tin cấu hình máy tính (tránh gửi dữ liệu rác)
    const isComputer = ['PC', 'Laptop', 'Tablet'].includes(values.type);
    
    if (!isComputer) {
        delete cleanValues.cpu;
        delete cleanValues.ram;
        delete cleanValues.storage;
        delete cleanValues.mainboard;
        delete cleanValues.os;
        delete cleanValues.office;
    }

    // Nếu là Tablet -> Xóa mainboard (thường không quản lý mainboard tablet)
    if (values.type === 'Tablet') {
        delete cleanValues.mainboard;
    }

    // Nếu không phải PC -> Xóa màn hình kèm theo
    if (values.type !== 'PC') {
        delete cleanValues.monitor_model;
    }

    onFinish(cleanValues);
  };

  return (
    <Modal 
      title={<Title level={4} style={{margin:0}}>{editingAsset ? "Update Asset Information" : "Register New Asset"}</Title>}
      open={open} 
      onCancel={onCancel} 
      width={850} 
      footer={null} 
      centered
      destroyOnHidden
      maskClosable={false} // Bắt buộc bấm nút Cancel hoặc X để đóng, tránh đóng nhầm
    >
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={handleSubmit}
        // Cập nhật giao diện ngay khi thay đổi loại thiết bị
        onValuesChange={(changedValues) => {
          if (changedValues.type) {
            setSelectedType(changedValues.type);
          }
        }}
      >
        <Row gutter={[24, 0]}>
          {/* --- CỘT TRÁI --- */}
          <Col xs={24} md={12}>
            <Divider titlePlacement="left" style={{marginTop: 0}}>General Info</Divider>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="asset_code" label="Asset Code" rules={[{required:true, message: 'Missing Code'}]}>
                  <Input disabled={!!editingAsset} placeholder="IT-PC-XXX"/>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="type" label="Asset Type" rules={[{required:true}]}>
                  <Select disabled={!!defaultType}>
                    <Option value="PC">PC</Option>
                    <Option value="Laptop">Laptop</Option>
                    <Option value="Tablet">Tablet</Option>
                    <Option value="Printer">Printer</Option>
                    <Option value="Monitor">Monitor</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="model" label="Brand & Model" rules={[{required:true, message: 'Missing Model'}]}>
              <Input placeholder="Dell Optiplex, HP Probook..." />
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="health_status" label="Health Status">
                  <Select>
                    <Option value="Good">Good</Option>
                    <Option value="Warning">Warning</Option>
                    <Option value="Critical">Critical</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="purchase_date" label="Purchase Date">
                  <DatePicker style={{width:'100%'}} format="DD/MM/YYYY"/>
                </Form.Item>
              </Col>
            </Row>

            {/* Chỉ hiện Monitor Model cho PC */}
            {selectedType === 'PC' && (
              <Form.Item name="monitor_model" label="Monitor Model (Included)">
                <Input placeholder="Dell E2216H..." />
              </Form.Item>
            )}
          </Col>

          {/* --- CỘT PHẢI --- */}
          <Col xs={24} md={12}>
            <Divider titlePlacement="left" style={{marginTop: 0}}>Technical Specs & User</Divider>
            
            {['PC', 'Laptop', 'Tablet'].includes(selectedType) ? (
              <>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item name="cpu" label="CPU / Processor">
                      <Input placeholder="e.g. i5-13400" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="ram" label="RAM Memory">
                      <Input placeholder="e.g. 16GB DDR4" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="storage" label="Storage (HDD/SSD)">
                  <Input placeholder="e.g. SSD 512GB NVMe" />
                </Form.Item>
                
                {selectedType !== 'Tablet' && (
                  <Form.Item name="mainboard" label="Mainboard">
                    <Input placeholder="e.g. Gigabyte B660M" />
                  </Form.Item>
                )}
              </>
            ) : (
              <Flex vertical align="center" justify="center" style={{padding: '30px 0', background: '#fafafa', borderRadius: 8, marginBottom: 24}}>
                <PrinterOutlined style={{fontSize:32, color:'#d9d9d9', marginBottom: 8}} />
                <Text type="secondary" style={{fontSize: 12}}>Specs are not applicable for {selectedType}s</Text>
              </Flex>
            )}
            
            <Form.Item name="assigned_id" label="Assigned User">
              <Select
                placeholder="Select employee..."
                allowClear
                showSearch // Đã sửa: showSearch là boolean
                optionFilterProp="label" // Tìm kiếm dựa trên label của option
                filterOption={(input, option) => 
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={employees.map(e => ({
                    value: e.employee_id,
                    label: `${e.employee_name} (${e.employee_department}) - ${e.employee_id}`
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="left">Software & Notes</Divider>
        
        {/* Chỉ hiện OS/Office cho máy tính */}
        {['PC', 'Laptop', 'Tablet'].includes(selectedType) && (
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="os" label="Operating System">
                  <Input placeholder="Windows 10 Pro / Win 11..."/>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="office" label="Office Version">
                  <Input placeholder="Office 2019 / 2021 / 365..."/>
                </Form.Item>
              </Col>
            </Row>
        )}

        <Form.Item name="notes" label="Remarks / Notes">
          <TextArea rows={2} placeholder="Any repairs, warranty info, or issues..." />
        </Form.Item>

        <Flex justify="end" gap="small" style={{ marginTop: 10, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Button onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
            {editingAsset ? "Update Changes" : "Save New Asset"}
          </Button>
        </Flex>
      </Form>
    </Modal>
  );
};

export default AssetFormModal;
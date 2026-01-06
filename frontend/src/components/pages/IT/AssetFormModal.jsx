import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Row, Col, Divider, Button, Flex, Typography, Radio } from 'antd';
import { SaveOutlined, PrinterOutlined, UserOutlined, UserAddOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const AssetFormModal = ({ open, onCancel, onFinish, editingAsset, employees = [], defaultType, loading }) => {
  const [form] = Form.useForm();
  const selectedType = Form.useWatch('type', form);

  // [MỚI] State để quản lý chế độ nhập liệu: 'internal' (chọn list) hoặc 'manual' (nhập tay)
  const [assignMode, setAssignMode] = useState('internal');

  useEffect(() => {
    if (open) {
      if (editingAsset) {
        // Logic xác định chế độ hiện tại của Asset đang sửa
        const assignedId = editingAsset.assigned_to?.employee_id;
        // Kiểm tra xem ID này có trong danh sách nhân viên API không
        const isInternal = employees.some(e => e.employee_id === assignedId);
        
        // Nếu có ID mà không tìm thấy trong list -> Suy ra là nhập tay (Manual)
        const mode = (assignedId && !isInternal) ? 'manual' : 'internal';
        setAssignMode(mode);

        form.setFieldsValue({
          ...editingAsset,
          cpu: editingAsset.specs?.cpu,
          ram: editingAsset.specs?.ram,
          storage: editingAsset.specs?.storage,
          mainboard: editingAsset.specs?.mainboard,
          os: editingAsset.software?.os,
          office: editingAsset.software?.office,
          monitor_model: editingAsset.monitor?.model,
          purchase_date: editingAsset.purchase_date ? dayjs(editingAsset.purchase_date) : null,
          
          // [MỚI] Mapping dữ liệu dựa trên mode
          assigned_id: mode === 'internal' ? assignedId : undefined, 
          // Nếu là manual thì map dữ liệu cũ vào các ô input tay
          manual_emp_id: mode === 'manual' ? assignedId : undefined, 
          manual_emp_name: mode === 'manual' ? editingAsset.assigned_to?.employee_name : undefined,
          manual_emp_dept: mode === 'manual' ? editingAsset.assigned_to?.department : undefined,
        });
      } else {
        // Reset form cho tạo mới
        form.resetFields();
        setAssignMode('internal'); // Mặc định là chọn nhân viên nội bộ
        form.setFieldsValue({ 
          type: defaultType || 'PC', 
          health_status: 'Good', 
          purchase_date: dayjs() 
        });
      }
    }
  }, [open, editingAsset, defaultType, form, employees]);

  const handleSubmit = (values) => {
    const cleanValues = { ...values };
    const isComputer = ['PC', 'Laptop', 'Tablet'].includes(values.type);
    
    // Logic cũ: Xóa các trường specs thừa nếu không phải máy tính
    if (!isComputer) {
      delete cleanValues.cpu; delete cleanValues.ram; delete cleanValues.storage;
      delete cleanValues.mainboard; delete cleanValues.os; delete cleanValues.office;
    }
    if (values.type === 'Tablet') delete cleanValues.mainboard;
    if (values.type !== 'PC') delete cleanValues.monitor_model;

    // [MỚI] Gửi kèm assignMode ra ngoài để AssetManager xử lý
    // AssetManager sẽ quyết định lấy assigned_id hay lấy manual_... dựa trên mode này
    onFinish({ ...cleanValues, assignMode });
  };

  return (
    <Modal 
      title={<Title level={4} style={{margin:0}}>{editingAsset ? "Update Asset" : "Register New Asset"}</Title>}
      open={open} 
      onCancel={onCancel} 
      width={850} 
      footer={null} 
      centered
      destroyOnHidden 
      maskClosable={false}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={[24, 0]}>
          <Col xs={24} md={12}>
            {/* CỘT TRÁI: THÔNG TIN CHUNG */}
            <Divider orientation="left" style={{marginTop: 0}}>General Info</Divider>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="asset_code" label="Asset Code" rules={[{required: true, message: 'Required'}]}>
                  <Input disabled={!!editingAsset} placeholder="IT-PC-001"/>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="type" label="Asset Type" rules={[{required: true}]}>
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

            <Form.Item name="model" label="Brand & Model" rules={[{required: true, message: 'Required'}]}>
              <Input placeholder="Dell, HP, Samsung..." />
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="health_status" label="Status" rules={[{required: true}]}>
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

            {selectedType === 'PC' && (
              <Form.Item name="monitor_model" label="Monitor Model (Included)">
                <Input placeholder="Optional monitor info" />
              </Form.Item>
            )}
          </Col>

          <Col xs={24} md={12}>
            {/* CỘT PHẢI: CẤU HÌNH & GÁN NGƯỜI DÙNG */}
            <Divider orientation="left" style={{marginTop: 0}}>Technical & Assignment</Divider>
            
            {['PC', 'Laptop', 'Tablet'].includes(selectedType) ? (
              <>
                <Row gutter={12}>
                  <Col span={12}><Form.Item name="cpu" label="CPU"><Input placeholder="i5, i7..." /></Form.Item></Col>
                  <Col span={12}><Form.Item name="ram" label="RAM"><Input placeholder="8GB, 16GB..." /></Form.Item></Col>
                </Row>
                <Form.Item name="storage" label="Storage"><Input placeholder="SSD 512GB..." /></Form.Item>
                {selectedType !== 'Tablet' && <Form.Item name="mainboard" label="Mainboard"><Input placeholder="B660..." /></Form.Item>}
              </>
            ) : (
              <Flex vertical align="center" justify="center" style={{padding: '30px 0', background: '#fafafa', borderRadius: 8, marginBottom: 24}}>
                <PrinterOutlined style={{fontSize:32, color:'#d9d9d9', marginBottom: 8}} />
                <Text type="secondary" style={{fontSize: 12}}>No technical specs required</Text>
              </Flex>
            )}
            
            {/* [PHẦN NÂNG CẤP] KHU VỰC GÁN NGƯỜI DÙNG CHUYÊN NGHIỆP */}
            <div style={{ background: '#f5f5f5', padding: '12px 16px', borderRadius: '8px', marginBottom: 16, border: '1px solid #e8e8e8' }}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                    <Text strong style={{ fontSize: 13 }}>Assigned User</Text>
                    <Radio.Group 
                        value={assignMode} 
                        onChange={(e) => setAssignMode(e.target.value)} 
                        buttonStyle="solid"
                        size="small"
                    >
                        <Radio.Button value="internal"><UserOutlined /> Internal</Radio.Button>
                        <Radio.Button value="manual"><UserAddOutlined /> External</Radio.Button>
                    </Radio.Group>
                </Flex>

                {assignMode === 'internal' ? (
                    // MODE 1: CHỌN TỪ DANH SÁCH NHÂN SỰ
                    <Form.Item name="assigned_id" style={{ marginBottom: 0 }}>
                      <Select
                        placeholder="Select employee from list"
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        options={employees.map(e => ({ value: e.employee_id, label: `${e.employee_name} (${e.employee_department})` }))}
                      />
                    </Form.Item>
                ) : (
                    // MODE 2: NHẬP TAY CHO THIẾT BỊ NGOÀI / KHO
                    <Row gutter={8}>
                        <Col span={8}>
                             <Form.Item name="manual_emp_id" rules={[{ required: true, message: 'ID req' }]} style={{ marginBottom: 0 }}>
                                <Input placeholder="Ext ID (e.g. PRT-01)" />
                             </Form.Item>
                        </Col>
                        <Col span={16}>
                             <Form.Item name="manual_emp_name" rules={[{ required: true, message: 'Name req' }]} style={{ marginBottom: 0 }}>
                                <Input placeholder="Name / Location" />
                             </Form.Item>
                        </Col>
                        <Col span={24} style={{ marginTop: 8 }}>
                             <Form.Item name="manual_emp_dept" style={{ marginBottom: 0 }}>
                                <Input placeholder="Dept / Role (Optional)" />
                             </Form.Item>
                        </Col>
                    </Row>
                )}
            </div>
          </Col>
        </Row>

        <Divider orientation="left">Software & Remarks</Divider>
        
        {['PC', 'Laptop', 'Tablet'].includes(selectedType) && (
            <Row gutter={12}>
              <Col span={12}><Form.Item name="os" label="OS"><Input placeholder="Win 11..."/></Form.Item></Col>
              <Col span={12}><Form.Item name="office" label="Office"><Input placeholder="2021..."/></Form.Item></Col>
            </Row>
        )}

        <Form.Item name="notes" label="Remarks / Notes">
          <TextArea rows={2} placeholder="Issues..." />
        </Form.Item>

        <Flex justify="end" gap="small" style={{ marginTop: 10, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Button onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
            {editingAsset ? "Save Changes" : "Register Asset"}
          </Button>
        </Flex>
      </Form>
    </Modal>
  );
};

export default AssetFormModal;
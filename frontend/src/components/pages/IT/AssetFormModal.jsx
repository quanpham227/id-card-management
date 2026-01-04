import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Row, Col, Divider, Button, Flex, Typography } from 'antd';
import { SaveOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const AssetFormModal = ({ open, onCancel, onFinish, editingAsset, employees = [], defaultType, loading }) => {
  const [form] = Form.useForm();
  const selectedType = Form.useWatch('type', form);

  useEffect(() => {
    if (open) {
      if (editingAsset) {
        form.setFieldsValue({
          ...editingAsset,
          cpu: editingAsset.specs?.cpu,
          ram: editingAsset.specs?.ram,
          storage: editingAsset.specs?.storage,
          mainboard: editingAsset.specs?.mainboard,
          os: editingAsset.software?.os,
          office: editingAsset.software?.office,
          monitor_model: editingAsset.monitor?.model,
          assigned_id: editingAsset.assigned_to?.employee_id,
          purchase_date: editingAsset.purchase_date ? dayjs(editingAsset.purchase_date) : null
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ 
          type: defaultType || 'PC', 
          health_status: 'Good', 
          purchase_date: dayjs() 
        });
      }
    }
  }, [open, editingAsset, defaultType, form]);

  const handleSubmit = (values) => {
    const cleanValues = { ...values };
    const isComputer = ['PC', 'Laptop', 'Tablet'].includes(values.type);
    
    if (!isComputer) {
      delete cleanValues.cpu; delete cleanValues.ram; delete cleanValues.storage;
      delete cleanValues.mainboard; delete cleanValues.os; delete cleanValues.office;
    }
    if (values.type === 'Tablet') delete cleanValues.mainboard;
    if (values.type !== 'PC') delete cleanValues.monitor_model;

    onFinish(cleanValues);
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
            {/* SỬA TẠI ĐÂY: titlePlacement="left" -> orientation="left" */}
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
            {/* SỬA TẠI ĐÂY: titlePlacement="left" -> orientation="left" */}
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
            
            <Form.Item name="assigned_id" label="Assigned User">
              <Select
                placeholder="Select user"
                allowClear
                showSearch
                optionFilterProp="label"
                options={employees.map(e => ({ value: e.employee_id, label: `${e.employee_name} (${e.employee_department})` }))}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* SỬA TẠI ĐÂY: titlePlacement="left" -> orientation="left" */}
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
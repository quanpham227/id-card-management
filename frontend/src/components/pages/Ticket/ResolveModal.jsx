import React from 'react';
import { Modal, Form, Input, Button, Space } from 'antd';

const ResolveModal = ({ open, onCancel, onConfirm, loading, initialNote }) => {
  const [form] = Form.useForm();

  // Reset form khi mở modal
  React.useEffect(() => {
    if (open) form.setFieldsValue({ resolution_note: initialNote || '' });
  }, [open, initialNote, form]);

  return (
    <Modal title="Complete Ticket" open={open} onCancel={onCancel} footer={null}>
      <p>Please describe how you resolved this issue (Required):</p>
      <Form form={form} onFinish={onConfirm} layout="vertical">
        <Form.Item
          name="resolution_note"
          rules={[{ required: true, message: 'Please enter resolution note!' }]}
        >
          <Input.TextArea rows={4} placeholder="e.g. Reinstalled printer driver, issue resolved." />
        </Form.Item>
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Confirm Resolve
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default ResolveModal;

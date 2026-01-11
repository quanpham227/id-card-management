import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Switch, message } from 'antd';
import axiosClient from '../../../api/axiosClient';

const { TextArea } = Input;

const TicketCategoryModal = ({ open, onClose, onSuccess, initialValues }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
        form.setFieldsValue({ is_active: true, sla_hours: 24 });
      }
    }
  }, [open, initialValues, form]);

  const handleFinish = async (values) => {
    setSubmitting(true);
    try {
      if (initialValues) {
        // Edit Mode
        await axiosClient.put(`/ticket-categories/${initialValues.id}`, values);
        message.success('Updated successfully!');
      } else {
        // Create Mode
        await axiosClient.post('/ticket-categories', values);
        message.success('Created successfully!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      const msg = error.response?.data?.detail || 'An error occurred';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={initialValues ? 'Edit Category' : 'Add New Category'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      okText={initialValues ? 'Update' : 'Create'}
      cancelText="Cancel"
      forceRender
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label="Category Name"
          name="name"
          rules={[{ required: true, message: 'Please enter category name' }]}
        >
          <Input placeholder="e.g., Hardware Issue" />
        </Form.Item>

        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item
            label="Code"
            name="code"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Please enter code' }]}
          >
            <Input placeholder="e.g., HW" disabled={!!initialValues} />
          </Form.Item>

          <Form.Item
            label="SLA (Hours)"
            name="sla_hours"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Enter hours' }]}
          >
            <InputNumber min={1} max={720} style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item label="Description" name="description">
          <TextArea rows={3} placeholder="Detailed description..." />
        </Form.Item>

        <Form.Item name="is_active" valuePropName="checked" label="Status">
          <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TicketCategoryModal;

import React, { useState, useRef } from 'react';
import { Modal, Button, Flex, Radio, Checkbox, Typography, message } from 'antd';
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';

// Components & API
import IdCard from '../../../print/IdCard';
import axiosClient from '../../../../api/axiosClient'; // Import trực tiếp axiosClient

const { Text } = Typography;

const PrintModal = ({ open, onClose, employee, onRefresh }) => {
  const [bgOption, setBgOption] = useState(1);
  const [showStamp, setShowStamp] = useState(false);
  const [loading, setLoading] = useState(false);
  const printRef = useRef(null);

  // --- 1. CẤU HÌNH IN ---
  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: employee ? `IDCard_${employee.employee_id}` : 'IDCard',
    pageStyle: `@page { margin: 0; size: auto; } body { margin: 0; }`,
  });

  // --- 2. HÀM XỬ LÝ CHÍNH: IN & LƯU LOG ---
  // src/components/pages/Dashboard/components/PrintModal.jsx

  // --- 2. HÀM XỬ LÝ CHÍNH: IN & LƯU LOG (ĐÃ SỬA) ---
  const handlePrint = async () => {
    if (!employee) return;

    // 1. In trình duyệt
    handlePrintAction();

    setLoading(true);
    try {
      const emp = employee;
      let calculatedReason = 'normal';

      // Lấy giá trị maternity_type và chuyển về chữ thường để so sánh
      const matType = (emp.maternity_type || '').toString().toLowerCase();
      const status = (emp.status || '').toString().toLowerCase();

      // --- LOGIC DÒ TÌM (ĐÃ BỔ SUNG MATERNITY_TYPE) ---

      // 1. Check Thai sản
      const isPregnancy =
        emp.is_pregnancy == true ||
        emp.is_pregnancy === 1 ||
        matType.includes('pregnancy') || // Bắt chữ "Pregnancy Register"
        matType.includes('thai') ||
        status.includes('thai');

      // 2. Check Con nhỏ
      const isHasBaby =
        emp.has_baby == true ||
        emp.has_baby === 1 ||
        matType.includes('baby') || // Bắt chữ "Has Baby"
        matType.includes('con') ||
        status.includes('con');

      if (isPregnancy) calculatedReason = 'pregnancy';
      else if (isHasBaby) calculatedReason = 'has_baby';

      // --- TẠO PAYLOAD ---
      const payload = {
        employees: [
          {
            employee_id: emp.employee_id,
            employee_name: emp.employee_name,
            department: emp.employee_department || '',
            job_title: emp.employee_position || '',
            reason: calculatedReason, // Gửi lý do đúng
          },
        ],
        reason: calculatedReason,
        printed_by: JSON.parse(localStorage.getItem('user') || '{}').username || 'Admin',
      };

      await axiosClient.post('/print/log', payload);
      message.success(`Đã lưu log: ${calculatedReason}`);

      setTimeout(() => {
        onClose();
        if (onRefresh) onRefresh();
      }, 500);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        title={
          <Text strong>
            <PrinterOutlined /> Print ID Card
          </Text>
        }
        open={open}
        onCancel={onClose}
        destroyOnHidden={true} // Thay vì destroyOnHidden để reset state khi mở lại
        footer={[
          <Button key="back" onClick={onClose} icon={<CloseOutlined />}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            loading={loading}
          >
            Confirm Print & Log
          </Button>,
        ]}
        width={500}
        centered
      >
        <div
          style={{
            padding: '20px',
            background: '#f0f2f5',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: '8px',
          }}
        >
          <Flex
            gap="small"
            vertical
            style={{ width: '100%', alignItems: 'center', marginBottom: 15 }}
          >
            {/* Chỉ hiện chọn Template nếu KHÔNG phải Worker */}
            {employee && employee.employee_type !== 'Worker' && (
              <div
                style={{
                  background: '#fff',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                <Text strong style={{ marginRight: 12 }}>
                  Design:
                </Text>
                <Radio.Group onChange={(e) => setBgOption(e.target.value)} value={bgOption}>
                  <Radio value={1}>Standard</Radio>
                  <Radio value={2}>Modern</Radio>
                </Radio.Group>
              </div>
            )}

            <div
              style={{
                background: '#fff',
                padding: '8px 20px',
                borderRadius: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}
            >
              <Checkbox checked={showStamp} onChange={(e) => setShowStamp(e.target.checked)}>
                <Text strong style={{ color: '#1890ff' }}>
                  Add "Access Granted" Stamp
                </Text>
              </Checkbox>
            </div>
          </Flex>

          {/* Preview Area */}
          <IdCard data={employee} bgOption={bgOption} showStamp={showStamp} />
        </div>
      </Modal>

      {/* Hidden Print Area (Vùng ẩn để trình duyệt lấy nội dung in) */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          {employee && (
            <div className="print-only">
              <IdCard data={employee} bgOption={bgOption} showStamp={showStamp} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          .print-only {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
};

export default PrintModal;

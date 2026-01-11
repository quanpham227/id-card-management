import React, { useRef, useState, useMemo } from 'react';
import { Modal, Button, Empty, Typography, message, Alert, Space, Badge } from 'antd';
import { PrinterOutlined, CloseOutlined, WarningOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';

// Components nội bộ
import IdCard from '../../../print/IdCard';
import axiosClient from '../../../../api/axiosClient';

const { Text } = Typography;

const BulkPrintModal = ({ open, onClose, selectedEmployees = [] }) => {
  const componentRef = useRef();
  const [loading, setLoading] = useState(false);

  // --- 1. LOGIC KIỂM TRA DỮ LIỆU (VALIDATION) ---
  const validation = useMemo(() => {
    const missingPhoto = selectedEmployees.filter(
      (emp) =>
        !emp.employee_image ||
        emp.employee_image.includes('N/A') ||
        emp.employee_image.includes('undefined')
    );
    const resigned = selectedEmployees.filter((emp) => emp.employee_status !== 'Active');

    return {
      missingPhoto,
      resigned,
      hasError: missingPhoto.length > 0 || resigned.length > 0,
    };
  }, [selectedEmployees]);

  // --- 2. CẤU HÌNH IN ---
  const triggerPrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `In_The_Nhan_Vien_${new Date().getTime()}`,
    onAfterPrint: () => {
      // Có thể đóng modal sau khi in hoặc giữ lại để xem kết quả
    },
    pageStyle: `
      @page { margin: 0; size: auto; }
      body { margin: 0; -webkit-print-color-adjust: exact; }
    `,
  });

  // --- 3. HÀM XỬ LÝ CHÍNH: IN & LƯU LOG ---
  // --- 3. HÀM XỬ LÝ CHÍNH: IN & LƯU LOG ---
  const handlePrintAndLog = async () => {
    if (!selectedEmployees.length) return;

    triggerPrint();
    setLoading(true);
    try {
      const payload = {
        // Map từng nhân viên để tính lý do riêng biệt
        employees: selectedEmployees.map((emp) => {
          let calculatedReason = 'normal';
          const matType = (emp.maternity_type || '').toString().toLowerCase();
          const status = (emp.status || '').toString().toLowerCase();

          // 1. Check Thai sản
          const isPregnancy =
            emp.is_pregnancy == true ||
            emp.is_pregnancy === 1 ||
            matType.includes('pregnancy') ||
            matType.includes('thai') ||
            status.includes('thai');

          // 2. Check Con nhỏ
          const isHasBaby =
            emp.has_baby == true ||
            emp.has_baby === 1 ||
            matType.includes('baby') ||
            matType.includes('con') ||
            status.includes('con');

          if (isPregnancy) calculatedReason = 'pregnancy';
          else if (isHasBaby) calculatedReason = 'has_baby';

          return {
            employee_id: emp.employee_id,
            employee_name: emp.employee_name,
            department: emp.employee_department || '',
            job_title: emp.employee_position || '',
            // QUAN TRỌNG: Lý do của riêng nhân viên này
            reason: calculatedReason,
          };
        }),

        // Lý do chung (Fallback)
        reason: 'normal',
        printed_by: JSON.parse(localStorage.getItem('user') || '{}').username || 'Admin',
      };

      await axiosClient.post('/print/log', payload);
      message.success(`Đã cập nhật lịch sử in cho ${selectedEmployees.length} nhân viên.`);
    } catch (error) {
      console.error(error);
      message.warning('Lỗi ghi log.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal
      title={
        <Space>
          <PrinterOutlined />
          <span>Xem trước bản in ({selectedEmployees.length} thẻ)</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={1100}
      centered
      footer={null}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '80vh' }}>
        {/* THANH THÔNG BÁO CẢNH BÁO NẾU CÓ LỖI DỮ LIỆU */}
        {validation.hasError && (
          <Alert
            type="warning"
            showIcon
            message={
              <Text strong>
                Phát hiện dữ liệu không hợp lệ:
                {validation.missingPhoto.length > 0 &&
                  ` ${validation.missingPhoto.length} người thiếu ảnh;`}
                {validation.resigned.length > 0 &&
                  ` ${validation.resigned.length} người đã nghỉ việc;`}
              </Text>
            }
            description="Các thẻ thiếu ảnh sẽ in ra phôi trắng ở phần hình ảnh. Vui lòng kiểm tra kỹ."
            style={{ margin: '12px 24px 0 24px' }}
          />
        )}

        {/* KHU VỰC XEM TRƯỚC (PREVIEW) */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#525659', padding: '30px' }}>
          {selectedEmployees.length === 0 ? (
            <div style={{ background: '#fff', padding: 60, borderRadius: 8, textAlign: 'center' }}>
              <Empty description="Không có nhân viên nào trong danh sách in" />
            </div>
          ) : (
            <div ref={componentRef} className="print-container-wrapper">
              <div className="print-grid">
                {selectedEmployees.map((emp, index) => {
                  const isMissingImg = !emp.employee_image || emp.employee_image.includes('N/A');
                  return (
                    <div key={emp.employee_id || index} className="print-item">
                      {/* Badge cảnh báo chỉ hiện trên giao diện web, không hiện khi in */}
                      {!open
                        ? null
                        : isMissingImg && (
                            <div className="no-print-warning">
                              <Badge status="error" text="Thiếu ảnh" />
                            </div>
                          )}
                      <IdCard data={emp} bgOption={1} showStamp={true} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* THANH ĐIỀU KHIỂN (FOOTER) */}
        <div
          style={{
            padding: '16px 24px',
            background: '#fff',
            borderTop: '1px solid #e8e8e8',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text type="secondary">Mẹo: Kiểm tra máy in thẻ nhựa trước khi nhấn "Tiến hành In".</Text>

          <Space size="middle">
            <Button onClick={onClose} icon={<CloseOutlined />}>
              Đóng
            </Button>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              size="large"
              disabled={selectedEmployees.length === 0}
              loading={loading}
              onClick={handlePrintAndLog}
            >
              Tiến hành In
            </Button>
          </Space>
        </div>
      </div>

      <style>{`
        .print-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 25px;
          justify-content: center;
        }

        .print-item {
          position: relative;
        }

        .no-print-warning {
          position: absolute;
          top: -20px;
          left: 0;
          z-index: 10;
        }

        @media print {
          .no-print-warning { display: none !important; }
          .print-container-wrapper { background: none !important; padding: 0 !important; }
          .print-grid { display: block !important; gap: 0; }
          .print-item {
            page-break-after: always;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            width: 100%;
          }
          body * { visibility: hidden; }
          .print-container-wrapper, .print-container-wrapper * { visibility: visible; }
          .print-container-wrapper {
             position: absolute;
             left: 0;
             top: 0;
             width: 100%;
          }
        }
      `}</style>
    </Modal>
  );
};

export default BulkPrintModal;

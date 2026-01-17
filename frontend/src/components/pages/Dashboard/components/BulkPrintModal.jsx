import React, { useRef, useState, useMemo } from 'react';
import {
  Modal,
  Button,
  Empty,
  Typography,
  message,
  Alert,
  Space,
  Badge,
  Radio,
  Divider,
} from 'antd';
import {
  PrinterOutlined,
  CloseOutlined,
  WarningOutlined,
  CreditCardOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';

// Components nội bộ
import IdCard from '../../../print/IdCard';
import axiosClient from '../../../../api/axiosClient';

const { Text } = Typography;

const BulkPrintModal = ({ open, onClose, selectedEmployees = [] }) => {
  const componentRef = useRef();
  const [loading, setLoading] = useState(false);

  // 🔥 [MỚI] STATE CHỌN CHẾ ĐỘ IN: 'card' (Máy thẻ) hoặc 'a4' (Giấy A4)
  const [printMode, setPrintMode] = useState('card');

  // --- 1. LOGIC KIỂM TRA DỮ LIỆU (VALIDATION) - GIỮ NGUYÊN ---
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

  // --- 2. CẤU HÌNH IN (CẬP NHẬT PAGE STYLE ĐỘNG) ---
  const triggerPrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `In_The_Nhan_Vien_${new Date().getTime()}`,
    // Tùy chỉnh CSS @page dựa trên chế độ
    pageStyle:
      printMode === 'card'
        ? `@page { margin: 0; size: 55mm 87mm; } body { margin: 0; -webkit-print-color-adjust: exact; }` // Khổ thẻ
        : `@page { margin: 10mm; size: A4; } body { margin: 0; -webkit-print-color-adjust: exact; }`, // Khổ A4
  });

  // --- 3. HÀM XỬ LÝ CHÍNH: IN & LƯU LOG - GIỮ NGUYÊN ---
  const handlePrintAndLog = async () => {
    if (!selectedEmployees.length) return;

    triggerPrint();
    setLoading(true);
    try {
      const payload = {
        employees: selectedEmployees.map((emp) => {
          let calculatedReason = 'normal';
          const matType = (emp.maternity_type || '').toString().toLowerCase();
          const status = (emp.status || '').toString().toLowerCase();

          const isPregnancy =
            emp.is_pregnancy == true ||
            emp.is_pregnancy === 1 ||
            matType.includes('pregnancy') ||
            matType.includes('thai') ||
            status.includes('thai');

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
            reason: calculatedReason,
          };
        }),
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
      width={1150} // Tăng chiều rộng để xem chế độ A4 thoáng hơn
      centered
      footer={null}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '85vh' }}>
        {/* --- [MỚI] THANH CÔNG CỤ CHỌN CHẾ ĐỘ IN --- */}
        <div
          style={{ padding: '12px 24px', background: '#f0f2f5', borderBottom: '1px solid #e8e8e8' }}
        >
          <Space size="large" wrap>
            <Text strong>Chọn máy in:</Text>
            <Radio.Group
              value={printMode}
              onChange={(e) => setPrintMode(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="card">
                <CreditCardOutlined /> Thẻ nhựa
              </Radio.Button>
              <Radio.Button value="a4">
                <AppstoreOutlined /> In Giấy
              </Radio.Button>
            </Radio.Group>

            <Divider type="vertical" />

            {printMode === 'card' ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                * Mỗi thẻ 1 trang. Tự động ngắt trang.
              </Text>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                * Xếp nhiều thẻ lên 1 trang A4. Tiết kiệm giấy.
              </Text>
            )}
          </Space>
        </div>

        {/* THANH THÔNG BÁO CẢNH BÁO (GIỮ NGUYÊN) */}
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
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            background: '#525659',
            padding: '30px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {selectedEmployees.length === 0 ? (
            <div style={{ background: '#fff', padding: 60, borderRadius: 8, textAlign: 'center' }}>
              <Empty description="Không có nhân viên nào trong danh sách in" />
            </div>
          ) : (
            // 🔥 THÊM CLASS ĐỂ CSS NHẬN DIỆN CHẾ ĐỘ IN
            <div ref={componentRef} className={`print-container-wrapper layout-${printMode}`}>
              {/* Tiêu đề khi in A4 cho chuyên nghiệp */}
              {printMode === 'a4' && (
                <div className="a4-guide-header">
                  DANH SÁCH THẺ NHÂN VIÊN - NGÀY IN: {new Date().toLocaleDateString()}
                </div>
              )}

              <div className="print-grid">
                {selectedEmployees.map((emp, index) => {
                  const isMissingImg = !emp.employee_image || emp.employee_image.includes('N/A');
                  return (
                    <div key={emp.employee_id || index} className="print-item">
                      {!open
                        ? null
                        : isMissingImg && (
                            <div className="no-print-warning-badge">
                              <Badge status="error" text="Thiếu ảnh" />
                            </div>
                          )}
                      <IdCard data={emp} bgOption={1} showStamp={true} fixPageSize={false} />
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
          <Text type="secondary">
            {printMode === 'card'
              ? "Lưu ý in thẻ: Chọn khổ 'Card', Scale '100%'."
              : "Lưu ý in A4: Chọn khổ 'A4', Scale '100%', Margins 'Default'."}
          </Text>

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
              Tiến hành In ({printMode === 'card' ? 'Thẻ' : 'A4'})
            </Button>
          </Space>
        </div>
      </div>

      {/* 🔥 [CSS ĐÃ CẬP NHẬT] XỬ LÝ ĐA CHẾ ĐỘ IN */}
      <style>{`
        /* --- CHUNG --- */
        .no-print-warning-badge {
          position: absolute; top: -20px; left: 0; z-index: 10;
          background: rgba(255,255,255,0.8); padding: 2px 5px; border-radius: 4px;
        }
        .a4-guide-header { display: none; } /* Ẩn tiêu đề trên web */

        /* GIAO DIỆN PREVIEW TRÊN WEB */
        .print-container-wrapper {
           /* Mặc định trong suốt */
           background: transparent; 
        }
        
        /* Chế độ A4: Giả lập tờ giấy trắng trên màn hình để user dễ hình dung */
        .print-container-wrapper.layout-a4 {
           background: white;
           width: 210mm; /* Khổ A4 */
           min-height: 297mm;
           padding: 10mm;
           margin: 0 auto;
           box-shadow: 0 0 15px rgba(0,0,0,0.3);
        }

        .print-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px; /* Khoảng cách hiển thị trên web */
        }
        
        /* Chế độ Card: Scale nhẹ để nhìn được nhiều thẻ hơn */
        .layout-card .print-item {
          position: relative;
          transform: scale(0.9);
          transform-origin: top center;
          margin-bottom: -20px; 
        }

        /* --- KHI BẤM LỆNH IN (MEDIA PRINT) --- */
        @media print {
          /* Ẩn UI thừa */
          body > *:not(.print-container-wrapper) { display: none; }
          .no-print-warning-badge { display: none !important; }
          
          .print-container-wrapper { 
            position: absolute; left: 0; top: 0; width: 100%; 
            margin: 0 !important;
            visibility: visible !important;
          }

          /* --- LOGIC 1: CHẾ ĐỘ IN THẺ RỜI (Card Mode) --- */
          .layout-card .print-grid { 
             display: block !important; 
             gap: 0; margin: 0; padding: 0;
          }
          .layout-card .print-item {
             /* Ngắt trang sau mỗi thẻ */
             page-break-after: always;
             break-after: page;
             
             display: flex; justify-content: center; align-items: center;
             width: 100%; height: 100vh;
             transform: none !important; margin: 0 !important;
          }
          /* Reset tọa độ thẻ con */
          .layout-card .print-item .print-container {
             position: relative !important;
             left: auto !important; top: auto !important; margin: 0 auto !important;
          }

          /* --- LOGIC 2: CHẾ ĐỘ IN GIẤY A4 (A4 Mode) --- */
          .layout-a4 {
    background: white !important;
    padding: 0 !important;
    /* 🔥 SỬA: Đừng set width cứng 210mm ở đây, hãy để 100% vùng khả dụng */
    width: 100% !important; 
    margin: 0 !important;
}

.layout-a4 .a4-guide-header {
    display: block; 
    text-align: center; 
    font-weight: bold; 
    margin-bottom: 5mm; /* Giảm lề dưới tiêu đề chút */
    font-size: 14pt;
    padding-top: 10mm; /* Thêm chút lề trên cho đẹp */
}

.layout-a4 .print-grid {
    display: flex !important;
    flex-wrap: wrap !important;
    /* 🔥 SỬA: Dùng space-evenly hoặc flex-start */
    justify-content: flex-start !important; 
    gap: 5mm; 
    padding-left: 5mm; /* Căn lề trái một chút cho cân */
}

.layout-a4 .print-item {
    page-break-after: auto; 
    page-break-inside: avoid; 
    margin-bottom: 2mm;
    
    flex-shrink: 0; 
    width: auto; 
    height: auto;
}

.layout-a4 .print-item .print-container {
    position: relative !important;
    left: auto !important; top: auto !important;
    border: 1px dashed #999;
}
      `}</style>
    </Modal>
  );
};

export default BulkPrintModal;

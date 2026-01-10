import React, { useState, useRef, useMemo } from 'react';
import { Card, Select, InputNumber, Button, Typography, Flex, Row, Col, Alert, Radio, message, Tooltip } from 'antd';
import { PrinterOutlined, AppstoreAddOutlined, RotateRightOutlined, LockOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import axiosClient from '../../../api/axiosClient.js';
import { CARD_TEMPLATES } from '../../../constants/cardTemplates.js';
import BatchCard from '../../../components/print/BatchCard.jsx';

// IMPORT PERMISSIONS
import { PERMISSIONS } from '../../utils/permissions';

const { Title, Text } = Typography;

const PrintToolsPage = () => {
  // --- AUTH & PERMISSIONS ---
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  
  // [CẬP NHẬT] Dùng CAN_MANAGE_HR_DATA thay vì CAN_OPERATE
  const canPrint = PERMISSIONS.CAN_MANAGE_HR_DATA(user.role);

  const [selectedTemplateId, setSelectedTemplateId] = useState(CARD_TEMPLATES[0].id);
  const [cardNumber, setCardNumber] = useState(1);
  const [printQuantity, setPrintQuantity] = useState(1);
  const [orientation, setOrientation] = useState('portrait');

  const printRef = useRef(null);
  const currentTemplate = CARD_TEMPLATES.find(t => t.id === selectedTemplateId);
  const isBackSide = currentTemplate.id === 'backside';

  // --- SAVE PRINT HISTORY ---
  const handleSavePrintHistory = async () => {
    if (!canPrint) return; // Bảo vệ thêm lớp logic
    
    // Nếu là mặt sau (Back Side) thì thoát luôn, không lưu log
    if (isBackSide) {
        return; 
    }
    try {
      // Sửa lại cách lấy API_URL cho an toàn
      const API_URL = import.meta.env.VITE_API_URL || ''; 
      const payload = {
        card_type: currentTemplate.name,
        serial_number: isBackSide ? "N/A" : cardNumber.toString(),
        quantity: isBackSide ? printQuantity : 1,
        orientation: orientation,
        reason: "tools", 
        printed_by: user.username || "System" 
      };
      await axiosClient.post('/print/log-tool', payload);
      message.success(`Print log saved: ${currentTemplate.name}`);
    } catch  {
      message.error("Failed to save print log.");
    }
  };

  const handlePrint = useReactToPrint({ 
    contentRef: printRef,
    onAfterPrint: handleSavePrintHistory
  });

  const printWidth = orientation === 'portrait' ? '54mm' : '85.6mm';
  const printHeight = orientation === 'portrait' ? '85.6mm' : '54mm';

  return (
    <div style={{ padding: '0 10px' }}>
      <Title level={3}><AppstoreAddOutlined /> Specialized Print Tools</Title>
      
      {/* CẢNH BÁO CHO STAFF */}
      {!canPrint && (
        <Alert
          message="View-Only Mode"
          description="Your account (Staff) can preview card templates but does not have permission to execute printing."
          type="warning"
          showIcon
          icon={<LockOutlined />}
          style={{ marginBottom: 20, borderRadius: 8 }}
        />
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10} lg={8}>
          <Card title="Print Configuration" variant="borderless" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Flex vertical gap="large">
              <div>
                <Text strong>Card Template:</Text>
                <Select
                  style={{ width: '100%', marginTop: 5 }}
                  value={selectedTemplateId}
                  onChange={(val) => { setSelectedTemplateId(val); setOrientation('portrait'); }}
                  options={CARD_TEMPLATES.map(t => ({ value: t.id, label: t.name }))}
                />
              </div>

              {isBackSide ? (
                <div>
                  <Text strong>Quantity:</Text>
                  <InputNumber min={1} max={100} value={printQuantity} onChange={setPrintQuantity} style={{ width: '100%', marginTop: 5 }} />
                  <div style={{ marginTop: 15 }}>
                    <Text strong><RotateRightOutlined /> Orientation:</Text>
                    <Radio.Group block style={{ marginTop: 5 }} value={orientation} onChange={(e) => setOrientation(e.target.value)} buttonStyle="solid">
                      <Radio.Button value="portrait">Portrait</Radio.Button>
                      <Radio.Button value="landscape">Landscape</Radio.Button>
                    </Radio.Group>
                  </div>
                </div>
              ) : (
                <div>
                  <Text strong>Serial / Phone Number:</Text>
                  <InputNumber min={1} value={cardNumber} onChange={setCardNumber} size="large" style={{ width: '100%', marginTop: 5 }} />
                </div>
              )}

              {/* NÚT IN BỊ VÔ HIỆU HÓA CHO STAFF */}
              <Tooltip title={!canPrint ? "You don't have permission to print" : ""}>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<PrinterOutlined />} 
                  onClick={handlePrint} 
                  block
                  disabled={!canPrint} // VÔ HIỆU HÓA TẠI ĐÂY
                >
                  START PRINTING
                </Button>
              </Tooltip>
            </Flex>
          </Card>
        </Col>

        <Col xs={24} md={14} lg={16}>
          <Card 
            title="Live Preview" 
            variant="borderless" 
            style={{ background: '#333', minHeight: '450px', borderRadius: 12 }}
            styles={{ body: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px' } }}
          >
            <BatchCard template={currentTemplate} serialNumber={cardNumber} orientation={orientation} />
          </Card>
        </Col>
      </Row>

      {/* HIDDEN PRINT AREA */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} className="print-area">
          <style>{`
            @media print {
              @page { size: ${printWidth} ${printHeight}; margin: 0; }
              body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
              .print-item { page-break-after: always; display: block; width: ${printWidth}; height: ${printHeight}; }
            }
          `}</style>
          {isBackSide ? 
            Array.from({ length: printQuantity }).map((_, i) => (
              <div key={i} className="print-item"><BatchCard template={currentTemplate} orientation={orientation} /></div>
            )) : 
            <div className="print-item"><BatchCard template={currentTemplate} serialNumber={cardNumber} orientation={orientation} /></div>
          }
        </div>
      </div>
    </div>
  );
};

export default PrintToolsPage;
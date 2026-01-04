import React, { useState, useRef } from 'react';
import { Card, Select, InputNumber, Button, Typography, Flex, Row, Col, Alert, Radio, message } from 'antd';
import { PrinterOutlined, AppstoreAddOutlined, RotateRightOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import axios from 'axios';
import { CARD_TEMPLATES } from '../../../constants/cardTemplates.js';
import BatchCard from '../../../components/Print/BatchCard.jsx';

const { Title, Text } = Typography;

const PrintToolsPage = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState(CARD_TEMPLATES[0].id);
  const [cardNumber, setCardNumber] = useState(1);
  const [printQuantity, setPrintQuantity] = useState(1);
  const [orientation, setOrientation] = useState('portrait');

  const printRef = useRef(null);
  const currentTemplate = CARD_TEMPLATES.find(t => t.id === selectedTemplateId);
  const isBackSide = currentTemplate.id === 'backside';

  // --- HÀM LƯU LỊCH SỬ VÀO BACKEND ---
  const handleSavePrintHistory = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const payload = {
        card_type: currentTemplate.name,
        serial_number: isBackSide ? "N/A" : cardNumber.toString(),
        quantity: isBackSide ? printQuantity : 1,
        orientation: orientation,
        reason: "tools", 
        printed_by: "Admin" // Có thể thay bằng biến user thực tế sau này
      };

      await axios.post(`${API_URL}/api/print/log-tool`, payload);
      message.success(`Đã ghi nhận in: ${currentTemplate.name}`);
    } catch (error) {
      console.error("Lỗi lưu lịch sử in:", error);
      message.error("Không thể lưu lịch sử in vào hệ thống.");
    }
  };

  // --- CẤU HÌNH IN ---
  const handlePrint = useReactToPrint({ 
    contentRef: printRef,
    // Kích hoạt sau khi hộp thoại in đóng lại (In thành công hoặc Hủy)
    onAfterPrint: () => {
      handleSavePrintHistory();
    }
  });

  const handleTemplateChange = (val) => {
    setSelectedTemplateId(val);
    setOrientation('portrait');
  };

  const printWidth = orientation === 'portrait' ? '54mm' : '85.6mm';
  const printHeight = orientation === 'portrait' ? '85.6mm' : '54mm';

  return (
    <div style={{ padding: '0 10px' }}>
      <Title level={3}><AppstoreAddOutlined /> In Thẻ Chuyên Dụng</Title>
      <Row gutter={[24, 24]}>
        {/* CỘT TRÁI: CẤU HÌNH */}
        <Col xs={24} md={10} lg={8}>
          <Card title="Cấu hình in" variant="borderless" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Flex vertical gap="large">
              <div>
                <Text strong>Loại thẻ:</Text>
                <Select
                  style={{ width: '100%', marginTop: 5 }}
                  value={selectedTemplateId}
                  onChange={handleTemplateChange}
                  options={CARD_TEMPLATES.map(t => ({ value: t.id, label: t.name }))}
                />
              </div>

              {isBackSide ? (
                <div>
                  <Text strong>Số lượng thẻ cần in:</Text>
                  <InputNumber min={1} max={100} value={printQuantity} onChange={setPrintQuantity} style={{ width: '100%', marginTop: 5 }} />
                  <div style={{ marginTop: 15 }}>
                    <Text strong><RotateRightOutlined /> Hướng mặt sau:</Text>
                    <Radio.Group block style={{ marginTop: 5 }} value={orientation} onChange={(e) => setOrientation(e.target.value)} buttonStyle="solid">
                      <Radio.Button value="portrait">Dọc</Radio.Button>
                      <Radio.Button value="landscape">Ngang</Radio.Button>
                    </Radio.Group>
                  </div>
                </div>
              ) : (
                <div>
                  <Text strong>Số thẻ hiển thị (SĐT/Số hiệu):</Text>
                  <InputNumber min={1} value={cardNumber} onChange={setCardNumber} size="large" style={{ width: '100%', marginTop: 5 }} />
                </div>
              )}

              <Alert 
                title="Thông tin lệnh in" 
                description={isBackSide ? `In ${printQuantity} bản mặt sau (${orientation === 'portrait' ? 'Dọc' : 'Ngang'})` : `In thẻ ID số: ${cardNumber}`}
                type="info" showIcon 
              />

              <Button type="primary" size="large" icon={<PrinterOutlined />} onClick={handlePrint} block>
                BẮT ĐẦU IN
              </Button>
            </Flex>
          </Card>
        </Col>

        {/* CỘT PHẢI: PREVIEW */}
        <Col xs={24} md={14} lg={16}>
          <Card 
            title="Preview" 
            variant="borderless" 
            style={{ background: '#333', minHeight: '450px' }}
            styles={{ body: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px' } }}
          >
            <BatchCard template={currentTemplate} serialNumber={cardNumber} orientation={orientation} />
          </Card>
        </Col>
      </Row>

      {/* KHU VỰC IN ẨN (HIDDEN PRINT AREA) */}
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
              <div key={i} className="print-item">
                <BatchCard template={currentTemplate} orientation={orientation} />
              </div>
            )) : 
            <div className="print-item">
              <BatchCard template={currentTemplate} serialNumber={cardNumber} orientation={orientation} />
            </div>
          }
        </div>
      </div>
    </div>
  );
};

export default PrintToolsPage;
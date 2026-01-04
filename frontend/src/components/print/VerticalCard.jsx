import React from 'react';
import { NoImagePlaceholder, CardStamp } from './IdCardHelpers';

const VerticalCard = ({
  data,
  employeeImg,
  bgImage,
  imageError,
  setImageError,
  showStamp
}) => {
  return (
    <div
      style={{
        width: '54mm',
        height: '85.6mm',
        backgroundImage: bgImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        // CHUYÊN NGHIỆP: Phông chữ hệ thống sắc nét hơn Arial
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#000',
        boxSizing: 'border-box'
      }}
    >
      {/* ===== KHUNG ẢNH ===== */}
      <div
        style={{
          marginTop: '12.5mm',
          width: '32mm',
          height: '40mm',
          position: 'relative',
          borderRadius: '8px', // Bo nhẹ góc ảnh cho hiện đại
          border: '0.5px solid rgba(0,0,0,0.1)',
          background: '#fff',
          overflow: 'hidden' 
        }}
      >
        {!imageError ? (
          <img
            src={employeeImg}
            alt="Avatar"
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        ) : (
          <NoImagePlaceholder isDarkBg={false} />
        )}

        {/* ===== CON DẤU ===== */}
        {showStamp && (
          <div
            style={{
              position: 'absolute',
              bottom: '-2mm',
              right: '-3mm',
              zIndex: 10,
              transform: 'scale(0.85) rotate(-5deg)' // Xoay nhẹ con dấu cho tự nhiên
            }}
          >
            <CardStamp />
          </div>
        )}
      </div>

      {/* ===== KHỐI THÔNG TIN ===== */}
      <div
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '2mm 4mm 0' // Tăng padding ngang để chữ không sát mép thẻ
        }}
      >
        {/* 1. CHỨC VỤ (Mảnh, cho phép xuống hàng) */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: 400,
            color: '#000', // Màu xám đậm giúp thẻ nhìn tinh tế hơn
            lineHeight: '1.2',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            minHeight: '22px', // Giữ khoảng cách cố định dù 1 hay 2 dòng
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {data.employee_position}
        </div>

        {/* 2. HỌ TÊN (Đậm, To, xuống dòng nếu quá dài) */}
        <div
          style={{
            marginTop: '1mm',
            fontSize: '13px',
            fontWeight: 700,
            color: '#000',
            lineHeight: '1.2',
            wordBreak: 'break-word', // Xuống hàng khi gặp từ dài
            overflowWrap: 'anywhere',
            width: '100%',
            maxWidth: '48mm'
          }}
        >
          {data.employee_name}
        </div>

        {/* 3. MÃ NHÂN VIÊN */}
        <div
          style={{
            marginTop: '1.0mm',
            fontSize: '11.5px',
            fontWeight: 600,
            letterSpacing: '1px'
          }}
        >
          {data.employee_id}
        </div>

        {/* 4. BỘ PHẬN (Màu xám nhẹ để phân cấp thông tin) */}
        <div
          style={{
            marginTop: '1.0mm',
            fontSize: '10px',
            fontWeight: 500,
            color: '#262626',
            textTransform: 'uppercase',
            letterSpacing: '0.3px'
          }}
        >
          {data.employee_department}
        </div>
      </div>
    </div>
  );
};

export default VerticalCard;
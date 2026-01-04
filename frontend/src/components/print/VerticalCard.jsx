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
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#000000', // Worker thẻ dọc luôn chữ đen
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
          borderRadius: '8px',
          border: '0.5px solid rgba(0,0,0,0.2)', // Viền đen nhạt
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

        {showStamp && (
          <div
            style={{
              position: 'absolute',
              bottom: '-2mm',
              right: '-3mm',
              zIndex: 10,
              transform: 'scale(0.85) rotate(-5deg)'
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
          padding: '2mm 4mm 0'
        }}
      >
        {/* 1. CHỨC VỤ */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: 400,
            lineHeight: '1.2',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            minHeight: '22px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {data.employee_position}
        </div>

        {/* 2. HỌ TÊN */}
        <div
          style={{
            marginTop: '1mm',
            fontSize: '13px',
            fontWeight: 700,
            lineHeight: '1.2',
            wordBreak: 'break-word',
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

        {/* 4. BỘ PHẬN */}
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
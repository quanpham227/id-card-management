import React from 'react';
import { NoImagePlaceholder, CardStamp } from './IdCardHelpers';

const HorizontalCard = ({
  data,
  employeeImg,
  bgImage,
  imageError,
  setImageError,
  showStamp,
  pregnancyInfo // Object chứa line1, line2 và isPregnancy từ IdCard.jsx
}) => {
  // Xác định xem đây có phải thẻ đặc biệt (Bầu hoặc Con nhỏ) không
  const isSpecialCard = !!pregnancyInfo;
  
  // Thẻ đặc biệt dùng màu Đen, thẻ thường dùng màu Trắng
  const textColor = isSpecialCard ? '#000000' : '#ffffff';

  return (
    <div
      style={{
        width: '85.6mm',
        height: '54mm',
        backgroundImage: bgImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        display: 'flex',
        fontFamily: "'Roboto', Arial, sans-serif",
        color: textColor,
        boxSizing: 'border-box'
      }}
    >
      {/* ===== CỘT ẢNH (BÊN TRÁI) ===== */}
      {/* ===== CỘT ẢNH (BÊN TRÁI) ===== */}
    <div style={{ width: '30mm', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '4mm' }}>
      <div style={{
          width: '23mm',
          height: '30mm',
          position: 'relative',
          // CẬP NHẬT: Bo góc cho khung bên ngoài
          borderRadius: '8px', 
          border: `1px solid ${isSpecialCard ? '#000000' : 'rgba(255,255,255,0.6)'}`,
          background: isSpecialCard ? 'transparent' : 'rgba(255,255,255,0.1)',
          // QUAN TRỌNG: Cắt phần thừa của ảnh để bo theo khung
          overflow: 'hidden' 
      }}>
    {!imageError ? (
      <img 
        src={employeeImg} 
        alt="Avatar" 
        onError={() => setImageError(true)} 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover', 
          // Đảm bảo ảnh cũng có borderRadius tương ứng
          borderRadius: '8px', 
          display: 'block' 
        }} 
      />
    ) : (
      <NoImagePlaceholder isDarkBg={!isSpecialCard} />
    )}

    {/* CON DẤU - Giữ nguyên vị trí tuyệt đối */}
    {showStamp && (
      <div style={{ position: 'absolute', bottom: '-3mm', right: '-3mm', zIndex: 999 }}>
        <CardStamp />
      </div>
    )}
  </div>
</div>

      {/* ===== CỘT THÔNG TIN (CĂN GIỮA) ===== */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          paddingRight: '4mm',
          // Đẩy toàn bộ cụm chữ lên cao một chút nếu là thẻ đặc biệt
          marginTop: isSpecialCard ? '-4mm' : '0' 
        }}
      >
        {/* 1. DÒNG THÔNG TIN THAI SẢN / CON NHỎ (CHỮ ĐỎ, MẢNH) */}
        {pregnancyInfo && (
          <div
            style={{
              fontSize: '8.5px',
              fontWeight: 400, // Font Roboto mảnh
              color: '#ff0000', // Luôn giữ màu đỏ nổi bật cho thông tin này
              marginBottom: '1.5mm',
              lineHeight: '1.2',
            }}
          >
            <div>{pregnancyInfo.line1}</div>
            <div>{pregnancyInfo.line2}</div>
          </div>
        )}

        {/* 2. CHỨC VỤ (MÀU ĐEN - TỰ ĐỘNG XUỐNG DÒNG) */}
        <div
          style={{
            fontSize: '9px',
            fontWeight: 750,
            textTransform: 'uppercase',
            width: '85%', // Giới hạn chiều rộng để ép xuống dòng
            lineHeight: '1.2',
            marginBottom: '2mm'
          }}
        >
          {data.employee_position}
        </div>

        {/* 3. HỌ TÊN (MÀU ĐEN) */}
        <div
          style={{
            fontSize: '15px',
            fontWeight: 800,
            marginBottom: '1.5mm',
            whiteSpace: 'nowrap'
          }}
        >
          {data.employee_name}
        </div>

        {/* 4. MÃ NHÂN VIÊN (MÀU ĐEN) */}
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}
        >
          {data.employee_id}
        </div>

        {/* 5. BỘ PHẬN (MÀU ĐEN) */}
        <div
          style={{
            marginTop: '1.5mm',
            fontSize: '9.5px',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}
        >
          {data.employee_department}
        </div>
      </div>
    </div>
  );
};

export default HorizontalCard;
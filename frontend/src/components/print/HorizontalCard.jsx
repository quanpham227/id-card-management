import React from 'react';
import { NoImagePlaceholder, CardStamp } from './IdCardHelpers';

const HorizontalCard = ({
  data,
  employeeImg,
  bgImage,
  imageError,
  setImageError,
  showStamp,
  pregnancyInfo // Object chứa line1, line2
}) => {
  // --- XÁC ĐỊNH MÀU CHỮ ---
  const isMaternityCard = !!pregnancyInfo; 
  const textColor = isMaternityCard ? '#000000' : '#ffffff';

  // --- XÁC ĐỊNH VIỀN ẢNH VÀ NỀN ẢNH ---
  const borderColor = isMaternityCard ? '#000000' : 'rgba(255,255,255,0.6)';
  const photoBg = isMaternityCard ? 'transparent' : 'rgba(255,255,255,0.1)';

  return (
    <div
      style={{
        width: '85.6mm',
        height: '54mm',
        backgroundImage: bgImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative', // Quan trọng để định vị các thành phần con (absolute)
        display: 'flex',
        fontFamily: "'Roboto', Arial, sans-serif",
        color: textColor,
        boxSizing: 'border-box'
      }}
    >
      {/* ===== [MỚI] THÔNG TIN THAI SẢN (GÓC PHẢI TRÊN) ===== 
          Sử dụng position absolute để đưa về góc phải, đè lên nền
      */}
      {pregnancyInfo && (
        <div
          style={{
            position: 'absolute',
            top: '3mm',     // Cách mép trên 3mm (bạn có thể chỉnh số này)
            right: '3mm',   // Cách mép phải 3mm (bạn có thể chỉnh số này)
            zIndex: 10,     // Đảm bảo nổi lên trên
            
            // --- Hiệu ứng nền mờ ---
            backgroundColor: 'rgba(255, 255, 255, 0.6)', // Màu trắng độ trong suốt 60%
            backdropFilter: 'blur(2px)', // Làm mờ cảnh phía sau (nếu trình duyệt hỗ trợ)
            boxShadow: '0 0 4px rgba(0,0,0,0.1)', // Đổ bóng nhẹ cho rõ khối
            borderRadius: '4px',
            padding: '1mm 2mm', // Khoảng cách đệm bên trong khung
            
            // --- Style chữ ---
            textAlign: 'right',
            fontSize: '9px',
            color: '#ff0000', // Màu đỏ
            lineHeight: '1.4',
            whiteSpace: 'nowrap'
          }}
        >
          <div>{pregnancyInfo.line1}</div>
          <div>{pregnancyInfo.line2}</div>
        </div>
      )}

      {/* ===== CỘT ẢNH (BÊN TRÁI) ===== */}
      <div style={{ width: '30mm', display: 'flex', justifyContent: 'center', paddingLeft: '4mm' }}>
        {/* Khung ảnh: Giữ nguyên setting 26mm x 36mm và đẩy xuống 8mm của bạn */}
        <div style={{
            width: '26mm',
            height: '36mm',
            marginTop: '13mm', // Đẩy ảnh xuống dưới
            position: 'relative',
            borderRadius: '8px', 
            border: `1px solid ${borderColor}`,
            background: photoBg,
            overflow: 'hidden' 
        }}>
          {!imageError ? (
            <img 
              src={employeeImg} 
              alt="Avatar" 
              onError={() => setImageError(true)} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', display: 'block' }} 
            />
          ) : (
            <NoImagePlaceholder isDarkBg={!isMaternityCard} />
          )}

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
          marginTop: '0' // Không cần đẩy lên nữa vì thông tin thai sản đã chuyển ra chỗ khác
        }}
      >
        

        {/* 2. CHỨC VỤ */}
        <div
          style={{
            fontSize: '9px',
            fontWeight: 750,
            textTransform: 'uppercase',
            width: '85%',
            lineHeight: '1.2',
            marginBottom: '2mm',
          }}
        >
          {data.employee_position}
        </div>

        {/* 3. HỌ TÊN */}
        <div
          style={{
            fontSize: '15px',
            fontWeight: 800,
            marginBottom: '1.5mm',
            whiteSpace: 'nowrap',
          }}
        >
          {data.employee_name}
        </div>

        {/* 4. MÃ NHÂN VIÊN */}
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.5px',
          }}
        >
          {data.employee_id}
        </div>

        {/* 5. BỘ PHẬN */}
        <div
          style={{
            marginTop: '1.5mm',
            fontSize: '9.5px',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          {data.employee_department}
        </div>
      </div>
    </div>
  );
};

export default HorizontalCard;
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
  // Có thông tin thai sản => Luôn là màu ĐEN
  // Không có => Luôn là màu TRẮNG (cho Staff/Manager)
  const isMaternityCard = !!pregnancyInfo; 
  const textColor = isMaternityCard ? '#000000' : '#ffffff';

  // --- XÁC ĐỊNH VIỀN ẢNH ---
  // Thẻ bầu (nền trắng/sáng) => Viền đen
  // Thẻ thường (nền xanh đậm) => Viền trắng mờ
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
        position: 'relative',
        display: 'flex',
        fontFamily: "'Roboto', Arial, sans-serif",
        color: textColor, // Áp dụng màu chữ động
        boxSizing: 'border-box'
      }}
    >
      {/* ===== CỘT ẢNH (BÊN TRÁI) ===== */}
      <div style={{ width: '30mm', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '4mm' }}>
        <div style={{
            width: '23mm',
            height: '30mm',
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
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover', 
                borderRadius: '8px', 
                display: 'block' 
              }} 
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
          // Đẩy chữ lên một chút nếu có dòng ngày tháng thai sản
          marginTop: isMaternityCard ? '-4mm' : '0' 
        }}
      >
        {/* 1. DÒNG THÔNG TIN THAI SẢN (LUÔN ĐỎ) */}
        {pregnancyInfo && (
          <div
            style={{
              fontSize: '8.5px',
              fontWeight: 500, // Đậm hơn chút cho dễ đọc
              color: '#ff0000', // Đảm bảo màu đỏ theo yêu cầu
              marginBottom: '1.5mm',
              lineHeight: '1.2',
              whiteSpace: 'nowrap'
            }}
          >
            <div>{pregnancyInfo.line1}</div>
            <div>{pregnancyInfo.line2}</div>
          </div>
        )}

        {/* 2. CHỨC VỤ */}
        <div
          style={{
            fontSize: '9px',
            fontWeight: 750,
            textTransform: 'uppercase',
            width: '85%',
            lineHeight: '1.2',
            marginBottom: '2mm',
            // Kế thừa màu từ cha (textColor)
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
            // Kế thừa màu từ cha
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
            // Kế thừa màu từ cha
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
            // Kế thừa màu từ cha
          }}
        >
          {data.employee_department}
        </div>
      </div>
    </div>
  );
};

export default HorizontalCard;
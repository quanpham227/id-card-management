import React from 'react';

const BatchCard = ({ template, serialNumber, orientation = 'portrait' }) => {
  // Kích thước chuẩn thẻ nhựa CR80
  const CR80_LONG = '85.6mm';
  const CR80_SHORT = '54mm';

  // Xác định kích thước khung dựa trên hướng
  const width = orientation === 'portrait' ? CR80_SHORT : CR80_LONG;
  const height = orientation === 'portrait' ? CR80_LONG : CR80_SHORT;

  // LOGIC CHỌN ẢNH NỀN:
  // 1. Nếu là mặt sau: Lấy từ object template.bg[orientation] (cần chuẩn bị 2 file v và h)
  // 2. Nếu là thẻ ID: Lấy bgImage mặc định
  const finalBgImage = template.isBackSide 
  ? (template.bg ? template.bg[orientation] : template.bgImage)
  : template.bgImage;

  return (
    <div
      className="card-item"
      style={{
        width: width,
        height: height,
        backgroundImage: `url("${finalBgImage}")`,
        backgroundSize: '100% 100%', // Đảm bảo ảnh nền khít khung 
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
        backgroundColor: '#fff',
        // Viền chỉ hiển thị trên màn hình, khi in sẽ bị ẩn bởi CSS @media print
        border: '1px solid #eee' 
      }}
    >
      {/* HIỂN THỊ SỐ THẺ (Chỉ dành cho các thẻ không phải mặt sau) */}
     {!template.isBackSide && (
        <div style={{
          position: 'absolute',
          width: '100%',
          textAlign: 'center',
          fontSize: '18px', 
          fontWeight: '400', // Chữ mảnh
          color: template.textColor,
          // Ưu tiên lấy bottom từ cấu hình template, nếu không có mới lấy mặc định
          bottom: template.numberPosition?.bottom || '25mm',
          left: 0,
          fontFamily: 'Arial, sans-serif'
        }}>
          {serialNumber}
      </div>
    )}
    </div>
  );
};

export default BatchCard;
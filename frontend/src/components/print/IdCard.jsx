import React, { useState } from 'react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat'; 
dayjs.extend(customParseFormat);

import VerticalCard from './VerticalCard';
import HorizontalCard from './HorizontalCard';

const IdCard = ({ data, bgOption = 1, showStamp = false }) => {
  const [imageError, setImageError] = useState(false);
  
  if (!data) return null;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const employeeImg = `${API_URL}/images/${data.employee_id}.png`;
  
  const maternityType = data.maternity_type || ''; 
  const isMaternity = maternityType === 'Pregnancy Register' || maternityType === 'Has Baby';

  // Hướng thẻ: Chỉ Worker (không bầu/con nhỏ) mới dùng khổ Dọc. Còn lại dùng khổ Ngang.
  const isPortrait = data.employee_type === 'Worker' && !isMaternity;

  // --- HÀM HELPER XỬ LÝ NGÀY THÁNG ---
  const formatDateSafe = (dateStr) => {
    if (!dateStr || dateStr === "00/00/0000" || dateStr === "") return null;
    const d = dayjs(dateStr, ["YYYY-MM-DD", "DD/MM/YYYY", "YYYY/MM/DD"]);
    return d.isValid() ? d : null;
  };

  // --- LOGIC TÍNH TOÁN THÔNG TIN THAI SẢN / CON NHỎ ---
  let maternityDisplay = null;

  if (maternityType === 'Pregnancy Register') {
    // THẺ BẦU: Dòng 2 cộng thêm 1 ngày
    const dateBegin = formatDateSafe(data.maternity_begin);
    const dateEnd = formatDateSafe(data.maternity_end);

    maternityDisplay = {
      line1: dateBegin ? `Ngày TB bầu: ${dateBegin.format('DD/MM/YYYY')}` : "Ngày TB bầu: ---",
      line2: dateEnd ? `Bầu 7 tháng từ: ${dateEnd.add(1, 'day').format('DD/MM/YYYY')}` : "Bầu 7 tháng từ: ---",
      isPregnancy: true
    };
  } else if (maternityType === 'Has Baby') {
    // THẺ CON NHỎ: Lấy trực tiếp, không cộng ngày
    const dateBegin = formatDateSafe(data.maternity_begin);
    const dateEnd = formatDateSafe(data.maternity_end);

    maternityDisplay = {
      line1: dateBegin ? `Từ ngày: ${dateBegin.format('DD/MM/YYYY')}` : "Từ ngày: ---",
      line2: dateEnd ? `Đến ngày: ${dateEnd.format('DD/MM/YYYY')}` : "Đến ngày: ---",
      isPregnancy: false
    };
  }

  // --- CHỌN HÌNH NỀN ---
  let bgUrl = '';
  if (maternityType === 'Pregnancy Register') {
    bgUrl = '/assets/bau-ngang.png';
  } else if (maternityType === 'Has Baby') {
    bgUrl = '/assets/baby-ngang.png';
  } else {
    bgUrl = isPortrait 
      ? '/assets/card-bg-vertical.png' 
      : (bgOption === 1 ? '/assets/card-bg-horizontal.png' : '/assets/card-bg-horizontal-2.png');
  }

  const bgImage = `url("${bgUrl}")`;
  const width = isPortrait ? '54mm' : '85.6mm';
  const height = isPortrait ? '85.6mm' : '54mm';

  const commonProps = {
    data,
    employeeImg,
    bgImage,
    imageError,
    setImageError,
    showStamp,
    pregnancyInfo: maternityDisplay // Truyền object thông tin thai sản xuống
  };

  return (
    <div className="print-container">
      {isPortrait ? (
        <VerticalCard {...commonProps} />
      ) : (
        <HorizontalCard {...commonProps} />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
        @media print {
          @page { size: ${width} ${height}; margin: 0 !important; }
          body { 
            margin: 0 !important; 
            padding: 0 !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible !important; }
          .print-container { 
            position: absolute !important; 
            top: 0 !important; 
            left: 0 !important; 
            width: ${width} !important; 
            height: ${height} !important; 
          }
        }
      `}</style>
    </div>
  );
};

export default IdCard;
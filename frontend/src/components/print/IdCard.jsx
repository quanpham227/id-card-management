import React, { useState } from 'react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

import VerticalCard from './VerticalCard';
import HorizontalCard from './HorizontalCard';

const IdCard = ({ data, bgOption = 1, showStamp = false }) => {
  const [imageError, setImageError] = useState(false);

  if (!data) return null;

  // --- [CẬP NHẬT LOGIC ẢNH MỚI - CHUẨN HÓA] ---

  // 1. Lấy tên file
  const imageName = data.image || data.image_path || `${data.employee_id}.png`;

  let employeeImg = '';

  if (imageName.startsWith('http')) {
    // Nếu là link online
    employeeImg = imageName;
  } else {
    // 2. Logic Dynamic URL (Giống SearchPage & TicketAttachments)
    let apiUrl = import.meta.env.VITE_API_URL;

    // Nếu không có biến môi trường -> Fallback về localhost
    if (!apiUrl) {
      apiUrl = 'http://localhost:8000';
    }

    // Bỏ đuôi /api nếu có để lấy root
    const SERVER_ROOT = apiUrl.replace(/\/api$/, '');

    // 3. Làm sạch đường dẫn ảnh (QUAN TRỌNG: Fix lỗi Windows path)
    // Thay thế dấu gạch ngược "\" thành "/"
    let cleanName = imageName.replace(/\\/g, '/');

    // Xóa dấu "/" ở đầu để tránh bị trùng
    if (cleanName.startsWith('/')) {
      cleanName = cleanName.substring(1);
    }

    // 4. Ghép URL
    // - Local: http://localhost:8000/images/NV01.png
    // - Docker: /images/NV01.png
    employeeImg = `${SERVER_ROOT}/images/${cleanName}`;
  }
  // ----------------------------------

  const maternityType = data.maternity_type || '';
  const MATERNITY_TYPES = ['Pregnancy (>7 months)', 'Has Baby', 'Pregnancy Register'];
  const isMaternity = MATERNITY_TYPES.includes(maternityType);
  const PORTRAIT_ROLES = ['Worker', 'Training'];
  const isPortrait = PORTRAIT_ROLES.includes(data.employee_type) && !isMaternity;

  // --- HÀM HELPER XỬ LÝ NGÀY THÁNG ---
  const formatDateSafe = (dateStr) => {
    if (!dateStr || dateStr === '00/00/0000' || dateStr === '') return null;
    const d = dayjs(dateStr, ['YYYY-MM-DD', 'DD/MM/YYYY', 'YYYY/MM/DD']);
    return d.isValid() ? d : null;
  };

  // --- XỬ LÝ HIỂN THỊ THAI SẢN ---
  let maternityDisplay = null;
  if (isMaternity) {
    const dateBegin = formatDateSafe(data.maternity_begin);
    const dateEnd = formatDateSafe(data.maternity_end);

    if (maternityType === 'Has Baby') {
      maternityDisplay = {
        line1: dateBegin ? `Từ ngày: ${dateBegin.format('DD/MM/YYYY')}` : 'Từ ngày: ---',
        line2: dateEnd ? `Đến ngày: ${dateEnd.format('DD/MM/YYYY')}` : 'Đến ngày: ---',
      };
    } else {
      maternityDisplay = {
        line1: dateBegin
          ? `Ngày thông báo mang thai: ${dateBegin.format('DD/MM/YYYY')}`
          : 'Ngày TB bầu: ---',
        line2: dateEnd
          ? `Ngày thai từ 7 tháng: ${dateEnd.add(1, 'day').format('DD/MM/YYYY')}`
          : 'Bầu 7 tháng từ: ---',
      };
    }
  }

  // --- CHỌN HÌNH NỀN ---
  let bgUrl = '';
  if (maternityType === 'Has Baby') {
    bgUrl = '/assets/baby-ngang.png';
  } else if (isMaternity) {
    bgUrl = '/assets/bau-ngang.png';
  } else {
    bgUrl = isPortrait
      ? '/assets/card-bg-vertical.png'
      : bgOption === 1
        ? '/assets/card-bg-horizontal.png'
        : '/assets/card-bg-horizontal-2.png';
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
    pregnancyInfo: maternityDisplay,
  };

  return (
    <div className="print-container">
      {isPortrait ? <VerticalCard {...commonProps} /> : <HorizontalCard {...commonProps} />}

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

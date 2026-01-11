import React, { useState } from 'react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

import VerticalCard from './VerticalCard';
import HorizontalCard from './HorizontalCard';

const IdCard = ({ data, bgOption = 1, showStamp = false }) => {
  const [imageError, setImageError] = useState(false);

  if (!data) return null;

  const API_URL = import.meta.env.VITE_API_URL || '';
  const employeeImg = API_URL
    ? `${API_URL}/images/${data.employee_id}.png`
    : `/images/${data.employee_id}.png`;

  const maternityType = data.maternity_type || '';

  // 1. ĐỊNH NGHĨA CÁC LOẠI THAI SẢN
  const MATERNITY_TYPES = ['Pregnancy (>7 months)', 'Has Baby', 'Pregnancy Register'];

  // Kiểm tra xem nhân viên có thuộc diện thai sản không
  const isMaternity = MATERNITY_TYPES.includes(maternityType);

  // 2. XÁC ĐỊNH HƯỚNG THẺ (CẬP NHẬT TẠI ĐÂY)
  // Danh sách các chức vụ dùng thẻ DỌC
  const PORTRAIT_ROLES = ['Worker', 'Training'];

  // Logic:
  // - Nếu chức vụ nằm trong danh sách ['Worker', 'Training']
  // - VÀ Không thuộc diện thai sản (Thai sản luôn ưu tiên thẻ Ngang)
  const isPortrait = PORTRAIT_ROLES.includes(data.employee_type) && !isMaternity;

  // --- HÀM HELPER XỬ LÝ NGÀY THÁNG ---
  const formatDateSafe = (dateStr) => {
    if (!dateStr || dateStr === '00/00/0000' || dateStr === '') return null;
    const d = dayjs(dateStr, ['YYYY-MM-DD', 'DD/MM/YYYY', 'YYYY/MM/DD']);
    return d.isValid() ? d : null;
  };

  // --- 3. XỬ LÝ DỮ LIỆU HIỂN THỊ THAI SẢN ---
  let maternityDisplay = null;

  if (isMaternity) {
    const dateBegin = formatDateSafe(data.maternity_begin);
    const dateEnd = formatDateSafe(data.maternity_end);

    if (maternityType === 'Has Baby') {
      // Con nhỏ: Giữ nguyên ngày
      maternityDisplay = {
        line1: dateBegin ? `Từ ngày: ${dateBegin.format('DD/MM/YYYY')}` : 'Từ ngày: ---',
        line2: dateEnd ? `Đến ngày: ${dateEnd.format('DD/MM/YYYY')}` : 'Đến ngày: ---',
      };
    } else {
      // Bầu: Cộng 1 ngày vào ngày kết thúc
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

  // --- 4. CHỌN HÌNH NỀN ---
  let bgUrl = '';
  if (maternityType === 'Has Baby') {
    bgUrl = '/assets/baby-ngang.png';
  } else if (isMaternity) {
    // Các loại bầu còn lại
    bgUrl = '/assets/bau-ngang.png';
  } else {
    // Thẻ thường
    bgUrl = isPortrait
      ? '/assets/card-bg-vertical.png' // Nền dọc cho Worker/Training
      : bgOption === 1
        ? '/assets/card-bg-horizontal.png'
        : '/assets/card-bg-horizontal-2.png'; // Nền ngang cho Staff/Manager
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
    pregnancyInfo: maternityDisplay, // Truyền thông tin thai sản (nếu có)
  };

  return (
    <div className="print-container">
      {isPortrait ? (
        // Render thẻ dọc (Worker, Training)
        <VerticalCard {...commonProps} />
      ) : (
        // Render thẻ ngang (Staff, Manager, Thai sản)
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

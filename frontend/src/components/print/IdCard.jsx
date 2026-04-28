import React, { useState } from 'react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

import VerticalCard from './VerticalCard';
import HorizontalCard from './HorizontalCard';

// 🔥 Thêm prop "fixPageSize": Mặc định là true (In lẻ). Khi in hàng loạt thì truyền false.
const IdCard = ({ data, bgOption = 1, showStamp = false, fixPageSize = true }) => {
  const [imageError, setImageError] = useState(false);

  if (!data) return null;

  // --- LOGIC ẢNH (GIỮ NGUYÊN) ---
  const imageName = data.image || data.image_path || `${data.employee_id}.png`;
  let employeeImg = '';

  if (imageName.startsWith('http')) {
    employeeImg = imageName;
  } else {
    let apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) apiUrl = 'http://localhost:8000';
    const SERVER_ROOT = apiUrl.replace(/\/api$/, '');
    let cleanName = imageName.replace(/\\/g, '/');
    if (cleanName.startsWith('/')) cleanName = cleanName.substring(1);
    employeeImg = `${SERVER_ROOT}/images/${cleanName}`;
  }

  const maternityType = data.maternity_type || '';
  const MATERNITY_TYPES = ['Pregnancy (>7 months)', 'Has Baby', 'Pregnancy Register'];
  const isMaternity = MATERNITY_TYPES.includes(maternityType);
  const PORTRAIT_ROLES = ['Worker', 'Training'];
  const isPortrait = PORTRAIT_ROLES.includes(data.employee_type) && !isMaternity;

  // KIỂM TRA BỘ PHẬN PACKING
  const currentDept = data.employee_department ? data.employee_department.toUpperCase().trim() : '';
  const PACKING_DEPTS = ['PACKING 1', 'KHO'];
  const isPackingDept = PACKING_DEPTS.includes(currentDept);

  // --- HÀM HELPER NGÀY THÁNG ---
  const formatDateSafe = (dateStr) => {
    if (!dateStr || dateStr === '00/00/0000' || dateStr === '') return null;
    const d = dayjs(dateStr, ['YYYY-MM-DD', 'DD/MM/YYYY', 'YYYY/MM/DD']);
    return d.isValid() ? d : null;
  };

  // --- THAI SẢN ---
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
  if (maternityType === 'Has Baby') bgUrl = '/assets/baby-ngang.png';
  else if (isMaternity) bgUrl = '/assets/bau-ngang.png';
  else {
    if (isPortrait) {
      if (isPackingDept) bgUrl = '/assets/card-bg-vertical_2.png';
      else bgUrl = '/assets/card-bg-vertical.png';
    } else {
      bgUrl =
        bgOption === 1 ? '/assets/card-bg-horizontal.png' : '/assets/card-bg-horizontal-2.png';
    }
  }

  const bgImage = `url("${bgUrl}")`;
  const width = isPortrait ? '55mm' : '87mm';
  const height = isPortrait ? '87mm' : '55mm';

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
          /* 🔥 [SỬA LỖI TẠI ĐÂY] Chỉ set khổ giấy nếu fixPageSize = true */
          ${fixPageSize ? `@page { size: ${width} ${height}; margin: 0 !important; }` : ''}
          
          body { 
            margin: 0 !important; 
            padding: 0 !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible !important; }
          
          .print-container { 
            /* 🔥 [SỬA LỖI] Chỉ absolute khi in lẻ, in hàng loạt thì để cha quản lý */
            position: ${fixPageSize ? 'absolute !important' : 'relative !important'}; 
            border: 1px solid #000 !important;
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
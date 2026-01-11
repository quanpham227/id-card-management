// src/components/Print/IdCardHelpers.jsx
import React from 'react';

/**
 * Component hiển thị khung giữ chỗ khi ảnh bị lỗi hoặc không có ảnh
 */
export const NoImagePlaceholder = ({ isDarkBg }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: isDarkBg ? 'rgba(255,255,255,0.15)' : '#f5f5f5',
      color: isDarkBg ? 'rgba(255,255,255,0.7)' : '#bbb',
      fontWeight: '600',
      fontSize: '10px',
      fontFamily: '"Roboto", sans-serif',
      border: isDarkBg ? '1px dashed rgba(255,255,255,0.3)' : '1px dashed #ddd',
      flexDirection: 'column',
      letterSpacing: '0.5px',
    }}
  >
    <span>NO PHOTO</span>
  </div>
);
// [NEW] Component Con dấu dùng chung
export const CardStamp = () => (
  <img
    src="/assets/stamp.png"
    alt="Stamp"
    style={{
      position: 'absolute',
      right: '1mm',
      bottom: '1mm',
      width: '12mm',
      opacity: 0.8,
      transform: 'rotate(-15deg)',
      pointerEvents: 'none',
      zIndex: 20,
    }}
  />
);

import React from 'react';
import { Image, Typography } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';

const { Text } = Typography;

// --- HÀM TIỆN ÍCH (HELPER) ---
// Trong dự án thực tế, các hàm này thường để trong file utils/fileUtils.js

// 1. Hàm chuẩn hóa dữ liệu từ DB thành Mảng
const parseAttachments = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return [];
      }
    }
    return trimmed.split(',').filter((item) => item.trim() !== '');
  }
  return [];
};
// 2. Hàm tạo URL chuẩn
const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path; // Ảnh online

  // Lấy API URL từ env, mặc định localhost:8000
  let baseUrl = import.meta.env.VITE_API_URL;

  // [Real World Logic]: Luôn đảm bảo baseUrl không có dấu / ở cuối
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
  // Nếu baseUrl là /api (tương đối), cắt bỏ /api để lấy root
  baseUrl = baseUrl.replace(/\/api$/, '');
  // Nếu rỗng (trường hợp relative path), fallback về localhost để dev dễ
  if (!baseUrl) baseUrl = 'http://localhost:8000';

  // Chuẩn hóa path ảnh (Bỏ dấu \ của Windows, bỏ dấu / ở đầu)
  let cleanPath = path.replace(/\\/g, '/');
  if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);

  return `${baseUrl}/${cleanPath}`;
};

// --- COMPONENT CHÍNH ---
const TicketAttachments = ({ attachments }) => {
  // 1. Chuẩn hóa dữ liệu đầu vào
  const fileList = parseAttachments(attachments);

  // 2. Nếu không có file -> ẩn luôn
  if (fileList.length === 0) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <Text strong>
        <PaperClipOutlined /> Attachments ({fileList.length}):
      </Text>
      <div style={{ marginTop: 10 }}>
        <Image.PreviewGroup>
          {fileList.map((path, index) => {
            const fullSrc = getFullImageUrl(path);

            return (
              <Image
                key={index}
                width={100}
                height={100}
                src={fullSrc}
                style={{
                  objectFit: 'cover',
                  borderRadius: 8,
                  marginRight: 8,
                  border: '1px solid #d9d9d9',
                  cursor: 'pointer',
                  backgroundColor: '#f5f5f5', // Màu nền nhẹ để biết ảnh đang load
                }}
                // Placeholder chuẩn Antd
                placeholder={
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#eee',
                    }}
                  >
                    Wait...
                  </div>
                }
              />
            );
          })}
        </Image.PreviewGroup>
      </div>
    </div>
  );
};

export default TicketAttachments;

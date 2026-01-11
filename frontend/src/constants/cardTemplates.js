export const CARD_TEMPLATES = [
  {
    id: 'contractor',
    name: 'Thẻ Nhà Thầu (Contractor)',
    bgImage: '/assets/cards/contractor-bg.png',
    textColor: '#333333',
    // Hạ xuống một chút xíu so với trước
    numberPosition: { bottom: '30mm' },
  },
  {
    id: 'visitor',
    name: 'Thẻ Khách (Visitor)',
    bgImage: '/assets/cards/visitor-bg.png',
    textColor: '#333333',
    // Hạ xuống nhiều để tránh đè nội dung phía trên
    numberPosition: { bottom: '15mm' },
  },
  {
    id: 'candidate',
    name: 'Thẻ Ứng Viên (Candidate)',
    bgImage: '/assets/cards/candidate-bg.png',
    textColor: '#333333',
    // Hạ xuống nhiều tương tự thẻ khách
    numberPosition: { bottom: '20mm' },
  },
  {
    id: 'restricted',
    name: 'Khu Vực Giới Hạn (Restricted)',
    bgImage: '/assets/cards/restricted-bg.png',
    textColor: '#333333',
    // Giữ nguyên vị trí cũ
    numberPosition: { bottom: '25mm' },
  },
  {
    id: 'backside',
    name: 'Mặt Sau Thẻ (Quy định)',
    isBackSide: true,
    // Mặt sau có 2 ảnh riêng cho 2 hướng
    bg: {
      portrait: '/assets/cards/backside-v.png',
      landscape: '/assets/cards/backside-h.png',
    },
  },
];

import React from 'react';
import { Result, Button } from 'antd';
import { SmileOutlined } from '@ant-design/icons';

const TicketPage = () => {
  return (
    <div style={{ padding: 24, background: '#fff', minHeight: '100%' }}>
        {/* Đây là giao diện tạm thời */}
        <Result
            icon={<SmileOutlined />}
            title="Ticket System Coming Soon!"
            subTitle="Chức năng đang được phát triển. Tại đây bạn sẽ quản lý các yêu cầu hỗ trợ."
            extra={<Button type="primary">Hello World</Button>}
        />
    </div>
  );
};

export default TicketPage;
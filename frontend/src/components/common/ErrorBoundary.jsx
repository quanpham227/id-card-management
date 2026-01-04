import React from 'react';
import { Button, Result } from 'antd';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Cập nhật state để lần render sau hiển thị UI thay thế
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Bạn có thể log lỗi vào một dịch vụ như Sentry ở đây
    console.error("React Crash:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Result
            status="500"
            title="Đã có lỗi xảy ra!"
            subTitle="Rất tiếc, ứng dụng gặp sự cố bất ngờ."
            extra={[
              <Button type="primary" key="console" onClick={this.handleReload}>
                Tải lại trang
              </Button>,
              <Button key="home" onClick={() => window.location.href = '/'}>
                Về trang chủ
              </Button>
            ]}
          >
             {/* Chỉ hiện chi tiết lỗi ở môi trường Dev */}
             {import.meta.env.MODE === 'development' && (
               <div style={{ color: 'red', marginTop: 20, maxWidth: 600, textAlign: 'left', background: '#eee', padding: 10 }}>
                 {this.state.error?.toString()}
               </div>
             )}
          </Result>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './assets/styles/global.scss';

// 1. Import ErrorBoundary (Đảm bảo đúng đường dẫn file bạn vừa tạo)
import ErrorBoundary from './components/common/ErrorBoundary.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. Bọc ErrorBoundary xung quanh App */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

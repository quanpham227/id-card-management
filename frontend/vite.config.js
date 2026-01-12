import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // 1. Cấu hình cho môi trường DEV (npm run dev)
  server: {
    port: 5173, // Cổng chạy frontend dev
    proxy: {
      // Khi React gọi: /api/login -> Vite chuyển thành: http://127.0.0.1:8000/api/login
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      // Khi React gọi: /images/abc.png -> Vite chuyển thành: http://127.0.0.1:8000/images/abc.png
      '/images': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // 2. Cấu hình cho môi trường PRODUCTION (npm run build)
  build: {
    chunkSizeWarningLimit: 1600, // Tăng lên chút nữa cho thoải mái
    outDir: 'dist', // Thư mục xuất ra (mặc định là dist)
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd', '@ant-design/icons'],
          charts: ['recharts'],
        },
      },
    },
  },
});

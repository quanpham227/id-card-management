import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // --- PHẦN CẬP NHẬT: Cấu hình cho npm run dev ---
  server: {
    port: 5173,
    proxy: {
      // Khi code gọi đến /api, Vite sẽ chuyển hướng sang Docker Backend (8000)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // Không dùng rewrite nếu Backend của bạn đã có sẵn prefix /api
      },
      // Nếu bạn muốn hiển thị ảnh trực tiếp từ Backend khi dev
      '/images': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },

  build: {
    // Tăng giới hạn cảnh báo chunk
    chunkSizeWarningLimit: 1000,
    
    // Cấu hình build an toàn cho Antd v5 + React 18
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    
    rollupOptions: {
      output: {
        manualChunks: {
            // Tách các thư viện lớn ra để load nhanh hơn
            vendor: ['react', 'react-dom', 'react-router-dom'],
            antd: ['antd', '@ant-design/icons'],
            charts: ['recharts']
        }
      },
    },
  },
})
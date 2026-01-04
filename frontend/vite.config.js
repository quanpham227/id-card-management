import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
            antd: ['antd'],
            charts: ['recharts']
        }
      },
    },
  },
})
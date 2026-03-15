import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 龙虾助手 Vite 配置
export default defineConfig({
  plugins: [react()],
  base: './',   // Electron file:// 协议必须用相对路径
  server: {
    port: 5173,
    // 开发时代理 API 请求到后端服务
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})

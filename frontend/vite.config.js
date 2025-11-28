import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 配置路由重写，支持客户端路由
    historyApiFallback: true
  }
})

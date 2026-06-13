import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './', // ✅ สำคัญมากสำหรับ Electron
  plugins: [react()],
  clearScreen: false,
  server: {
    fs: {
      strict: false
    }
  },
  optimizeDeps: {
    force: true,
    include: ['react', 'react-dom']
  },
  build: {
    outDir: 'dist',     // ✅ ให้แน่ใจว่า build ไปไว้ที่โฟลเดอร์ที่ Electron ใช้
    sourcemap: false
  },
});

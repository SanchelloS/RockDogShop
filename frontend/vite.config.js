import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // 💡 предотвращает дублирование React и ReactDOM
  resolve: {
    dedupe: ['react', 'react-dom'],
  },

  // 🔧 небольшая оптимизация для стабильности
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-hot-toast'],
  },

  server: {
    port: 5173, // можешь поменять, если хочешь
    open: true, // автоматически открывает браузер
  },
});

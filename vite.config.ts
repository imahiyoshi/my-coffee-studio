import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const rawKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '';
  const cleanKey = rawKey.replace(/['"]/g, '').trim();
  
  return {
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'lucide-react', 'date-fns'],
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(cleanKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});

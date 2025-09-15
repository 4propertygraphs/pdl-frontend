import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const isProduction = env.VITE_REACT_APP_PRODUCTION === 'true';
  const productionLocation = env.VITE_REACT_APP_FILE_LOCATION || '/datafeeds';

  return {
    base: isProduction ? productionLocation : '/',
    plugins: [react()],
    css: {
      postcss: './postcss.config.js',
    },
  };
});
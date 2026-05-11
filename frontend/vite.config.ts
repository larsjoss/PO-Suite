import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isEnterprise = process.env.VITE_TARGET === 'enterprise';

export default defineConfig({
  base: isEnterprise ? '/' : '/PO-Suite/',
  plugins: [react()],
});

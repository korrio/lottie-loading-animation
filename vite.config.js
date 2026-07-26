import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        courthaus: resolve(import.meta.dirname, 'courthaus/index.html'),
        fuze: resolve(import.meta.dirname, 'fuze/index.html'),
        sspy: resolve(import.meta.dirname, 'sspy/index.html'),
        balance: resolve(import.meta.dirname, 'balance/index.html'),
        bitkub: resolve(import.meta.dirname, 'bitkub/index.html'),
        pantip: resolve(import.meta.dirname, 'pantip/index.html'),
        nyspace: resolve(import.meta.dirname, 'nyspace/index.html'),
        fastcourt: resolve(import.meta.dirname, 'fastcourt/index.html'),
      },
    },
  },
});

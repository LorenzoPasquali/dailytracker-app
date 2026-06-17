import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  build: {
    rollupOptions: {
      output: {
        // Split big third-party libs into their own chunks so they cache
        // independently and parse in parallel instead of one giant bundle.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // Libs que NAO dependem de react sao seguras em chunks separados.
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) return 'recharts';
          if (id.includes('date-fns')) return 'datefns';
          if (id.includes('@dnd-kit')) return 'dndkit';
          if (id.includes('flag-icons')) return 'flag-icons';
          if (id.includes('i18next')) return 'i18n';
          if (id.includes('sockjs') || id.includes('stomp')) return 'ws';
          // Tudo que toca em React fica junto para evitar ciclos entre chunks:
          // Rollup move helpers compartilhados entre chunks e cria
          // dependencias circulares (react-vendor <-> bootstrap), o que faz
          // createContext/useLayoutEffect serem `undefined` em producao.
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router') ||
            id.includes('/node_modules/scheduler/') ||
            id.includes('/node_modules/react-is/') ||
            id.includes('/node_modules/prop-types/') ||
            id.includes('react-bootstrap') ||
            id.includes('@restart') ||
            id.includes('react-datepicker')
          ) return 'react-vendor';
          return undefined;
        },
      },
    },
  },
});

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
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) return 'recharts';
          if (id.includes('react-datepicker')) return 'datepicker';
          if (id.includes('date-fns')) return 'datefns';
          if (id.includes('@dnd-kit')) return 'dndkit';
          if (id.includes('flag-icons')) return 'flag-icons';
          if (id.includes('react-bootstrap') || id.includes('@restart')) return 'bootstrap';
          if (id.includes('i18next')) return 'i18n';
          if (id.includes('sockjs') || id.includes('stomp')) return 'ws';
          if (id.includes('/react-dom/') || id.includes('/react-router') || id.includes('/scheduler/')) return 'react-vendor';
          return undefined;
        },
      },
    },
  },
});

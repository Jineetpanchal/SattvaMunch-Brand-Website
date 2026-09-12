import fs from 'fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const port = Number(process.env.PORT ?? '3000') || 3000;
const basePath = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'resolve-uploaded-assets',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const rawUrl = req.url || '';
          const decodedUrl = decodeURIComponent(rawUrl.split('?')[0]);
          const match = decodedUrl.match(/(?:flavour|flavor)[ -_]?(\d+)/i);
          if (match) {
            const num = match[1];
            const possiblePaths = [
              path.resolve(import.meta.dirname, `public/assets/Flavour ${num}.jpg`),
              path.resolve(import.meta.dirname, `public/assets/flavour-${num}.jpg`),
              path.resolve(import.meta.dirname, `public/assets/flavor-${num}.jpg`),
              path.resolve(import.meta.dirname, `public/assets/Flavour-${num}.jpg`),
              path.resolve(import.meta.dirname, `../../attached_assets/Flavour ${num}.jpg`),
              path.resolve(import.meta.dirname, `../../attached_assets/flavour-${num}.jpg`),
              path.resolve(import.meta.dirname, `../../attached_assets/Flavour_${num}.jpg`),
              path.resolve(import.meta.dirname, `../../Flavour ${num}.jpg`),
              path.resolve(import.meta.dirname, `../../flavour-${num}.jpg`),
              path.resolve(import.meta.dirname, `public/Flavour ${num}.jpg`),
              path.resolve(import.meta.dirname, `public/flavour-${num}.jpg`),
            ];
            for (const file of possiblePaths) {
              if (fs.existsSync(file) && fs.statSync(file).isFile()) {
                res.setHeader('Content-Type', 'image/jpeg');
                fs.createReadStream(file).pipe(res);
                return;
              }
            }
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, '../../dist'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: false,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});

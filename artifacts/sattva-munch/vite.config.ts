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

          if (
            decodedUrl.includes('commercial.mp4') ||
            decodedUrl.includes('SattvaMunch-Commercial')
          ) {
            const possibleVideoPaths = [
              path.resolve(import.meta.dirname, 'public/assets/commercial.mp4'),
              path.resolve(import.meta.dirname, 'public/assets/SattvaMunch-Commercial (1).mp4'),
              path.resolve(import.meta.dirname, '../../attached_assets/SattvaMunch-Commercial (1).mp4'),
            ];
            for (const file of possibleVideoPaths) {
              if (fs.existsSync(file) && fs.statSync(file).isFile()) {
                const stat = fs.statSync(file);
                const fileSize = stat.size;
                const range = req.headers.range;

                if (range) {
                  const parts = range.replace(/bytes=/, '').split('-');
                  const start = parseInt(parts[0], 10);
                  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                  const chunksize = end - start + 1;
                  const fileStream = fs.createReadStream(file, { start, end });
                  res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'video/mp4',
                  });
                  fileStream.pipe(res);
                  return;
                } else {
                  res.writeHead(200, {
                    'Content-Length': fileSize,
                    'Content-Type': 'video/mp4',
                    'Accept-Ranges': 'bytes',
                  });
                  fs.createReadStream(file).pipe(res);
                  return;
                }
              }
            }
          }

          const match = decodedUrl.match(/(?:flavour|flavor)[ -_]?(\d+)|f-(\d+)/i);
          if (match) {
            const num = match[1] || match[2];
            const possiblePaths = [
              path.resolve(import.meta.dirname, `public/assets/F-${num}.png`),
              path.resolve(import.meta.dirname, `public/assets/f-${num}.png`),
              path.resolve(import.meta.dirname, `public/assets/Flavour ${num}.jpg`),
              path.resolve(import.meta.dirname, `public/assets/flavour-${num}.jpg`),
              path.resolve(import.meta.dirname, `public/assets/flavor-${num}.jpg`),
              path.resolve(import.meta.dirname, `public/assets/Flavour-${num}.jpg`),
              path.resolve(import.meta.dirname, `../../attached_assets/F-${num}.png`),
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
                res.setHeader('Content-Type', file.endsWith('.png') ? 'image/png' : 'image/jpeg');
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

import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'config': ['./src/config/index.js'],
          'data': ['./src/data/index.js'],
          'core': ['./src/core/index.js'],
          'effects': ['./src/effects/index.js'],
          'entities': ['./src/entities/index.js']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0'
  },
  preview: {
    port: 4173
  },
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '*.config.js'
      ]
    }
  }
});

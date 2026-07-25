import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    // CRA used .js for JSX. This plugin teaches esbuild (and Rollup) to treat
    // all .js files inside src/ as JSX so we don't need to rename everything.
    {
      name: 'treat-js-files-as-jsx',
      async transform(code, id) {
        if (!id.match(/src\/.*\.js$/)) return null;
        return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' });
      },
    },
    react(),
  ],

  // Must match gh-pages deploy repo path
  base: '/portfolio/',

  build: {
    outDir: 'build',
    emptyOutDir: true,
    sourcemap: false, // replaces GENERATE_SOURCEMAP=false from .env.development.local
  },

  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx', // pre-bundle step also needs to parse JSX in .js files
      },
    },
  },
});

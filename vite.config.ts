import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const nm = (pkg: string) => path.resolve(__dirname, `./node_modules/${pkg}`)

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // listen on all interfaces (0.0.0.0)
    port: 5176,
  },
  resolve: {
    alias: {
      '@':      path.resolve(__dirname, './src'),
      // Explicit paths needed because react-router v7 dev bundle
      // imports these as bare specifiers that Rollup can't resolve
      'cookie': nm('cookie/dist/index.js'),
    },
  },
  build: {
    outDir: 'dist-v15',
    emptyOutDir: false,
    chunkSizeWarningLimit: 1500,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      maxParallelFileOps: 5,
    },
  },
})

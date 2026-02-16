import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@/assets': resolve('src/renderer/src/assets'),
        '@/components': resolve('src/renderer/src/components'),
        '@/ui': resolve('src/renderer/src/components/ui'),
        '@/lib': resolve('src/renderer/src/lib'),
        '@/pages': resolve('src/renderer/src/pages'),
        '@/hooks': resolve('src/renderer/src/hooks'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})

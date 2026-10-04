import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { seoPlugin } from './config/seo.ts'

export default defineConfig({
  plugins: [react(), seoPlugin()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    clearMocks: true,
    restoreMocks: true,
  },
})

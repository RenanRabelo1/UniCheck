import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Os testes não dependem do client/.env de quem roda: quem precisa da API liga o modo no próprio teste.
  test: { env: { VITE_DATA_SOURCE: 'mock' } },
})

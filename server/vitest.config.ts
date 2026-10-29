import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Todos os testes usam o mesmo banco de teste: um arquivo por vez, para um não apagar os dados do outro.
    fileParallelism: false,
    setupFiles: ['./src/testing/setup.ts'],
    testTimeout: 20_000,
  },
})

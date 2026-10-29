import { afterAll } from 'vitest'

// Fecha as conexões com o MySQL no fim de cada arquivo de teste, senão o processo demora a encerrar.
afterAll(async () => {
  const { pool } = await import('../database/connection.js')
  await pool.end()
})

import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

const carregar = () => import('./config.js')

describe('segredo do JWT', () => {
  it.each(['production', 'staging', ''])('recusa subir sem segredo com NODE_ENV="%s"', async (ambiente) => {
    vi.stubEnv('NODE_ENV', ambiente)
    vi.stubEnv('JWT_SECRET', '')
    await expect(carregar()).rejects.toThrow('JWT_SECRET')
  })

  it('recusa o valor de exemplo do .env.example fora do ambiente local', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('JWT_SECRET', 'defina_uma_chave_longa_e_aleatoria')
    await expect(carregar()).rejects.toThrow('JWT_SECRET')
  })

  it.each(['development', 'test'])('usa o padrão local com NODE_ENV="%s"', async (ambiente) => {
    vi.stubEnv('NODE_ENV', ambiente)
    vi.stubEnv('JWT_SECRET', '')
    const { config } = await carregar()
    expect(config.jwtSecret).toBeTruthy()
  })

  it('aceita um segredo forte em produção', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('JWT_SECRET', 'um-segredo-longo-de-verdade')
    const { config } = await carregar()
    expect(config.jwtSecret).toBe('um-segredo-longo-de-verdade')
  })
})

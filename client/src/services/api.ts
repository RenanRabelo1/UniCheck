export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message)
    this.name = 'ApiError'
  }
}

const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

export async function getJson<T>(path: string, token?: string): Promise<T> {
  if (!apiUrl) {
    throw new ApiError('A URL da API não foi configurada.')
  }

  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    throw new ApiError('Não foi possível carregar os dados do painel.', response.status)
  }

  return response.json() as Promise<T>
}

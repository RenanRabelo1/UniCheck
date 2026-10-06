import { readDatabase } from '../../database/jsonDatabase.js'
import type { Usuario } from '../../database/types.js'

export const usuarioRepository = {
  async listAll(): Promise<Usuario[]> {
    const { usuarios } = await readDatabase()
    return usuarios
  },

  async findByIdentificador(identificador: string): Promise<Usuario | undefined> {
    const normalized = identificador.trim().toLowerCase()
    const { usuarios } = await readDatabase()
    return usuarios.find((usuario) => usuario.identificador.toLowerCase() === normalized)
  },

  async findById(id: string): Promise<Usuario | undefined> {
    const { usuarios } = await readDatabase()
    return usuarios.find((usuario) => usuario.id === id)
  },
}

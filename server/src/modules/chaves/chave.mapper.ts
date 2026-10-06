import type { Chave, Sala, TipoChave } from '../../database/types.js'

export const ROTULO_TIPO_CHAVE: Record<TipoChave, string> = { PRIMARIA: 'Primária', SECUNDARIA: 'Secundária' }

export function toSalaView(sala: Sala) {
  return { id: sala.id, code: sala.codigo, name: sala.nome, active: sala.ativo }
}

export function toChaveView(chave: Chave, salas: Sala[]) {
  const sala = salas.find((item) => item.id === chave.salaId)
  return {
    id: chave.id,
    room: { value: chave.salaId, label: sala ? `${sala.codigo} · ${sala.nome}` : chave.salaId },
    type: chave.tipo === 'PRIMARIA' ? ('primary' as const) : ('secondary' as const),
    typeLabel: ROTULO_TIPO_CHAVE[chave.tipo],
    active: chave.ativo,
  }
}

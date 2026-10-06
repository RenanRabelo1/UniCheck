import type { Material } from '../../database/types.js'

/** `committed` = unidades já aprovadas ou em posse de hoje em diante. */
export function toMaterialView(material: Material, committed: number) {
  return {
    id: material.id,
    name: material.nome,
    detail: material.detalhe ?? null,
    totalQuantity: material.quantidadeTotal,
    committed,
    active: material.ativo,
  }
}

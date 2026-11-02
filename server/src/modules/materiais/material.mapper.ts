import type { Material } from '../../database/types.js'

/** O que o solicitante vê junto do nome: o detalhe cadastrado ou, se não houver, o patrimônio. */
export function detalheExibido(material: Material): string | undefined {
  return material.detalhe ?? (material.patrimonio ? `Patrimônio ${material.patrimonio}` : undefined)
}

/** `committed` = unidades já aprovadas ou em posse de hoje em diante. `inPossession` = unidades fora agora. */
export function toMaterialView(material: Material, committed: number, inPossession = 0) {
  return {
    id: material.id,
    name: material.nome,
    category: material.categoria,
    control: material.controle === 'INDIVIDUAL' ? ('individual' as const) : ('quantity' as const),
    patrimony: material.patrimonio ?? null,
    detail: material.detalhe ?? null,
    totalQuantity: material.quantidadeTotal,
    committed,
    inPossession,
    active: material.ativo,
  }
}

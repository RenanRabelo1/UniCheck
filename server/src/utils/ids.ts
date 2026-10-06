import { randomUUID } from 'node:crypto'

/** Gera ids curtos e legíveis, como "sol-3f9a1c2b". */
export function newId(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`
}

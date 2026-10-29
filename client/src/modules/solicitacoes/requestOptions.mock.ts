import type { CatalogItem, RequestOptions } from "./types";

/** Lista usada no modo demonstração (sem API), no mesmo formato que o servidor devolve. */
const material = (name: string, total: number): CatalogItem => ({
  type: "material",
  id: name,
  name,
  detail: null,
  roomId: null,
  total,
  available: total,
  locked: false,
  lockedReason: null,
});

const key = (roomId: string, label: string, roomName: string): CatalogItem => ({
  type: "key",
  id: `${roomId}-${label}`,
  name: `Chave ${label}`,
  detail: roomName,
  roomId,
  total: 1,
  available: 1,
  locked: false,
  lockedReason: null,
});

export const requestOptionsMock: RequestOptions = {
  rooms: [
    { value: "j-201", label: "J-201 · Laboratório de Redes" },
    { value: "j-204", label: "J-204 · Laboratório de Desenvolvimento" },
    { value: "j-311", label: "J-311 · Sala de Projetos" },
  ],
  items: [
    material("Projetor multimídia", 2),
    material("Notebook", 6),
    material("Extensão elétrica", 6),
    material("Webcam", 4),
    material("Pincel para quadro branco (caixa com 12)", 10),
    material("Apagador de quadro", 5),
    key("j-201", "J-201 · Primária", "Laboratório de Redes"),
    key("j-204", "J-204 · Primária", "Laboratório de Desenvolvimento"),
    key("j-204", "J-204 · Secundária", "Laboratório de Desenvolvimento"),
    key("j-311", "J-311 · Primária", "Sala de Projetos"),
  ],
  authorization: null,
};

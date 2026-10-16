import type { CustodyRecord } from "./return-operations.types";

export const custodyRecordsMock: CustodyRecord[] = [
  {
    id: "custody-1007",
    protocol: "EMP-2026-1007",
    requester: {
      name: "Mariana Alves Costa",
      registration: "202310456",
      contact: "mariana.costa@edu.unifor.br",
      course: "Engenharia de Computação",
    },
    purpose: "Montagem do protótipo de automação do laboratório.",
    withdrawnAt: "2026-10-16T13:30",
    items: [
      {
        id: "item-arduino-01",
        description: "Kit Arduino Uno R3",
        identifier: "PAT-004219",
        category: "Material",
        withdrawalAt: "2026-10-16T13:30",
      },
      {
        id: "item-multimetro-07",
        description: "Multímetro digital Minipa",
        identifier: "PAT-000982",
        category: "Material",
        withdrawalAt: "2026-10-16T13:30",
      },
    ],
  },
  {
    id: "custody-1008",
    protocol: "EMP-2026-1008",
    requester: {
      name: "Lucas Henrique Lima",
      registration: "202211908",
      contact: "lucas.lima@edu.unifor.br",
      course: "Sistemas de Informação",
    },
    purpose: "Acesso autorizado à sala de redes para atividade acadêmica.",
    withdrawnAt: "2026-10-16T14:10",
    items: [
      {
        id: "item-chave-305",
        description: "Chave da sala T-305",
        identifier: "CH-305-P",
        category: "Chave",
        withdrawalAt: "2026-10-16T14:10",
      },
    ],
  },
];

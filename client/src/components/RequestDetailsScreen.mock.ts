import type { RequestDetails } from "./RequestFlow.types";

/** Dados demonstrativos locais; a API futura substituirá este fixture. */
export const requestDetailsMock: RequestDetails = {
  id: "148",
  protocol: "CCT-2026-0148",
  statusLabel: "Em andamento · Parcialmente retirado",
  requester: {
    name: "Carlos Eduardo",
    role: "Professor",
    registration: "123456",
  },
  purpose: "Aula prática de Sistemas Multimídia",
  location: "Laboratório J-02",
  requestedAt: "24/09/2026 às 09:15",
  period: "24/09/2026 · 07:00 às 21:00",
  notes: "Utilização dos equipamentos durante a aula prática da turma N01.",
  items: [
    {
      id: "key-j02",
      name: "Chave da Sala J-02",
      description: "Chave primária de acesso ao laboratório multimídia",
      quantity: 1,
      code: "CHV-J02-A",
      status: "RETIRADO",
      pickup: { date: "24/09/2026 às 07:25", attendant: "Marcos Silva" },
      return: { dueDate: "24/09/2026 às 21:00" },
    },
    {
      id: "projector-24810",
      name: "Projetor Epson WXGA Multimídia",
      description: "Kit 04 · Equipamento de projeção em alta definição",
      quantity: 1,
      code: "Patr. 24810",
      status: "APROVADO",
      return: { dueDate: "24/09/2026 às 21:00" },
    },
    {
      id: "hdmi-09",
      name: "Cabo HDMI de Alta Velocidade",
      description: "Acessório de conectividade AV · 2 metros",
      quantity: 1,
      code: "AC-CAB-09",
      status: "RECUSADO",
      rejectionReason:
        "Item indisponível no horário solicitado devido à manutenção preventiva do lote.",
    },
    {
      id: "markers-03",
      name: "Pincéis Atômicos Recarregáveis",
      description: "Kit com três cores para quadro branco",
      quantity: 1,
      code: "KIT-PIN-03",
      status: "DEVOLVIDO",
      pickup: { date: "24/09/2026 às 07:25", attendant: "Marcos Silva" },
      return: {
        dueDate: "24/09/2026 às 21:00",
        date: "24/09/2026 às 11:15",
        attendant: "Ana Paula",
        condition: "Devolvido em perfeitas condições",
      },
    },
  ],
  timeline: [
    {
      id: "next-step",
      date: "Hoje, até 21:00",
      title: "Devolução da chave da Sala J-02",
      description: "Entregue a chave no guichê presencial da Secretaria J-02.",
      isNextStep: true,
    },
    {
      id: "markers-returned",
      date: "24/09/2026 às 11:15",
      title: "Pincéis devolvidos e conferidos",
      description: "Item recebido em perfeitas condições por Ana Paula.",
    },
    {
      id: "key-picked-up",
      date: "24/09/2026 às 07:25",
      title: "Chave retirada presencialmente",
      description: "Termo de responsabilidade confirmado no balcão.",
    },
    {
      id: "reviewed",
      date: "23/09/2026 às 16:30",
      title: "Itens analisados pela Secretaria Técnica",
      description:
        "Itens aprovados individualmente e indisponibilidade registrada.",
    },
    {
      id: "created",
      date: "23/09/2026 às 09:15",
      title: "Solicitação enviada",
      description: "Pedido registrado pelo portal acadêmico.",
    },
  ],
};

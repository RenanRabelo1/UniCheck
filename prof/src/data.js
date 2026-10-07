// Dados de exemplo (troque depois por uma API / banco de dados)
export const dashboard = {
  usuario: { nome: 'Ricardo Mendes', titulo: 'Prof.', perfil: 'Professor', iniciais: 'RM', matricula: '2048819' },
  local: 'Centro de Ciências Tecnológicas - Bloco J-02',
  resumo: { pendentes: 1, aprovadas: 1, emPosse: 1 },
  atividades: [
    { numero: '#CCT-2026-0150', data: '25/09/2026', local: 'J-04', itens: 1, status: 'Retirado' },
    { numero: '#CCT-2026-0148', data: '24/09/2026', local: 'J-03', itens: 2, status: 'Parcial' },
    { numero: '#CCT-2026-0147', data: '22/09/2026', local: 'J-02', itens: 2, status: 'Pendente' },
  ],
}

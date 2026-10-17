# Painel Administrativo Visual

## Contexto

O coordenador possui um painel administrativo visual. Nesta rodada ele deve permanecer demonstrativo, isolado e alinhado ao protótipo, sem integrar as ações ao backend.

## Problema real

O painel é uma tela de domínio distinta, mas seu comportamento visual, mocks e tipos precisam permanecer isolados para não acoplar administração ao shell ou ao fluxo do solicitante.

## Requisitos

| ID | Requisito | Prioridade | Notas |
|---|---|---|---|
| AD-01 | Manter dashboard do coordenador como módulo visual independente | Must | Usar props de sessão do shell |
| AD-02 | Manter filas, indicadores e status como mocks explícitos | Must | Não chamar API |
| AD-03 | Tornar ações demonstrativas claras como não persistentes | Must | Sem aprovação/reprovação real |
| AD-04 | Ajustar layout, acessibilidade básica e responsividade local | Should | Dentro dos CSS do módulo |
| AD-05 | Registrar integração administrativa futura | Should | Sem implementar |

## Fora do escopo

- Aprovação/reprovação real, endpoints, alterações no servidor e MySQL.
- Edição de `App.tsx`, telas do solicitante ou estilos globais sem justificativa.

## Critérios de aceite

- [ ] O painel renderiza para sessão demonstrativa de coordenador.
- [ ] Nenhuma ação visual grava dados ou chama API.
- [ ] Mocks e tipos permanecem co-localizados.
- [ ] Build do cliente passa.

## Dependências

- `frontend-shell` mantém a entrega da sessão demonstrativa ao painel.

## Riscos identificados

- Confundir comportamento visual com decisão administrativa real; toda ação deve permanecer marcada como demonstrativa.

# Tasks — Lote visual de telas 08 a 16

## Status geral

[ ] Em execução

### T08 — Solicitações pendentes [P]
**Depende de:** nenhuma. **Gate:** componente/mocks isolados e build do cliente quando o ambiente permitir. **Rastreabilidade:** B08.

### T09 — Análise da solicitação
**Depende de:** T08. **Gate:** parecer visual por item e build. **Rastreabilidade:** B09.

### T10 — Retirada presencial
**Depende de:** T09. **Gate:** termo, itens aprovados e build. **Rastreabilidade:** B10.

### T11 — Devolução presencial
**Depende de:** T10. **Gate:** checklist, condição e build. **Rastreabilidade:** B11.

### T12 — Alertas de atraso
**Depende de:** T11. **Gate:** filtros e controles demonstrativos. **Rastreabilidade:** B12.

### T13 — Materiais [P]
**Depende de:** nenhuma. **Gate:** filtros, detalhe, cadastro e inativação mockados. **Rastreabilidade:** B13.

### T14 — Salas e chaves [P]
**Depende de:** nenhuma. **Gate:** salas, chaves e ações visuais isoladas. **Rastreabilidade:** B14.

### T15 — Autorizações e projetos [P]
**Depende de:** nenhuma. **Gate:** projetos, autorizações e estados mockados. **Rastreabilidade:** B15.

### T16 — Histórico de movimentações
**Depende de:** T12, T13, T14, T15. **Gate:** filtros, dossiê e controles demonstrativos. **Rastreabilidade:** B16.

### T17 — Integração coordenada
**Depende de:** T08–T16. **Gate:** todas as telas acessíveis pelo `AppShell`, sem backend/API. **Rastreabilidade:** INT-01.

### T18 — Validação final
**Depende de:** T17. **Gate:** desktop/mobile, lint, testes e build do cliente. **Rastreabilidade:** VAL-01.

# Tasks — Fluxo Visual de Solicitações

## Status geral

[ ] Em planejamento | [ ] Em execução | [ ] Concluído

### T01 — Auditar componentes e estados visuais
**O quê:** Conferir componentes, tipos e mocks do fluxo atual contra a jornada especificada.
**Onde:** `client/src/components/{NewRequestScreen,RequestConfirmationScreen,MyRequestsScreen,RequestDetailsScreen}*`.
**Depende de:** nenhuma.
**Paralela:** S.
**Feito quando:** lacunas e arquivos do módulo estão identificados.
**Gate:** revisão local dos componentes.
**Rastreabilidade:** RF-01, RF-03.

### T02 — Consolidar dados demonstrativos e tipos
**O quê:** Manter mocks e tipos de solicitação no limite do módulo, sem criar chamadas HTTP.
**Onde:** arquivos `*.mock.ts` e `*.types.ts` do módulo.
**Depende de:** T01.
**Paralela:** N.
**Feito quando:** os estados das telas são demonstráveis e não duplicam dados sem necessidade.
**Gate:** `npm.cmd run build --workspace=@unicheck/client` → sucesso.
**Rastreabilidade:** RF-02, RF-03.

### T03 — Ajustar experiência visual e documentar integração futura
**O quê:** Corrigir inconsistências visuais e registrar contrato de integração pendente no contexto do módulo.
**Onde:** componentes/CSS próprios e `context.md`.
**Depende de:** T02.
**Paralela:** N.
**Feito quando:** jornada visual é coerente e API continua fora do código.
**Gate:** build do cliente → sucesso.
**Rastreabilidade:** RF-01, RF-04, RF-05.

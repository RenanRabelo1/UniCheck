# Tasks — Painel Administrativo Visual

## Status geral

[ ] Em planejamento | [ ] Em execução | [ ] Concluído

### T01 — Mapear painel e dados demonstrativos
**O quê:** Revisar componentes, tipos, mock e CSS exclusivos do painel.
**Onde:** `client/src/components/AdminDashboard.*`.
**Depende de:** nenhuma.
**Paralela:** S.
**Feito quando:** arquivos e estados demonstrativos do painel estão delimitados.
**Gate:** revisão local.
**Rastreabilidade:** AD-01, AD-02.

### T02 — Refinar comportamento visual isolado
**O quê:** Corrigir lacunas do painel sem persistir ou chamar API.
**Onde:** `AdminDashboard.tsx`, `.css`, `.mock.ts`, `.types.ts`.
**Depende de:** T01.
**Paralela:** N.
**Feito quando:** cada ação deixa claro o efeito demonstrativo ou navegação local.
**Gate:** `npm.cmd run build --workspace=@unicheck/client` → sucesso.
**Rastreabilidade:** AD-02, AD-03, AD-04.

### T03 — Registrar fronteira de integração
**O quê:** Documentar ações administrativas que futuramente dependerão da API.
**Onde:** `context.md` do módulo.
**Depende de:** T02.
**Paralela:** N.
**Feito quando:** a próxima etapa de API pode começar sem inferir regras da UI.
**Gate:** revisão do documento.
**Rastreabilidade:** AD-05.

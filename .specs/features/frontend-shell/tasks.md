# Tasks — Frontend Shell e Navegação Demonstrativa

## Status geral

[ ] Em planejamento | [ ] Em execução | [ ] Concluído

### T01 — Mapear responsabilidades atuais
**O quê:** Identificar estados, tipos e transições de `App.tsx` a extrair.
**Onde:** `client/src/App.tsx`.
**Depende de:** nenhuma.
**Paralela:** N.
**Feito quando:** há uma lista de responsabilidades preservadas antes da alteração.
**Gate:** revisão do diff → sem regra visual perdida.
**Rastreabilidade:** FS-01, FS-02.

### T02 — Criar shell e tipos locais
**O quê:** Criar estrutura de `app/` ou `modules/auth/` para sessão e navegação demonstrativas.
**Onde:** `client/src/app/`, `client/src/modules/` conforme convenções.
**Depende de:** T01.
**Paralela:** N.
**Feito quando:** sessão e view são tipadas fora de `App.tsx`.
**Gate:** `npm.cmd run build --workspace=@unicheck/client` → sucesso.
**Rastreabilidade:** FS-01, FS-02.

### T03 — Reduzir App e validar jornadas
**O quê:** Usar o shell novo sem mudar as telas dos outros módulos.
**Onde:** `client/src/App.tsx`, `client/src/App.test.tsx`.
**Depende de:** T02.
**Paralela:** N.
**Feito quando:** login demonstrativo, dashboard e logout funcionam para os três perfis.
**Gate:** `npm.cmd test --workspace=@unicheck/client -- --run` e build → sucesso.
**Rastreabilidade:** FS-03, FS-04, FS-05.

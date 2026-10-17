# Tasks — Alinhamento da Documentação ao Protótipo JSON

## Status geral

[ ] Em planejamento | [ ] Em execução | [x] Concluído

### T01 — Inventariar divergências verificáveis [x]
**O quê:** Comparar documentos gerais com runtime e configuração atuais.
**Onde:** `agents.md`, `docs/`, `.env.example`, `package.json`, arquivos de configuração necessários.
**Depende de:** nenhuma.
**Paralela:** S.
**Feito quando:** cada divergência possui prova no código ou configuração.
**Gate:** revisão documental.
**Rastreabilidade:** DA-01 a DA-04.

### T02 — Corrigir documentos gerais [x]
**O quê:** Atualizar somente os documentos gerais afetados, preservando regras de domínio e indicando roadmap futuro.
**Onde:** `agents.md`, `docs/`, `.env.example` quando estritamente documental.
**Depende de:** T01.
**Paralela:** N.
**Feito quando:** runtime JSON, auth futura e MySQL futuro são inequívocos.
**Gate:** `git diff --check` → sucesso.
**Rastreabilidade:** DA-01 a DA-05.

### T03 — Registrar decisão operacional [x]
**O quê:** Atualizar o estado geral e concluir o módulo documental.
**Onde:** `.specs/project/STATE.md`, arquivos da feature.
**Depende de:** T02.
**Paralela:** N.
**Feito quando:** próximos colaboradores encontram instruções não contraditórias.
**Gate:** revisão do diff.
**Rastreabilidade:** DA-01 a DA-05.

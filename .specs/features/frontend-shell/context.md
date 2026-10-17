# Contexto de implementação — Frontend Shell

## Decisões

- 2026-10-16 — A autenticação desta rodada continua demonstrativa: `useDemoSession` mantém apenas estado local, sem token, JWT, `fetch` ou persistência.
- 2026-10-16 — `App.tsx` ficou restrito à composição de `AppShell`; sessão, formulário de acesso e navegação visual foram extraídos para `modules/auth/` e `app/`.
- 2026-10-16 — As telas existentes mantêm as mesmas props; o shell somente preserva e encaminha seus callbacks atuais.

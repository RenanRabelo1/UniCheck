# Tarefas — Materiais do professor

- [x] T01 — Criar modelos e mocks locais para PM-01 e PM-04. Gate: TypeScript estrito e nenhum acesso HTTP.
- [x] T02 — Implementar catálogo com busca, filtro e seleção local para PM-01, PM-02 e PM-03. Gate: lint do client.
- [x] T03 — Implementar estilos responsivos e feedback acessível para PM-04 e PM-05. Gate: build do client.
- [x] T04 — Adicionar teste de interação local quando viável e validar client com lint, testes e build. Gate: comandos reais documentados.

## Ordem

T01 → T02 → T03 → T04. Não há paralelismo porque as tarefas escrevem no mesmo módulo.

## Resultado do gate

- `npm.cmd run lint --workspace=@unicheck/client`: passou.
- `npx.cmd vitest run --pool=threads --no-file-parallelism --maxWorkers=1`: 2 arquivos e 8 testes passaram.
- `npm.cmd run build --workspace=@unicheck/client`: passou.
- O comando padrão do Vitest falha somente neste sandbox ao usar o pool padrão (`ENOENT` em arquivo temporário); o pool de threads executou a mesma suíte com sucesso.

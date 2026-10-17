# Materiais do professor

## Objetivo e elementos obrigatórios

Tela visual isolada de catálogo para professores, com busca, filtro por categoria, cards de materiais, disponibilidade demonstrativa, seleção local e quantidade. Deve avisar explicitamente que não existe reserva ou persistência.

## Arquivos permitidos

Somente arquivos dentro de `client/src/modules/professor-materials/`.

## Documentos mínimos

Consultar `AGENTS.md`, `.specs/codebase/STACK.md`, `.specs/codebase/CONVENTIONS.md`, `.specs/codebase/TESTING.md` e `.specs/project/STATE.md` quando disponíveis no worktree.

## Critérios de aceite

- Busca e filtro atualizam os cards localmente.
- Materiais sem disponibilidade não podem ser selecionados.
- A seleção permite ajustar quantidade respeitando o estoque demonstrativo.
- O aviso de ausência de reserva e persistência fica visível.
- Testes do módulo cobrem filtragem e seleção quando a configuração permitir.
- Lint, testes e build do client são executados e suas limitações são registradas.

## Proibições de escopo

Não alterar navegação, shell, backend, API, autenticação, persistência, contratos, serviços compartilhados ou arquivos fora deste diretório. Não adicionar chamadas de rede, JWT, reservas reais ou decisões de domínio além do mock visual.

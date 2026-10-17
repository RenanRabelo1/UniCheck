# Tarefas — entrada do catálogo de materiais

- [x] **T01 / R01** — Adicionar a view de catálogo e o callback `onMaterials` ao painel do professor.
  **Arquivos:** `client/src/app/navigation.ts`, `client/src/components/UserDashboard.tsx`, `client/src/app/AppShell.tsx`.
  **Gate:** o item da navegação deixa de ser uma âncora inerte e abre a view correta.

- [x] **T02 / R02-R04** — Renderizar o catálogo em uma página demonstrativa com retorno ao painel, preservando o isolamento do papel.
  **Arquivos:** `client/src/app/AppShell.tsx`, estilos globais se necessários.
  **Gate:** retorno funcional; nenhum acesso à API ou gravação é incluído.

- [x] **T03 / R01-R04** — Cobrir o percurso com teste de interface e validar lint, testes, build e whitespace.
  **Arquivos:** `client/src/App.test.tsx`.
  **Gate:** comandos do workspace passam.

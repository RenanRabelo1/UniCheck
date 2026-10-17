# Lote visual — Telas 08 a 16

## Contexto

O protótipo possui nove telas administrativas ainda sem equivalente navegável. Esta iteração conclui somente componentes e mocks visuais, sem integração de backend.

## Problema real

As telas pendentes não podem ser construídas no `AppShell` nem misturadas com contratos futuros. É preciso entregá-las como módulos isolados, depois integrá-las de uma vez no shell.

## Requisitos

| ID | Requisito | Prioridade |
|---|---|---|
| B08 | Criar tela visual de solicitações pendentes | Must |
| B09 | Criar análise visual por item | Must |
| B10 | Criar retirada presencial visual | Must |
| B11 | Criar devolução presencial visual | Must |
| B12 | Criar alertas de atraso visuais | Must |
| B13 | Criar gerenciamento visual de materiais | Must |
| B14 | Criar gerenciamento visual de salas e chaves | Must |
| B15 | Criar gerenciamento visual de alunos autorizados e projetos | Must |
| B16 | Criar histórico visual de movimentações | Must |
| INT-01 | Integrar componentes concluídos ao `AppShell` sem alterar contratos de backend | Must |
| VAL-01 | Validar desktop, mobile, lint, testes e build no checkout principal | Must |

## Fora do escopo

- Backend, API, autenticação, persistência JSON, MySQL e contratos.
- E-mail, PDF, CSV, impressão, exportação e operações de custódia reais.
- Alteração de arquivos compartilhados pelos subagentes.

## Critérios de aceite

- [ ] B08–B16: cada tela existe em módulo isolado com mocks explícitos.
- [ ] INT-01: todas as telas podem ser abertas pelo coordenador via `AppShell` após integração coordenada.
- [ ] VAL-01: build e testes do cliente passam; lint é reportado com evidência; layouts são inspecionados em viewport desktop e mobile.

## Dependências

`B08 → B09 → B10 → B11 → B12`; `B13`, `B14` e `B15` são independentes; `B16` só inicia após as demais telas; integração depende de B08–B16.

## Riscos

- Worktrees não compartilham dependências instaladas; o gate final deve rodar no checkout principal.
- Integração no `AppShell` pode conflitar com mudanças locais anteriores; resolver apenas após todos os módulos estarem commitados.

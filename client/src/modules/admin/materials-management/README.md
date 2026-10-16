# Tela 13 — Gerenciamento de materiais

## Objetivo e elementos obrigatórios

Permitir consultar, cadastrar visualmente, filtrar e inativar materiais. Incluir cadastro, filtros avançados, filtros por categoria e modalidade de controle (individual ou por quantidade), lista de inventário, detalhes e confirmação de inativação. Material com histórico é inativado, nunca excluído. Usar somente mocks explícitos.

## Arquivos que pode criar ou alterar

- `client/src/modules/admin/materials-management/**`

## Documentos mínimos que deve ler

- `agents.md`
- Este `README.md`

## Critérios de aceite

- A tela é autocontida no diretório permitido, com componente, tipos, mocks e CSS co-localizados quando necessários.
- Filtros, detalhe, cadastro e inativação funcionam apenas como estados visuais locais.
- A confirmação de inativação explica que não exclui o material.
- Nenhum arquivo fora do diretório permitido é alterado.
- `npm.cmd run build --workspace=@unicheck/client` passa no worktree.

## Proibições de escopo

- Não alterar backend, API, autenticação, persistência, contratos ou banco.
- Não editar `App.tsx`, `app/`, navegação, estilos globais ou componentes compartilhados.
- Não implementar chamadas HTTP, exclusão real, geração de arquivo, e-mail, PDF, CSV ou impressão.
- Não representar ação demonstrativa como persistida.

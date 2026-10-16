# Tela 14 — Gerenciamento de salas e chaves

## Objetivo e elementos obrigatórios

Administrar visualmente salas, catálogo de chaves físicas e situação do claviculário. Incluir visão por salas, catálogo de chaves, criação de sala, cadastro de chave física, detalhes da sala, situação/ação da chave e atalho demonstrativo para retiradas. Chaves com histórico não podem ser apagadas. Usar somente mocks explícitos.

## Arquivos que pode criar ou alterar

- `client/src/modules/admin/rooms-keys-management/**`

## Documentos mínimos que deve ler

- `agents.md`
- Este `README.md`

## Critérios de aceite

- A tela é autocontida no diretório permitido, com componente, tipos, mocks e CSS co-localizados quando necessários.
- Salas, chaves, detalhes e ações possuem estados visuais demonstráveis.
- Ações de cadastro e situação não chamam API e deixam clara a natureza demonstrativa.
- Nenhum arquivo fora do diretório permitido é alterado.
- `npm.cmd run build --workspace=@unicheck/client` passa no worktree.

## Proibições de escopo

- Não alterar backend, API, autenticação, persistência, contratos ou banco.
- Não editar `App.tsx`, `app/`, navegação, estilos globais ou componentes compartilhados.
- Não implementar chamadas HTTP, exclusão real, geração de arquivo, e-mail, PDF, CSV ou impressão.
- Não representar ação demonstrativa como persistida.

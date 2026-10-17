# Tela 10 — Retirada presencial

## Objetivo e elementos obrigatórios

Registrar visualmente a transferência de custódia de itens aprovados. Incluir busca de solicitações aprovadas, dossiê do solicitante, seleção dos itens, aceite do termo, identificação do coordenador, data/hora e ação **Confirmar Retirada e Transferir Custódia**. Apenas itens aprovados podem seguir para retirada. Usar somente mocks explícitos.

## Arquivos que pode criar ou alterar

- `client/src/modules/admin/checkout-operations/**`

## Documentos mínimos que deve ler

- `agents.md`
- Este `README.md`

## Critérios de aceite

- A tela é autocontida no diretório permitido, com componente, tipos, mocks e CSS co-localizados quando necessários.
- A confirmação visual exige seleção de item e aceite do termo.
- Dossiê, responsável e data/hora são apresentados no fluxo visual.
- O resultado visual exibe protocolo demonstrativo e callback tipado de retorno.
- Nenhum arquivo fora do diretório permitido é alterado.
- `npm.cmd run build --workspace=@unicheck/client` passa no worktree.

## Proibições de escopo

- Não alterar backend, API, autenticação, persistência, contratos ou banco.
- Não editar `App.tsx`, `app/`, navegação, estilos globais ou componentes compartilhados.
- Não implementar chamadas HTTP, transferência de custódia real, termo persistido, e-mail, PDF, CSV ou impressão.
- Não representar retirada demonstrativa como persistida.

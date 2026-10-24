# UniCheck — Minhas solicitações e Detalhes da solicitação

## O que esta entrega faz

- Login real em `VITE_DATA_SOURCE=api`, utilizando POST /auth/login e JWT.
- GET /solicitacoes lista somente os pedidos do usuário autenticado.
- Busca por protocolo, item ou sala; filtros de situação e semestre; atualização manual.
- GET /solicitacoes/:id consulta o pedido selecionado, seus itens, motivos de recusa e movimentações registradas.
- Carregamento, lista vazia, erro de rede e tentativa novamente. Erros não são substituídos por dados fictícios.
- Outro usuário recebe 404 ao tentar consultar um pedido que não é seu; consultas sem token recebem 401.
- O modo mock permanece disponível para demonstração visual.

## Como testar primeiro em uma pasta separada (Windows)

1. Extraia o ZIP. Abra a pasta `UniCheck` extraída no VS Code: Arquivo > Abrir pasta.
2. Abra Terminal > Novo terminal. Execute na pasta que contém o package.json principal:

```powershell
npm.cmd ci
```

Use Node.js 22.12 ou superior compatível com o lockfile. Não execute os comandos dentro de `src`.

3. Crie o arquivo `client/.env` com este conteúdo:

```dotenv
VITE_DATA_SOURCE=api
VITE_API_URL=http://localhost:3000
```

4. No primeiro terminal, execute:

```powershell
npm.cmd run dev:server
```

5. Abra um segundo terminal, também na raiz do projeto, e execute:

```powershell
npm.cmd run dev --workspace=@unicheck/client -- --port 5173 --strictPort
```

Abra http://localhost:5173. Mantenha os dois terminais abertos.
Se a porta 5173 estiver ocupada, encerre o Vite anterior ou use outra porta e configure
`CORS_ORIGIN=http://localhost:5174` no arquivo `server/.env`; reinicie o servidor.
O servidor usa a porta 3000 por padrão; se mudar, ajuste também VITE_API_URL.

## Contas do banco de teste

| Aba do login | Identificador | Senha do seed local |
| --- | --- | --- |
| Professor | 2048819 | unicheck123 |
| Aluno | aluno.autorizado@unifor.br | unicheck123 |

Essas credenciais são somente do seed de demonstração. Uma base existente pode ter outras credenciais.
Na primeira execução, o servidor cria `server/data/db.json` a partir de `db.seed.json`.
Não use `db:reset` sobre dados que deseja preservar.

## Roteiro de conferência

1. Entre como professor. Abra Minhas solicitações: no seed existem quatro pedidos.
2. Teste a busca por item/sala e os filtros; o semestre é calculado pela data de utilização.
3. Abra Ver detalhes e confira os dados do pedido selecionado.
4. No pedido `sol-004`, confira retirada e devolução do material com horários registrados.
5. Volte ao painel e encerre a sessão. Entre como aluno: o seed contém três pedidos diferentes.
6. Abra `sol-006` para ver movimentações de uma chave.
7. Pare o servidor e tente atualizar a lista: deve aparecer um erro, nunca uma lista fictícia.
8. Reinicie o servidor e clique em Tentar novamente.

Dados do seed são exemplos de outubro de 2026. O filtro inicial mostra todo o histórico.
O job existente de atrasos pode atualizar itens em posse conforme a data atual.

## Como levar para o repositório da equipe

Esta pasta extraída serve para testar; o seu repositório original permanece onde estava.
Depois de testar, use uma branch de feature no GitHub Desktop, por exemplo
`feat/consulta-solicitacoes`. Compare os arquivos da lista `ARQUIVOS_ALTERADOS.txt`
com os da versão atual da equipe. Se seus amigos editaram os mesmos arquivos desde
o ZIP enviado, mescle as alterações em vez de substituir esses arquivos inteiros.
Copie os arquivos novos/alterados para os mesmos caminhos no repositório original.
Não copie node_modules, dist, .env ou db.json. Não apague pastas do projeto original.
Revise Changes no GitHub Desktop, faça o commit e envie a branch. A integração à main
pode ser feita por Pull Request depois da revisão da equipe.

## Contratos e decisões

As rotas existentes foram reaproveitadas, com campos adicionais:

- Lista e detalhe: `protocol` (ID já existente do pedido), `semester` e `items[].updatedAt`.
- Detalhe: `requester` (dados públicos do solicitante) e `movements` (somente do pedido).
- A leitura dos detalhes usa um único snapshot do JSON, após filtrar pelo dono.
- O status de cada item é preservado, inclusive RESERVADO e ATRASADO.
- O agrupamento da lista prioriza: em posse/atrasado, pendente, aprovado/reservado,
  devolvido, recusado. Pedidos mistos mostram também a contagem por status.
- Busca e filtros são feitos no client, sobre a lista que a API já restringiu ao dono.
- Datas de eventos são exibidas no fuso America/Sao_Paulo.
- Finalidade não existe no modelo atual: a tela informa que não foi cadastrada.
- O modelo guarda a última atualização do item, não uma auditoria completa de todas
  as decisões. O histórico mostra criação, decisões ainda disponíveis e movimentações;
  não inventa datas de aprovação anteriores à retirada/devolução.
- Observações das movimentações aparecem no histórico; não são tratadas como uma
  condição estruturada de devolução, pois esse campo ainda não existe no modelo.

## Limites do escopo

Persistência continua em JSON. O arquivo SQL não conecta o sistema ao MySQL.
Nova solicitação/Confirmação e módulos administrativos continuam demonstrativos.
Para evitar confirmação falsa em modo API, o envio de pedido novo informa que ainda
não está disponível e não declara que houve gravação. Essa integração é outra tarefa.
A sessão de tela fica em memória; ao recarregar a página é necessário entrar novamente.

## Verificação realizada

- 86 testes do servidor aprovados, incluindo isolamento entre usuários e movimentações.
- 14 testes do client aprovados, incluindo filtros, consulta pelo ID, erros/retry e login.
- Build do client e do servidor aprovado.
- ESLint do client aprovado.
- O comando global de lint do servidor não executa: o projeto original não contém
  eslint.config.* no workspace server. Esse problema de configuração preexistente
  não foi mascarado nem tratado como validação aprovada.
- Os arquivos de código alterados foram formatados com Prettier. A checagem global
  de formatação ainda aponta arquivos preexistentes fora deste escopo.
- Não foi realizada inspeção visual em navegador real; os fluxos de tela foram testados
  em DOM simulado com Testing Library, e os endpoints com Supertest.

Comandos de verificação na raiz:

```powershell
npm.cmd test
npm.cmd run build --workspaces
npm.cmd run lint --workspace=@unicheck/client
```

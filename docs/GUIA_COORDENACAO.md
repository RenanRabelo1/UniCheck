# UniCheck — Pendências e Análise da solicitação

## O que foi integrado

Em `VITE_DATA_SOURCE=api`, a coordenação consulta os pedidos com pelo menos um item pendente, abre o pedido escolhido e aprova ou recusa cada item. A recusa exige motivo de até 300 caracteres. Cada decisão é enviada imediatamente ao servidor, que grava no MySQL e devolve a situação atualizada. Aprovar um item não aprova os demais.

A fila permite busca por protocolo, solicitante, matrícula ou item, filtro por data de utilização e tipo de recurso pendente, paginação e atualização. O pedido permanece na fila enquanto houver algum item pendente. Depois de analisar todos os itens, volte à fila para consultar os demais pedidos.

Se houver falha ou conflito ao salvar, a tela pede uma atualização antes de tentar outra decisão. Isso evita reenviar sem saber se uma requisição foi gravada. O servidor existente controla permissões, disponibilidade e decisões concorrentes. A interface não inventa quantidade disponível, prioridade, telefone ou e-mail que a API não fornece.

O modo `mock` mantém as demonstrações anteriores. No modo API, todas as telas administrativas usam dados reais: painel, pendências, análise, retirada, devolução, alertas, materiais, salas e chaves, autorizações e projetos, e histórico. Veja "Telas administrativas no modo API".

## Instalar no computador

1. No GitHub Desktop, atualize a branch que contém a versão MySQL da equipe. Crie uma branch, por exemplo `feat/coordenacao-solicitacoes`. Evite atualizar uma branch antiga sem a migração da equipe.
2. Extraia este ZIP em uma pasta separada para revisar e testar. Na pasta principal extraída, que contém `client`, `server` e `package.json`, execute:

```powershell
npm.cmd ci
```

3. Copie `server/.env.example` para `server/.env` e preencha as credenciais do seu MySQL. Não envie esse arquivo ao GitHub. Se já possui um `.env` local correto, preserve seus valores. Não coloque sua senha no `.env.example`.
4. Copie `client/.env.example` para `client/.env` e configure:

```dotenv
VITE_DATA_SOURCE=api
VITE_API_URL=http://localhost:3000
```

5. Com o MySQL 8.0.16+ em execução, rode na raiz:

```powershell
npm.cmd run migrate --workspace=@unicheck/server
npm.cmd run db:check --workspace=@unicheck/server
```

As migrations 006 e 007 precisam ser aplicadas: a 006 troca os dois triggers de chave, e a 007 guarda as sessões encerradas. Em um banco novo de desenvolvimento, carregue os exemplos com:

```powershell
npm.cmd run db:seed --workspace=@unicheck/server
```

Não é preciso reaplicar o seed em um banco já configurado para instalar estas telas. Reaplicar o seed pode restaurar os valores dos registros de demonstração. Não apague seu banco.

6. Abra dois terminais na pasta principal. No primeiro:

```powershell
npm.cmd run dev:server
```

No segundo:

```powershell
npm.cmd run dev:client
```

7. Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`. Se usar outra porta, ajuste `CORS_ORIGIN` no `.env` do servidor e reinicie-o. Reinicie o Vite após alterar o `.env` do client.

## Testar o fluxo completo com MySQL

As contas abaixo são apenas do seed de demonstração, não a senha do seu MySQL:

| Perfil | Identificador | Senha de teste |
| --- | --- | --- |
| Professor | 2048819 | unicheck123 |
| Coordenação | 18024900 | unicheck123 |
| Aluno autorizado | aluno.autorizado@unifor.br | unicheck123 |

1. Entre como professor e crie uma solicitação com itens disponíveis para uma data/horário futuro. Anote o protocolo. Prefira um pedido novo: os exemplos antigos têm datas fixas.
2. Saia e entre pela aba Coordenador CCT. Clique em **Solicitações**, localize o protocolo e clique em **Analisar solicitação**.
3. Confira solicitante, sala, data, horário e quantidades. Clique em **Aprovar e salvar** em um item. Espere a confirmação do servidor.
4. Em outro item, clique em **Recusar**, preencha o motivo e clique em **Confirmar recusa**. Sem motivo o envio fica desabilitado.
5. Atualize a solicitação e confira se as decisões permanecem. Volte à fila: o pedido só deve desaparecer quando não houver mais itens pendentes.
6. Saia e entre novamente como solicitante. Em Minhas solicitações e nos detalhes, confira aprovação/recusa e o motivo informado.
7. Para testar concorrência, abra o mesmo pedido pendente em dois navegadores com coordenação. Decida um item no primeiro e tente decidir o mesmo item no segundo. O segundo deve receber um conflito e, ao atualizar, mostrar o estado salvo.
8. Pare o back-end e clique em Atualizar. A tela deve mostrar erro e permitir tentar novamente, sem substituir dados por exemplos.
9. Execute `npm.cmd test` com o MySQL ligado. Os testes de integração reinicializam um banco separado terminado em `_test`; não use esse nome para armazenar dados que queira conservar.

## Contratos utilizados

| Método e rota | Comportamento |
| --- | --- |
| `GET /admin/solicitacoes?status=PENDENTE` | Fila existente; retorna pedidos com algum item pendente, incluindo todos os itens do pedido. |
| `GET /admin/solicitacoes/:id` | Nova rota de detalhe; acessível à coordenação e secretaria, inclusive após a análise. |
| `POST /admin/solicitacoes/:id/itens/:itemId/decisao` | Rota existente, exclusiva da coordenação. Corpo: `{"decision":"approve"}` ou `{"decision":"refuse","reason":"Motivo"}`. |

Todas exigem token Bearer. Detalhe ausente retorna 404; sem autenticação 401; perfil sem permissão 403. A decisão existente valida motivo e impede nova decisão sobre item já analisado (409). O novo detalhe usa os mapeadores existentes, sem expor senha ou hash do usuário. Não foi necessário alterar migrations ou seed.

## Telas administrativas no modo API

| Tela | Rotas | O que muda em relação ao mock |
| --- | --- | --- |
| 7. Painel | `GET /dashboard/admin` | Sem leitor de crachá, ocupação do Bloco J, guichê e números fixos. O menu ganhou Alertas e Salas e chaves. |
| 12. Alertas | `GET /alertas?status=open\|resolved\|all` | Sem lembrete, exportação e leitor de código, que não têm back-end. "Registrar devolução" abre a Tela 11. |
| 13. Materiais | `GET/POST /admin/materiais`, `PATCH /admin/materiais/:id` | Categoria, controle e patrimônio são gravados. Sem localização e descrição, que não existem no banco: use o detalhe. O controle não muda depois do cadastro. |
| 14. Salas e chaves | `GET/POST /admin/salas`, `PATCH /admin/salas/:id`, `GET/POST /admin/chaves`, `PATCH /admin/chaves/:id` | A situação da chave vem do item em posse. O código é gerado pelo servidor e cada sala tem no máximo uma chave de cada tipo. |
| 15. Autorizações | `GET/POST /admin/autorizacoes`, `PATCH /admin/autorizacoes/:id`, `GET /admin/autorizacoes/opcoes`, `GET/POST /admin/projetos`, `PATCH /admin/projetos/:id` | Aluno e professor são escolhidos entre usuários reais. Coordenador e data vêm do servidor. Sem edição e histórico por autorização: inative e crie outra. |
| 16. Histórico | `GET /movimentacoes/historico?search=&material=&room=&status=&from=&to=` | Uma linha por item, inclusive sem movimentação. O período usa a data de utilização. Sem imprimir e exportar. |

Escrita é exclusiva da coordenação, inclusive retirada e devolução. Materiais, salas, chaves, projetos e autorizações só são inativados.

### Login e sessão

- Aluno entra com o e-mail institucional; professor e coordenador, com a matrícula.
- Com a API real, a tela de login não mostra contas de teste. Use as da tabela acima digitando os dados.
- Depois de 10 senhas erradas na mesma conta e origem, o login fica bloqueado por 15 minutos.
- Sair invalida o token no servidor. Recarregar a página mantém a sessão e a tela atual.

### Retirada e devolução

- Na retirada de chave, informe a chave física entregue. Ela pode ser outra chave ativa da mesma sala, e o item passa a apontar para ela.
- Na devolução, a condição é obrigatória e fica gravada separada das observações. As duas informações aparecem no Histórico.

### Autorização do aluno

A chave só é liberada com autorização, projeto e professor ativos. A regra vale no login, nas opções, na criação do pedido e nos triggers. Ao revogar a autorização:

- a chave em posse ainda pode ser devolvida e continua entrando na verificação das 22:40;
- o pedido pendente não pode mais ser aprovado, apenas recusado com motivo.

Antes da migration 006, o trigger de UPDATE disparava em qualquer alteração do item. Revogar a autorização travaria a devolução da chave e o job de atrasos.

### Como testar

1. Entre como coordenação: os indicadores devem bater com as telas de cada etapa.
2. Em Materiais, cadastre um material individual com patrimônio. Como professor, confira o patrimônio em Nova solicitação.
3. Em Salas e chaves, tente inativar uma chave em posse: o servidor recusa e a tela mostra o motivo.
4. Em Autorizações, autorize um aluno e confira que as chaves são liberadas para ele. Inative o projeto e confira o bloqueio.
5. Registre uma devolução e confira, no Histórico, quem decidiu, entregou e recebeu. Item que atrasou continua marcado com "Teve atraso".

## Verificações da entrega de pendências e análise

As contagens abaixo são daquela entrega. A integração das telas administrativas tem seus próprios resultados no Pull Request.

- Front-end: **29 testes passaram** (incluindo 11 novos testes administrativos).
- Novo contrato HTTP administrativo sem banco: **3 testes passaram**.
- Builds de client e server: **passaram**. O Vite emitiu aviso de bundle acima de 500 kB.
- Lint do client: **sem erros**, com 3 avisos preexistentes em RegisterScreen/ItemPicker.
- Formatação dos arquivos TypeScript/CSS alterados: **passou**.
- Testes administrativos com MySQL: **não passaram nesta execução**, pois não havia servidor MySQL em execução (`ECONNREFUSED`, porta 3306). Os 11 cenários de integração precisam ser executados com MySQL configurado, incluindo os 2 novos cenários do detalhe.
- Lint do server: **bloqueado pela ausência preexistente de eslint.config**.
- Formatação global: **não passou**, por diferenças preexistentes em arquivos fora do escopo.

Os testes antigos de navegação foram ajustados para o menu e seletor de itens atuais da equipe, sem voltar ao formulário anterior. Não houve validação visual em navegador real nesta entrega.

Os testes do client usam respostas HTTP simuladas. Os testes `solicitacao.admin.http.test.ts` exercitam Express, JWT, permissões, controller, service e mapeadores com repositories simulados. Eles não substituem os testes com MySQL nem demonstram que o banco local do usuário está configurado.

O comando de formatação global encontrou arquivos preexistentes fora do padrão; foram formatados os arquivos TypeScript/CSS alterados nesta entrega. O lint do servidor já não possui `eslint.config.*` no ZIP recebido. Não foi criada uma configuração geral nem reformatado todo o projeto nesta etapa.

## Levar para o GitHub

Depois de testar, copie para sua pasta de trabalho somente os arquivos listados em `ARQUIVOS_ALTERADOS_COORDENACAO.txt`, preservando os caminhos. Os arquivos novos também precisam ser copiados. Preserve seus `.env` locais e a pasta `.git` do repositório.

No GitHub Desktop, confira a branch e a lista de alterações. Não inclua `.env`, `node_modules` ou `dist`. Faça um commit como `✨ feat: integra pendências e análise da coordenação`, publique a branch e abra um Pull Request. Este ZIP não publica nada automaticamente no GitHub.

## Fora desta etapa

A inclusão de pincel/extensão no seed e a decisão sobre cancelamento de pedidos não fazem parte desta entrega.

Continuam abertas, e as telas mostram os dados como estão:

- `POST /auth/register` cria Coordenador para qualquer e-mail;
- a mesma chave pode ser retirada duas vezes, porque a disponibilidade só compara a janela prevista na mesma data;
- aluno, mesmo sem autorização, consegue pedir material;
- `termo_responsabilidade` nunca é gravado.

Quem confirma retirada e devolução é o Coordenador do CCT (RN09).

Decisões pendentes: se professor pode pedir chave, e OBS01 e OBS02 do plano.

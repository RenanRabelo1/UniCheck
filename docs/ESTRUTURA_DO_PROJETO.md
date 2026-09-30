# Estrutura do Projeto UniCheck

Este documento explica a organização inicial do repositório e a responsabilidade de cada parte do sistema.

## Visão geral da arquitetura

O UniCheck segue uma arquitetura em três camadas:

```text
React (client) -> API REST Node.js (server) -> MySQL
```

- O **client** apresenta as telas, coleta dados e consome a API.
- O **server** aplica regras de negócio, valida permissões e acessa o banco.
- O **MySQL** armazena usuários, solicitações, materiais, chaves e movimentações.

## Estrutura raiz

```text
UniCheck/
├── client/
├── server/
├── docs/
└── README.md
```

| Pasta/arquivo | Responsabilidade |
| --- | --- |
| `client/` | Aplicação web em React. |
| `server/` | API REST em Node.js e regras do sistema. |
| `docs/` | Diagramas, requisitos, protótipos e documentos técnicos. |
| `README.md` | Apresentação resumida do projeto e da estrutura. |

## Front-end: `client/`

O front-end será construído em React. Ele não deve decidir regras críticas sozinho: deve apenas mostrar as opções permitidas e enviar dados para a API, que fará a validação definitiva.

```text
client/
└── src/
    ├── components/
    ├── modules/
    ├── routes/
    └── services/
```

| Pasta | Responsabilidade |
| --- | --- |
| `components/` | Componentes reutilizáveis, como botões, campos, tabelas, modais, cabeçalho e indicadores de status. |
| `modules/` | Funcionalidades organizadas por domínio do sistema. Cada módulo pode conter páginas, componentes, hooks e arquivos de estilo próprios. |
| `routes/` | Rotas da aplicação, proteção de páginas por perfil e redirecionamentos. |
| `services/` | Comunicação com a API, por exemplo autenticação, solicitações, materiais, chaves e histórico. |

### Módulos do front-end

| Módulo | Exemplos de telas e responsabilidades |
| --- | --- |
| `auth/` | Login, sessão, logout e identificação do perfil. |
| `solicitacoes/` | Nova solicitação, termo, minhas solicitações e detalhes da solicitação. |
| `materiais/` | Consulta de disponibilidade de materiais e itens solicitáveis por professores. |
| `chaves/` | Consulta de salas/chaves e solicitação por alunos autorizados. |
| `administrativo/` | Painel do coordenador, análise, retirada, devolução, cadastros, alertas e histórico. |

## Back-end: `server/`

O back-end será uma API REST em Node.js. A organização por módulos evita concentrar todas as regras em arquivos grandes e facilita a divisão do trabalho da equipe.

```text
server/
└── src/
    ├── database/
    ├── middlewares/
    ├── modules/
    └── routes/
```

| Pasta | Responsabilidade |
| --- | --- |
| `database/` | Conexão com MySQL, migrations, seeds e configurações do banco. |
| `middlewares/` | Autenticação, autorização por perfil, tratamento de erros e validações comuns. |
| `modules/` | Regras de negócio separadas por domínio. |
| `routes/` | Registro das rotas de todos os módulos da API. |

### Estrutura recomendada dentro de um módulo

Quando um módulo começar a ser implementado, a estrutura recomendada é:

```text
server/src/modules/solicitacoes/
├── solicitacao.routes.js
├── solicitacao.controller.js
├── solicitacao.service.js
├── solicitacao.repository.js
└── solicitacao.validation.js
```

| Arquivo | Responsabilidade |
| --- | --- |
| `*.routes.js` | Define URL, método HTTP e middlewares da rota. |
| `*.controller.js` | Recebe a requisição HTTP e devolve a resposta. Não deve conter regra complexa. |
| `*.service.js` | Aplica regras de negócio e orquestra operações. |
| `*.repository.js` | Executa consultas SQL e acessa o MySQL. |
| `*.validation.js` | Valida os dados recebidos antes de chamar o service. |

### Módulos do back-end

| Módulo | Responsabilidade |
| --- | --- |
| `auth/` | Login, senha protegida, geração/validação de token e sessão. |
| `usuarios/` | Perfis, permissões, alunos autorizados, projetos e professores responsáveis. |
| `solicitacoes/` | Criação de solicitações, itens, termo de responsabilidade, aprovação e recusa por item. |
| `materiais/` | Cadastro, disponibilidade, estoque, patrimônio e inativação de materiais. |
| `chaves/` | Salas, chaves primárias/secundárias, disponibilidade e inativação. |
| `movimentacoes/` | Retirada, devolução, responsável, horários reais e observações. |
| `alertas/` | Verificação de atrasos às 22:40 e resolução de alertas após devolução. |

## Regras essenciais do domínio

As regras abaixo devem ser aplicadas no `service` do back-end, mesmo que a interface já limite as opções:

- Professor solicita apenas materiais.
- Aluno autorizado solicita apenas chaves.
- Aluno precisa possuir autorização ativa, projeto e professor responsável.
- Coordenador do CCT aprova ou recusa itens individualmente.
- Toda recusa precisa de motivo.
- Retirada exige aceite do termo de responsabilidade.
- Funcionário registra retirada e devolução presencialmente, com data e horário reais.
- A retirada de chave registra qual chave física, primária ou secundária, foi entregue.
- Materiais e chaves são inativados, nunca removidos definitivamente.
- Itens não devolvidos até 22:40 geram alerta de atraso.

## Estados recomendados

Os status devem ser centralizados como constantes ou enums para evitar textos diferentes no sistema.

```text
PENDENTE -> APROVADO -> RESERVADO -> RETIRADO -> DEVOLVIDO
PENDENTE -> RECUSADO
RETIRADO -> ATRASADO
```

Para um material individual ou uma chave, a disponibilidade pode seguir:

```text
DISPONIVEL | RESERVADO | EMPRESTADO | INATIVO
```

## Banco de dados e integridade

O MySQL deve seguir o DER e o MER do projeto. Operações que alteram disponibilidade precisam ser feitas em transação, principalmente:

- aprovação/reserva de um item;
- confirmação de retirada;
- confirmação de devolução;
- atualização de estoque de itens controlados por quantidade.

Isso reduz o risco de dois usuários receberem aprovação para o mesmo recurso.

## Documentação: `docs/`

| Pasta | Conteúdo esperado |
| --- | --- |
| `diagramas/` | DER, MER, diagrama de classes, casos de uso e arquitetura. |
| `requisitos/` | Requisitos funcionais, não funcionais, regras de negócio e decisões do projeto. |
| `prototipos/` | Referências do Figma Make, Stitch, telas e fluxo navegável. |

## Próximos arquivos recomendados

Após a criação da estrutura, os próximos arquivos a serem criados são:

```text
client/package.json
server/package.json
server/src/app.js
server/src/server.js
server/.env.example
server/src/database/connection.js
```

Depois disso, a equipe pode iniciar pelo módulo de autenticação e pelo cadastro básico de materiais, salas e chaves.

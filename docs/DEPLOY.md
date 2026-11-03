# Publicação do UniCheck

O sistema tem três partes, e a Vercel cuida só da primeira:

| Parte | Onde publicar | Observação |
| --- | --- | --- |
| Front-end (`client/`) | Vercel | Site estático gerado pelo Vite. |
| API (`server/`) | Serviço com processo contínuo, como Render ou Railway | O job de atrasos roda a cada minuto, então a API não pode ser serverless. |
| Banco | MySQL 8.0.16+ na nuvem | Precisa aceitar triggers e, para a migration 004, eventos. |

## 1. Banco de dados

1. Crie o banco e anote host, porta, usuário, senha e nome.
2. Confira se o usuário pode criar triggers e eventos. Alguns serviços bloqueiam `CREATE EVENT`, e aí a migration 004 falha. O job da API faz a mesma verificação de atrasos, então a migration pode ser adaptada se isso acontecer.
3. **Não rode o seed em produção.** Ele cria contas de teste com senha conhecida, incluindo a de coordenador.

## 2. API

Configure no serviço de hospedagem:

| Variável | Valor |
| --- | --- |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Segredo longo e aleatório. Sem ele, a API não sobe. |
| `CORS_ORIGIN` | Endereço do front publicado |
| `TRUST_PROXY` | `1`, para o limite de login enxergar o IP real |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Dados do banco |

Comandos, com a raiz do repositório como pasta do serviço:

```bash
npm ci
npm run build --workspace=@unicheck/server
npm run migrate:prod --workspace=@unicheck/server
npm run start --workspace=@unicheck/server
```

Rode `migrate:prod` antes de iniciar a API sempre que houver migration nova. Confira `GET /health`, que deve responder `{"status":"ok"}`.

## 3. Front-end na Vercel

1. Importe o repositório e defina `client` como Root Directory.
2. Framework: Vite. Comando de build: `npm run build`. Saída: `dist`.
3. Configure `VITE_DATA_SOURCE=api` e `VITE_API_URL` com o endereço da API, sem barra no final.

## 4. Conferência final

- O login abre sem a lista de contas de teste.
- Crie a primeira conta de coordenador. O cadastro público aceita esse perfil, e essa limitação é conhecida.
- Faça o fluxo completo: solicitação, aprovação, retirada e devolução.
- Confira que o site e a API usam HTTPS.

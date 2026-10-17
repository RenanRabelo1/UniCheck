# Gargalos, riscos e preocupações

## Críticos

### Persistência divergente da arquitetura documentada

**Severidade: crítica.** `docs/ESTRUTURA_DO_PROJETO.md` e `controle_emprestimos.sql` apontam para MySQL, mas `server/src/config.ts` e `jsonDatabase.ts` usam JSON como banco efetivo. A API não está validando o schema SQL/MER e o comportamento não representa produção. Migrar sem contrato e sem testes de paridade pode quebrar regras de disponibilidade, concorrência e integridade.

**Ação:** decidir oficialmente MySQL ou JSON de protótipo; se MySQL for alvo, implementar adapter/repositories, migrations, seed e testes de integração antes de chamar o sistema de pronto.

### Autenticação e autorização incompletas no front-end

**Severidade: crítica.** `App.tsx` aceita qualquer identificador/senha conforme validação mínima e cria sessão local. `api.ts` só implementa `getJson`; não há login real, armazenamento/renovação de token ou proteção de rotas no client. A existência de `authenticate` no servidor não é suficiente se a UI não o usa.

**Ação:** integrar `/auth`, persistir sessão de forma segura, tratar expiração e aplicar autorização também no servidor para todo endpoint administrativo.

### Tela administrativa ainda baseada em mock

**Severidade: alta.** `AdminDashboard` é uma tela de apresentação; não está ligada às rotas `/admin/*`, aprovação, materiais, salas, chaves ou movimentações. Ações visuais não comprovam alteração de estado.

## Altos

### Navegação concentrada em `App.tsx`

**Severidade: alta.** Login, sessão, roteamento, mapeamento de solicitações e composição de todas as telas vivem em um único arquivo. Isso aumenta regressões e torna difícil aplicar proteção por perfil, URLs compartilháveis e carregamento por rota.

**Ação:** extrair `AuthProvider`, router/páginas e serviços por domínio; manter `App` como composição.

### Contrato client/server não é compartilhado

**Severidade: alta.** Tipos de dashboard e telas são locais, enquanto DTOs, status e erros do backend são definidos separadamente. Mudanças de payload podem compilar em um lado e quebrar no outro.

**Ação:** criar contratos Zod/TypeScript versionados ou gerar tipos a partir de OpenAPI; centralizar enum/status.

### Estado e dados mockados na UI

**Severidade: alta.** `MyRequestsScreen.mock.ts`, `AdminDashboard.mock.ts` e `mapRequestDetails` alimentam o fluxo principal. A confirmação usa `onConfirm={() => Promise.resolve()}` e não cria solicitação no servidor.

**Ação:** substituir mocks por hooks de query/mutation e explicitar estados loading/error/empty.

### Regras críticas dependentes de relógio e job

**Severidade: alta.** Atrasos dependem de `atrasos.job.ts`, horário 22:40 e datas. Não foi encontrado mecanismo documentado de agendamento/observabilidade do job. Timezone e idempotência precisam ser definidos.

## Médios

### CORS, segredos e ambiente

**Severidade: média.** Há fallback de JWT secreto para desenvolvimento e CORS padrão local. Isso é útil para bootstrap, mas perigoso se ambiente for promovido sem configuração. Não há documentação de `.env` do servidor equivalente ao `client/.env.example`.

### SQL/MER e código podem divergir

**Severidade: média.** O arquivo SQL está na raiz, enquanto a documentação espera migrations em `server/src/database`; não há gate que compare schema, migrations e tipos. Alterações no MER podem não chegar à API.

### Testes de fluxo insuficientes

**Severidade: média.** Há bons testes isolados de regras, mas pouca prova de ponta a ponta. A tela pode passar e continuar sem persistir ou sem respeitar autorização real.

### Artefatos e documentação dispersos

**Severidade: média.** Protótipos, PDF, SQL e notas ficam em locais diferentes; `README.md` ainda é mínimo. O novo `.specs/` precisa virar a fonte operacional, com estado e roadmap atualizados.

## Gargalos de execução

- Falta de decisão de persistência bloqueia integração confiável e deploy.
- Falta de contrato de autenticação bloqueia qualquer tela funcional além do mock.
- Falta de router e camada de dados do client faz cada nova tela aumentar o acoplamento em `App.tsx`.
- Falta de testes HTTP/E2E permite regressões silenciosas nas operações administrativas.

## Ordem recomendada

1. Fixar stack de persistência e contrato de autenticação.
2. Integrar client com API e remover mocks do fluxo principal.
3. Extrair roteamento, sessão e contratos compartilhados.
4. Criar testes HTTP/E2E dos fluxos de solicitação e movimentação.
5. Só depois ampliar telas administrativas e polimento visual.

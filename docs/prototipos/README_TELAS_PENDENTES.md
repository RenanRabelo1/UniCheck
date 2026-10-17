# UniCheck — Telas pendentes do protótipo

Este documento delimita as telas administrativas que ainda não possuem uma
implementação visual navegável no cliente. Ele não altera contratos da API,
autenticação, persistência JSON ou a futura migração para MySQL.

## Fonte e critério de comparação

- **Protótipo mais recente:** `../../codigosstitch2/todos2.txt`, exportado em
  26/09/2026 às 09:14.
- **Referência anterior:** arquivos individuais em `../../codigosstitch/`.
- **Base comparada:** `client/src/app/AppShell.tsx` e os componentes atuais do
  cliente, em 16/10/2026.

O export recente possui 16 documentos HTML. Sete já têm equivalente visual no
cliente: login, painel do usuário, nova solicitação, confirmação, minhas
solicitações, detalhes da solicitação e painel administrativo. As nove telas
abaixo ainda precisam ser construídas. Ter componentes de fluxo com dados mock
não significa que o fluxo esteja integrado ao servidor.

## Prioridade

| Tela | Urgente? | Impacto alto? | Ação |
|---|---:|---:|---|
| Solicitações pendentes e análise | Sim | Sim | Fazer primeiro |
| Retirada e devolução presencial | Sim | Sim | Fazer após a análise |
| Alertas de atraso | Não | Alto | Fazer depois das operações presenciais |
| Materiais, salas/chaves e autorizações | Não | Alto | Fazer como módulo de cadastros |
| Histórico de movimentações | Não | Médio | Fazer por último; depende dos filtros dos módulos anteriores |

## 1. Solicitações pendentes

- **Protótipo:** documento HTML 08 — `Solicitações pendentes`.
- **Objetivo:** permitir à coordenação localizar solicitações que aguardam
  parecer e abrir a análise de uma delas.
- **Elementos obrigatórios:** navegação administrativa, busca, período
  (hoje, últimos 7 dias, mês e personalizado), filtros, limpeza dos filtros,
  lista paginada e ação **Analisar solicitação**.
- **Estados visuais:** carregando, lista vazia, resultado filtrado e erro de
  carregamento. Nesta rodada, usar dados mock explícitos.
- **Saída de navegação:** abre a tela **Análise da solicitação** com o
  identificador selecionado.

## 2. Análise da solicitação

- **Protótipo:** documento HTML 09 — `Análise da solicitação #CCT-2026-0148`.
- **Objetivo:** exibir a solicitação e permitir parecer individual por item.
- **Elementos obrigatórios:** retorno para pendências, identificação do
  solicitante, itens e disponibilidade, ações por item **Aprovar** e
  **Recusar**, motivo obrigatório para recusa, resumo do parecer e ação
  **Concluir Análise e Emitir Parecer Oficial**.
- **Regra de domínio a preservar:** uma solicitação pode ter itens aprovados e
  recusados; a recusa exige motivo. O parecer não pode simular alteração
  permanente enquanto o módulo estiver em modo visual.
- **Saída de navegação:** retorna à lista de pendências; itens aprovados
  aparecem somente no mock de retirada após a confirmação visual.

## 3. Retirada presencial de materiais e chaves

- **Protótipo:** documento HTML 10 — `Retirada presencial de materiais e
  chaves`.
- **Objetivo:** registrar visualmente a transferência de custódia de itens
  aprovados.
- **Elementos obrigatórios:** busca de solicitações aprovadas, dossiê do
  solicitante, seleção dos itens, aceite do termo, identificação do
  coordenador, data/hora e ação **Confirmar Retirada e Transferir Custódia**.
- **Regra de domínio a preservar:** retirada exige aceite do termo e registra
  data/hora real; só itens aprovados podem seguir para retirada.
- **Saída de navegação:** confirmação de protocolo e retorno ao painel ou às
  operações. A gravação real será adicionada apenas quando o contrato da API
  for aprovado.

## 4. Devolução presencial e conferência de custódia

- **Protótipo:** documento HTML 11 — `Devolução presencial e conferência de
  custódia`.
- **Objetivo:** receber itens em posse, registrar a conferência e encerrar a
  custódia visualmente.
- **Elementos obrigatórios:** busca de itens em posse, dossiê do solicitante,
  checklist por item, registro de condição, termo de homologação, data/hora e
  ação **Confirmar Devolução e Baixar Custódia**.
- **Regra de domínio a preservar:** a devolução não pode preceder a retirada;
  deve registrar condição e horário de devolução.
- **Saída de navegação:** confirmação de baixa e retorno às operações, sem
  escrita no banco nesta etapa.

## 5. Alertas de atraso

- **Protótipo:** documento HTML 12 — `Alertas de atraso`.
- **Objetivo:** concentrar itens não devolvidos dentro do prazo e orientar a
  regularização.
- **Elementos obrigatórios:** cartões-resumo, filtros por período, tipo e
  vínculo, limpeza de filtros, leitor de código, ação de registrar devolução,
  exportação do termo e disparo de lembrete coletivo como controles visuais.
- **Regra de domínio a preservar:** atraso é gerado para item não devolvido
  até 22:40. Disparos e exportações não podem ser declarados funcionais sem
  backend e serviço de geração correspondentes.

## 6. Gerenciamento de materiais

- **Protótipo:** documento HTML 13 — `Gerenciamento de materiais`.
- **Objetivo:** consultar, cadastrar, filtrar e inativar materiais.
- **Elementos obrigatórios:** cadastro, filtros avançados, filtros por
  categoria e modalidade de controle (individual ou por quantidade), lista de
  inventário, detalhes e confirmação de inativação.
- **Regra de domínio a preservar:** material com histórico é inativado, nunca
  excluído. O estado de inativação será mockado até existir contrato de
  inventário.

## 7. Gerenciamento de salas e chaves

- **Protótipo:** documento HTML 14 — `Gerenciamento de salas e chaves`.
- **Objetivo:** administrar salas, catálogo de chaves físicas e situação do
  claviculário.
- **Elementos obrigatórios:** visão por salas, catálogo de chaves, criação de
  sala, cadastro de chave física, detalhes da sala, situação/ação da chave e
  atalho para retiradas.
- **Regra de domínio a preservar:** alunos autorizados solicitam apenas chaves
  vinculadas a projetos e salas permitidos; chaves com histórico não devem ser
  apagadas.

## 8. Alunos autorizados e projetos

- **Protótipo:** documento HTML 15 — `Alunos autorizados e projetos`.
- **Objetivo:** manter visualmente projetos ativos e as autorizações de alunos
  vinculadas a eles.
- **Elementos obrigatórios:** totais de alunos e projetos, cadastro de projeto,
  nova autorização, filtros, histórico, edição, inativação e reativação.
- **Regra de domínio a preservar:** o aluno só pode solicitar chave quando tem
  autorização ativa, projeto ativo e professor responsável ativo. As ações de
  cadastro permanecem em mock até a integração de API.

## 9. Histórico de movimentações

- **Protótipo:** documento HTML 16 — `Histórico de movimentações`.
- **Objetivo:** oferecer auditoria consultável das operações de solicitação,
  retirada, devolução, atraso e administração.
- **Elementos obrigatórios:** filtros parametrizados, períodos rápidos,
  aplicação e limpeza de filtros, lista de ocorrências, abertura do dossiê e
  controles de impressão/exportação apresentados como visuais.
- **Regra de domínio a preservar:** histórico não é apagado; exclusão de
  materiais ou chaves deve ser representada como inativação.

## Diretriz de implementação

1. Criar componentes de tela e mocks isolados, seguindo a separação atual em
   `components/`, `app/` e `modules/`.
2. Conectar a navegação ao `AppShell` por callbacks e estado local enquanto
   não houver rotas e contratos de API aprovados.
3. Reutilizar a navegação administrativa já exibida em `AdminDashboard`, sem
   duplicar regras de autorização em componentes visuais.
4. Marcar botões que dependem de persistência, e-mail, PDF ou impressão como
   demonstrativos até haver serviço implementado e testado.
5. Validar cada tela em viewport desktop e mobile, além de lint, testes e build
   do workspace do cliente antes de considerá-la concluída.

## Fora deste README

- Autenticação real, JWT, controle de acesso no servidor e rotas protegidas.
- Escrita em `server/data/db.json`, integração com endpoints ou migração MySQL.
- Envio de lembretes, geração de PDF/CSV e impressão funcional.

## Para registrar

**Contexto:** O export mais novo do Figma reúne 16 telas, enquanto o cliente
possui equivalentes visuais para sete delas.

**Decisão:** Documentar as nove telas restantes em ordem operacional, usando o
export de `codigosstitch2` como referência visual e as regras já verificadas no
projeto como limite de comportamento.

**Justificativa:** A implementação pode avançar por módulos sem inventar
contratos de API ou contradizer as regras de empréstimo.

**Trade-offs aceitos:** O README descreve componentes e estados mockados, não
uma integração funcional de persistência, notificações ou exportações.

**Revisar em:** Quando o contrato de API e a estratégia de persistência forem
aprovados para a próxima etapa.

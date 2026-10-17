# STATE — UniCheck
Atualizado em: 2026-10-15

## Decisões técnicas

| Data | Decisão | Justificativa | Trade-off | Revisar em |
|------|---------|---------------|-----------|------------|
| 2026-10-15 | Priorizar contrato de autenticação/API e persistência antes de ampliar telas | Decisão inicial da auditoria | Decisão substituída pelo operador em 2026-10-16 | Registro histórico |
| 2026-10-15 | Tratar MySQL como decisão pendente, não como fato da implementação | A documentação e o SQL apontam MySQL, mas o runtime atual usa `jsonDatabase.ts` | Manter o protótipo executável em JSON enquanto se define e testa a migração | Antes de qualquer deploy ou integração multiusuário |
| 2026-10-16 | Manter JSON como persistência do protótipo | O foco da etapa é finalizar o front-end visual; MySQL será implementado posteriormente | Sem garantias de produção, concorrência ou migrations nesta etapa | Antes da integração multiusuário ou deploy |
| 2026-10-16 | Adiar autenticação real do frontend até a API estar pronta | Evita acoplar telas visuais a contratos ainda não consolidados | Login demonstrativo não valida sessão, token ou permissões reais | Quando o contrato de autenticação da API for aprovado |
| 2026-10-16 | Modularizar o front-end visual em chats independentes | `App.tsx` concentra responsabilidades e a equipe precisa trabalhar por fronteiras claras | Integração entre módulos fica dependente do shell e será feita por etapas | Ao concluir os quatro módulos da rodada |
| 2026-10-16 | Executar as telas 08–16 em worktrees isoladas, com máximo de cinco agentes ativos | Evita conflitos em componentes e arquivos compartilhados enquanto respeita o fluxo operacional do protótipo | Integração fica concentrada no chat coordenador ao fim do lote | Após validação integrada do front-end |
| 2026-10-16 | Reescrever `AGENTS.md` a partir do runtime verificado | O guia anterior misturava a arquitetura MySQL planejada com a persistência JSON em execução | O guia não antecipa garantias de produção enquanto a migração MySQL não existir | Quando MySQL, migrations e repositories SQL forem testados |
| 2026-10-16 | Usar `codigosstitch2/todos2.txt` como referência visual das telas pendentes | É o export de protótipo mais recente disponível no projeto e reúne as 16 telas | O README descreve somente o comportamento visual/mock, não contratos de integração | Quando API, persistência ou protótipo forem revisados |
| 2026-10-17 | Criar um módulo visual isolado de materiais para professor | A solicitação do professor ainda apresenta apenas opções estáticas, sem catálogo ou disponibilidade visual | A integração com `NewRequestScreen` fica para o coordenador; não haverá reserva real | Ao consolidar o fluxo visual do professor |

## Bloqueios ativos

| ID | Bloqueio | Impacto | Responsável | Status |
|----|---------|---------|-------------|--------|
| B01 | Frontend não usa `/auth/login` nem persiste sessão real | Integração funcional adiada por decisão | Equipe UniCheck | Adiado conscientemente |
| B02 | Telas de solicitação/admin usam mocks e `onConfirm` não grava no servidor | Iteração atual é visual e demonstrativa | Equipe UniCheck | Adiado conscientemente |
| B03 | Persistência de produção não está definida entre JSON e MySQL | JSON foi aceito somente para o protótipo | Equipe UniCheck | Adiado conscientemente |
| B04 | `App.tsx` concentra shell, sessão e navegação | Dificulta evolução paralela dos módulos visuais | Equipe UniCheck | Aberto nesta rodada |
| B05 | Documentação descrevia MySQL/auth como runtime atual | O alinhamento documental separou JSON/mocks atuais do roadmap de API e MySQL | Equipe UniCheck | Concluído em 2026-10-16 |

## Lições aprendidas

- 2026-10-15 — A documentação inicial descreve uma arquitetura MySQL, mas o código executado usa JSON; toda análise deve distinguir arquitetura planejada de runtime verificado.
- 2026-10-15 — Telas visuais e endpoints existentes não comprovam integração; cada fluxo precisa de teste HTTP e prova de persistência.

## Deferred ideas

- Integração real de autenticação — motivo: aguardar API pronta.
- MySQL e migrations — motivo: JSON foi aceito para protótipo nesta fase.
- Integração de solicitações/administração com API — motivo: concluir front-end visual primeiro.

## Preferências do operador

- Responder em português brasileiro.
- Usar commits focados seguindo `iuricode/padroes-de-commits`.
- Trabalhar em branches de feature e confirmar testes antes de publicar.

## Sessão atual

**Última atividade:** 2026-10-16
**Feature concluída:** catálogo visual de materiais do professor
**Decisão registrada:** o catálogo foi criado como módulo com mocks locais e integrado ao formulário de nova solicitação apenas como seleção demonstrativa.
**Validação:** lint e build do cliente passaram; a suíte passou com pool de threads por limitação do pool padrão no sandbox.
**Próxima ação:** confirmar visualmente no navegador local quando o ambiente permitir e só então considerar persistência/API.
# Checkpoint — entrada do catálogo pelo painel do professor (2026-10-17)

- Decisão: conectar o item existente **Materiais** à view isolada do catálogo visual via estado local do `AppShell`.
- Limites: manter mocks; não introduzir API, persistência, autenticação real ou alteração dos fluxos de aluno/admin.
- Próxima validação: teste do fluxo professor → materiais → voltar, lint, testes e build do client.

## Resultado da validação

- Fluxo coberto: login de professor → **Materiais** → catálogo → **Voltar ao painel**.
- Gate do client aprovado em 2026-10-17: Vitest (9 testes), ESLint e build Vite.
- Observação: a suíte raiz inclui testes do servidor fora deste escopo e falhou no ambiente; nenhuma alteração de servidor foi feita nesta feature.

# Fluxo Visual de Solicitações

## Contexto

O protótipo já possui telas para nova solicitação, confirmação, minhas solicitações e detalhes. Elas devem formar uma jornada visual consistente usando mocks explícitos até a integração futura da API.

## Problema real

As telas existem, mas precisam ser tratadas como um módulo coeso e autônomo, sem colocar lógica adicional no `App.tsx` ou simular persistência.

## Requisitos

| ID | Requisito | Prioridade | Notas |
|---|---|---|---|
| RF-01 | Manter a jornada visual criar → revisar → confirmar → listar → detalhar | Must | Callbacks locais já previstos pelo shell |
| RF-02 | Preservar mocks explícitos e tipos no módulo | Must | Não chamar API |
| RF-03 | Garantir estados visuais de status, itens e linha do tempo | Must | Pendente, aprovado, recusado, retirado e devolvido quando previstos |
| RF-04 | Tornar CSS e componentes do fluxo consistentes e responsivos | Should | Sem alterar design global sem necessidade |
| RF-05 | Documentar o ponto de futura integração com API | Should | Sem implementar a integração |

## Fora do escopo

- POST/GET reais, persistência JSON, JWT, validações no servidor e MySQL.
- Edição de `client/src/App.tsx` ou do painel administrativo.
- Redesenho global do projeto.

## Critérios de aceite

- [ ] Os quatro passos possuem navegação visual coerente por callbacks.
- [ ] Não há `fetch` adicionado nem chamadas ao servidor.
- [ ] Dados mockados permanecem identificáveis em `*.mock.ts`.
- [ ] Build do cliente passa.

## Dependências

- O módulo `frontend-shell` define o ponto final de integração em `App.tsx`.

## Riscos identificados

- Alterar `App.tsx` cria conflito com o módulo shell; é proibido neste módulo.

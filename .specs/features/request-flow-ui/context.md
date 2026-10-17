# Contexto de integração futura — fluxo de solicitações

## Estado desta rodada

As telas `NewRequestScreen`, `RequestConfirmationScreen`,
`MyRequestsScreen` e `RequestDetailsScreen` permanecem uma demonstração
visual. Elas recebem dados e navegam somente por callbacks definidos pelo shell;
nenhuma tela chama `fetch`, grava no runtime JSON ou lê JWT.

Os fixtures estão identificados em `*.mock.ts` e os formatos compartilhados do
fluxo em `RequestFlow.types.ts`. O mock de detalhes apresenta cada estado de
item previsto pela interface: pendente, aprovado, recusado, retirado e devolvido.

## Contrato a definir antes da API

1. O shell deverá substituir os callbacks demonstrativos por um serviço do
   cliente, sem colocar chamadas HTTP nos componentes.
2. A criação precisará devolver um protocolo e itens com status inicial
   `PENDENTE`; a confirmação visual não deve presumir persistência até esse
   contrato existir.
3. A listagem deve fornecer protocolo, período, destino, horário, instrução e
   status resumido; o detalhe deve fornecer itens, motivo de recusa,
   retirada/devolução e linha do tempo.
4. A autorização e a disponibilidade continuam sendo validadas pelo servidor.
   Os filtros e avisos desta UI são apenas apresentação.

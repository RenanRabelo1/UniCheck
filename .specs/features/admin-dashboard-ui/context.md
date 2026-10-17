# Contexto de integração futura — Painel administrativo

## Limite desta rodada

O painel é exclusivamente demonstrativo: indicadores, filas, ocupação e solicitações recentes são mocks co-localizados. As interações apenas notificam o usuário e podem delegar navegação visual ao shell; elas não aprovam, recusam, registram retirada/devolução, consultam API nem persistem dados.

## Pontos que dependem da API

- Carregar indicadores operacionais, disponibilidade, ocupação e solicitações recentes para a sessão autenticada.
- Pesquisar por matrícula, protocolo, patrimônio e código de chave.
- Exibir o detalhe de uma solicitação e permitir analisar seus itens com motivo obrigatório de recusa.
- Registrar retirada e devolução presenciais, incluindo termo de responsabilidade, condição e horários reais.
- Consultar inventário, usuários autorizados e relatórios com autorização aplicada pelo servidor.

## Contrato a decidir antes da integração

O shell deve substituir os callbacks visuais por navegação/serviços apenas após a definição do contrato HTTP, autenticação e autorização por perfil. O servidor permanece a autoridade para disponibilidade, transições de status e persistência; nenhum desses critérios deve ser inferido a partir dos mocks desta tela.

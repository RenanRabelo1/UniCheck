# Entrada do catálogo de materiais pelo painel do professor

## Contexto

No painel do professor, o item **Materiais** da navegação superior é uma âncora para `#materiais`, mas não existe uma seção correspondente. O catálogo visual já existe e é usado dentro da nova solicitação, porém não possui uma entrada direta no painel.

## Requisitos

- **R01 — Navegação funcional (Must):** ao selecionar **Materiais** no cabeçalho do painel do professor, a aplicação deve abrir o catálogo de materiais.
- **R02 — Retorno (Must):** o catálogo aberto pelo painel deve oferecer um caminho claro para retornar ao painel do professor.
- **R03 — Isolamento de papel (Must):** essa entrada direta deve ser exclusiva do fluxo de professor; o painel do aluno e as telas administrativas não devem mudar.
- **R04 — Limite de protótipo (Must):** o catálogo continua usando mocks e não executa API, persistência, autenticação real ou reserva de material.

## Critérios de aceite

1. Após login como professor, clicar em **Materiais** exibe o título do catálogo de materiais.
2. O botão de retorno restaura o painel do professor.
3. O fluxo existente de nova solicitação, minhas solicitações e logout continua acessível.
4. Lint, testes do client e build do client passam.

## Fora do escopo

- Criar ou alterar endpoints, banco de dados, JSON de runtime ou contratos.
- Implementar reserva, disponibilidade em tempo real ou persistência de seleção.
- Alterar navegação administrativa ou do aluno.

## Dependências e riscos

- Depende de `AppShell` e do catálogo visual já existente.
- `AppShell` já está em alteração local não relacionada; a integração deve ser mínima e preservar essas mudanças.

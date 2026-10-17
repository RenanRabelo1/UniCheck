# Materiais do professor

## Contexto

A tela de nova solicitação do professor oferece apenas uma lista estática de opções. Não há uma área visual para consultar materiais, disponibilidade ou escolher a quantidade antes da solicitação demonstrativa.

## Requisitos obrigatórios

| ID | Requisito | Critério de aceite |
|---|---|---|
| PM-01 | Exibir catálogo demonstrativo de materiais acadêmicos | Há ao menos quatro materiais com nome, categoria, identificação, disponibilidade e situação visual. |
| PM-02 | Permitir busca e filtro local | A busca e o filtro alteram somente os itens exibidos, sem chamadas HTTP. |
| PM-03 | Permitir seleção local de um material e quantidade válida | A quantidade fica entre 1 e a disponibilidade demonstrativa; nenhuma reserva é registrada. |
| PM-04 | Tornar o caráter visual explícito | A tela informa que disponibilidade, seleção e ações são demonstrativas e não persistem dados. |
| PM-05 | Ser responsiva e acessível | Controles possuem rótulos, feedback local e layout utilizável em larguras desktop e mobile. |

## Fora de escopo

- Integração com API, JSON ou banco de dados.
- Autenticação, autorização ou regras reais de disponibilidade.
- Alteração da navegação, `AppShell`, `NewRequestScreen` ou contratos existentes pelo chat do módulo.
- Reserva, confirmação, PDF, e-mail, CSV ou impressão reais.

## Dependências e risco

- O módulo será integrado posteriormente pelo chat coordenador ao fluxo de nova solicitação.
- Os dados devem ser mocks locais e substituíveis; não podem duplicar regras de domínio no componente.

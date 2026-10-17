# Frontend Shell e Navegação Demonstrativa

## Contexto

`client/src/App.tsx` concentra login demonstrativo, sessão, escolha de tela, dados de sessão e composição de dashboards. Isso dificulta o crescimento das telas visuais.

## Problema real

O front-end não tem uma fronteira clara entre shell, navegação e módulos visuais. A correção é estrutural; não inclui autenticação real nem chamadas de API.

## Requisitos

| ID | Requisito | Prioridade | Notas |
|---|---|---|---|
| FS-01 | Extrair tipos e estado de sessão demonstrativa do `App.tsx` | Must | Sem token, fetch ou JWT |
| FS-02 | Criar uma camada de navegação visual com views tipadas | Must | Pode permanecer sem React Router nesta rodada |
| FS-03 | Manter os três perfis demonstrativos e logout atuais | Must | Professor, aluno e coordenador |
| FS-04 | Manter compatibilidade de props para as telas existentes | Must | Não alterar seus arquivos sem necessidade |
| FS-05 | Cobrir a abertura do dashboard e navegação essencial com testes | Should | Adaptar `App.test.tsx` |

## Fora do escopo

- Login real, JWT, rotas protegidas reais e integração HTTP.
- Alterar componentes internos dos módulos de solicitação e administração.
- Modificar servidor ou banco.

## Critérios de aceite

- [ ] `App.tsx` atua como composição e não contém toda a lógica de tela/sessão.
- [ ] Professor, aluno e coordenador chegam às telas demonstrativas previstas.
- [ ] Logout retorna ao login demonstrativo.
- [ ] O build do cliente passa.

## Dependências

Nenhuma. Este módulo fornece o ponto de integração para os módulos visuais.

## Riscos identificados

- Conflito em `App.tsx` se outro módulo o editar. Os demais módulos não podem modificá-lo.

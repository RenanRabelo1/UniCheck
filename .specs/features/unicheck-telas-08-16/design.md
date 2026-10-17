# Design — Lote visual de telas administrativas

## Decisão

Cada tela vive em `client/src/modules/admin/<modulo>/`, contendo componente, tipos, mocks, CSS e README. Os módulos não importam nem alteram navegação compartilhada. O coordenador integra todos depois, por imports e callbacks locais no `AppShell`.

## Fluxo de dados

```text
mocks locais -> componente de tela -> callback tipado -> AppShell (integração posterior)
```

Nenhum módulo lê ou grava API, JSON, token ou banco. Controles que dependem de serviço externo exibem estado demonstrativo explícito.

## Integração

- O `AppShell` será alterado somente após B08–B16 estarem disponíveis.
- A integração adiciona views e callbacks locais para o perfil de coordenador.
- Nenhum módulo pode editar `AppShell`, `navigation.ts` ou CSS global.

## Responsividade e acessibilidade

- Layout sem rolagem horizontal em mobile.
- Rótulos visíveis em campos; estados não dependem só de cor.
- Botões demonstrativos devem ser identificáveis e acessíveis por teclado.

## Rollback

Cada tela é um commit independente em branch isolada. Um módulo com defeito pode ser removido da integração sem afetar os demais.

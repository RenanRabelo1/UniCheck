---
name: git-web
description: Publica alterações web do UniCheck com commit semântico, push, Pull Request e documentação estritamente necessária. Use quando o usuário pedir para preparar ou concluir esse fluxo Git.
---

# Git Web

Use esta skill para publicar uma alteração do UniCheck. O resultado é um commit
focado, enviado em uma branch de trabalho e, quando solicitado, uma Pull Request
com descrição objetiva.

## Limites e autorização

- Commit, push e criação/alteração de Pull Request são ações externas: execute
  cada uma somente quando o usuário tiver autorizado essa etapa.
- Não faça `push --force`, `reset --hard`, `checkout --`, remoções amplas ou
  `git add .` para resolver uma árvore suja.
- Não inclua arquivos não relacionados, segredos, `.env`, `server/data/db.json`,
  artefatos de build ou trabalho de outro módulo.
- Não envie diretamente para `main`.

## Branch de trabalho

1. Inspecione `git status --short --branch`, a branch atual e o remoto antes de
   preparar o commit.
2. Se a branch atual for `main`, crie e troque para uma branch específica da
   alteração antes de qualquer commit. Use o formato
   `<tipo>/<slug-da-alteracao>`, por exemplo `feat/catalogo-materiais` ou
   `fix/navegacao-professor`. Se o usuário informar um nome de branch, preserve-o.
3. Se já estiver em uma branch de feature, mantenha-a, salvo instrução contrária
   do usuário. Não troque de branch se houver mudanças que seriam colocadas em
   risco; explique o bloqueio.

## Preparação e validação

1. Leia `agents.md` e as instruções do módulo afetado antes de editar ou
   publicar.
2. Revise o diff e selecione arquivos explicitamente para o stage. Em árvore
   compartilhada ou suja, preserve alterações alheias e pare se a separação não
   puder ser feita com segurança.
3. Rode a menor validação relevante ao escopo (por exemplo, testes, lint e build
   do workspace `client` para uma tela). Relate falhas preexistentes ou fora do
   escopo sem tentar mascará-las.
4. Atualize documentação somente quando a alteração modificar um comando,
   arquitetura, contrato, regra de domínio ou fluxo que já esteja documentado.
   Não crie documentação apenas para acompanhar um commit visual isolado.

## Mensagem de commit

Use o padrão `<emoji> <tipo>: <descrição curta no imperativo>` em português. A
descrição deve ser específica e representar apenas o conteúdo staged.

Escolha o tipo conforme a intenção:

- `feat` para recurso novo; `fix` para correção; `docs` para documentação;
  `test` para testes; `build` para dependências/build; `style` para formatação;
  `refactor` para reorganização sem alteração funcional; `chore` para manutenção;
  `ci` para integração contínua; `perf` para desempenho; `raw` para dados;
  `cleanup` para limpeza; `remove` para remoção.
- Use o emoji coerente: `✨ feat`, `🐛 fix`, `📚 docs`, `🧪 test`, `📦 build`,
  `💄 style`, `♻️ refactor`, `🔧 chore`, `🧱 ci`, `⚡ perf`, `🗃️ raw`,
  `🧹 cleanup`, `🗑️ remove`.

Prefira commits pequenos e coesos. Separe documentação ou testes independentes
quando isso tornar o histórico mais claro; não fragmente uma única correção que
precisa dos seus testes para funcionar.

## Push e Pull Request

1. Antes do push, confira o commit com `git show --stat --oneline HEAD` e o
   status limpo para os arquivos que fazem parte daquele commit.
2. Faça push normal com upstream quando necessário. Nunca substitua histórico
   remoto sem autorização explícita e sem `--force-with-lease` justificado.
3. Quando o usuário pedir uma PR, use a branch de trabalho contra `main` (ou a
   base indicada). O título deve refletir o commit principal.
4. Escreva a PR em português com: resumo, arquivos/áreas afetadas, validações
   executadas e limitações conhecidas. Não alegue validação visual, API ou dados
   reais sem evidência.

## Encerramento

Informe a branch, hash e mensagem do commit, resultado do push, URL da PR quando
existir, validações realizadas e qualquer item que tenha ficado propositalmente
fora do escopo.

## Referência

As categorias, a estrutura semântica e os emojis desta skill são um resumo
adaptado de [Padrões de commits, por iuricode](https://github.com/iuricode/padroes-de-commits).

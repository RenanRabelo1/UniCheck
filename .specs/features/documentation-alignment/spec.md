# Alinhamento da Documentação ao Protótipo JSON

## Contexto

O projeto documenta MySQL e autenticação/API como se já fossem runtime ativo, mas o protótipo atual usa JSON e front-end demonstrativo. O usuário decidiu manter JSON e telas visuais nesta rodada.

## Problema real

Documentação inconsistente gera implementação errada, especialmente para novos chats e colaboradores.

## Requisitos

| ID | Requisito | Prioridade | Notas |
|---|---|---|---|
| DA-01 | Corrigir documentos gerais para declarar JSON como persistência atual de protótipo | Must | MySQL segue como roadmap futuro |
| DA-02 | Declarar autenticação do frontend como integração adiada | Must | Backend existente não deve ser apresentado como integrado |
| DA-03 | Corrigir nomes de variáveis efetivamente usados, incluindo `CORS_ORIGIN` | Must | Não expor segredos |
| DA-04 | Remover ou marcar comandos e arquivos inexistentes como planejados | Must | Ex.: migrations não implementadas |
| DA-05 | Preservar regras de domínio como visão futura sem declarar implementação pronta | Should | Distinguir planejado de verificado |

## Fora do escopo

- Alterar código de runtime, scripts, endpoints, banco ou dependências.
- Criar migrations ou integração de API.
- Editar documentação de módulos de outros chats.

## Critérios de aceite

- [ ] `agents.md` e documentos afetados distinguem runtime atual de roadmap.
- [ ] Nenhuma instrução manda executar migration inexistente como fluxo atual.
- [ ] Variáveis documentadas correspondem ao código verificado.
- [ ] Mudanças permanecem apenas documentais.

## Dependências

Consultar somente a documentação geral permitida e os arquivos de configuração/código necessários para verificar os fatos documentados.

## Riscos identificados

- Apagar regras de domínio úteis em vez de classificá-las como futuras; preservar a intenção e corrigir o status de implementação.

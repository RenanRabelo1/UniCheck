-- Migration 007: tokens encerrados pelo botão "Sair" (RF24.2).
-- O JWT não tem como ser apagado; o servidor guarda o id dele até a data em que expiraria sozinho.

CREATE TABLE sessao_revogada (
    jti CHAR(36) PRIMARY KEY,
    expira_em DATETIME NOT NULL
) ENGINE=InnoDB;

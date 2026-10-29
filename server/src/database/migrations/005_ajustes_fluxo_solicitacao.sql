-- Migration 005: colunas que o fluxo de solicitações precisa e o MER inicial não tinha.
--  * material.detalhe: patrimônio, bancada... (texto livre exibido na tela)
--  * solicitacao.id_sala: a sala escolhida (local_utilizacao guarda só o texto exibido)
--  * item_solicitado: nome/detalhe do item no momento do pedido (o histórico não muda se o cadastro for
--    renomeado), data da última mudança de status e os status RESERVADO e ATRASADO
--  * movimentacao.responsavel: quem de fato retirou ou devolveu o item

ALTER TABLE material
    ADD COLUMN detalhe VARCHAR(100) NULL;

ALTER TABLE solicitacao
    ADD COLUMN id_sala BIGINT UNSIGNED NOT NULL,
    ADD CONSTRAINT fk_solicitacao_sala FOREIGN KEY (id_sala) REFERENCES sala (id_sala);

ALTER TABLE item_solicitado
    MODIFY status_item ENUM('PENDENTE', 'APROVADO', 'RESERVADO', 'RECUSADO', 'RETIRADO', 'ATRASADO', 'DEVOLVIDO', 'CANCELADO')
        NOT NULL DEFAULT 'PENDENTE',
    ADD COLUMN nome_item VARCHAR(150) NOT NULL,
    ADD COLUMN detalhe_item VARCHAR(100) NULL,
    ADD COLUMN data_hora_atualizacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE movimentacao
    ADD COLUMN responsavel VARCHAR(150) NULL;

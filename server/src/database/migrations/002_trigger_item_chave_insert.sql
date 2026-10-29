-- Migration 002: trigger que impede aluno sem autorização ativa de pedir chave (INSERT).
-- Sem DELIMITER: o runMigrations envia o arquivo inteiro como uma instrução só.

CREATE TRIGGER trg_item_chave_autorizacao_bi
BEFORE INSERT ON item_solicitado
FOR EACH ROW
BEGIN
    DECLARE aluno_solicitante BIGINT UNSIGNED;
    DECLARE possui_autorizacao BOOLEAN;

    IF NEW.id_chave IS NOT NULL THEN
        SELECT a.id_aluno INTO aluno_solicitante
        FROM solicitacao s
        LEFT JOIN aluno a ON a.id_aluno = s.id_usuario_solicitante
        WHERE s.id_solicitacao = NEW.id_solicitacao;

        IF aluno_solicitante IS NOT NULL THEN
            SELECT EXISTS (
                SELECT 1 FROM autorizacao au
                WHERE au.id_aluno = aluno_solicitante AND au.status = 'ATIVA'
            ) INTO possui_autorizacao;

            IF possui_autorizacao = FALSE THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Aluno sem autorizacao ativa nao pode solicitar chave.';
            END IF;
        END IF;
    END IF;
END

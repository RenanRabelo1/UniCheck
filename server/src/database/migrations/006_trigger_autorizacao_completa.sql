-- Migration 006: a autorização do aluno passa a exigir projeto e professor ativos (RN02, RN23).
-- O trigger de UPDATE passa a valer só na aprovação ou na troca da chave: antes ele disparava em
-- qualquer alteração do item, e revogar a autorização impediria devolver a chave que está em posse.

DROP TRIGGER trg_item_chave_autorizacao_bi;
DROP TRIGGER trg_item_chave_autorizacao_bu;

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
                JOIN projeto p ON p.id_projeto = au.id_projeto
                JOIN usuario prof ON prof.id_usuario = p.id_professor
                WHERE au.id_aluno = aluno_solicitante AND au.status = 'ATIVA'
                  AND p.status = 'ATIVO' AND prof.status = 'ATIVO'
            ) INTO possui_autorizacao;

            IF possui_autorizacao = FALSE THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Aluno sem autorizacao ativa nao pode solicitar chave.';
            END IF;
        END IF;
    END IF;
END;

CREATE TRIGGER trg_item_chave_autorizacao_bu
BEFORE UPDATE ON item_solicitado
FOR EACH ROW
BEGIN
    DECLARE aluno_solicitante BIGINT UNSIGNED;
    DECLARE possui_autorizacao BOOLEAN;

    IF NEW.id_chave IS NOT NULL
       AND (NOT (NEW.id_chave <=> OLD.id_chave)
            OR (OLD.status_item = 'PENDENTE' AND NEW.status_item = 'APROVADO')) THEN
        SELECT a.id_aluno INTO aluno_solicitante
        FROM solicitacao s
        LEFT JOIN aluno a ON a.id_aluno = s.id_usuario_solicitante
        WHERE s.id_solicitacao = NEW.id_solicitacao;

        IF aluno_solicitante IS NOT NULL THEN
            SELECT EXISTS (
                SELECT 1 FROM autorizacao au
                JOIN projeto p ON p.id_projeto = au.id_projeto
                JOIN usuario prof ON prof.id_usuario = p.id_professor
                WHERE au.id_aluno = aluno_solicitante AND au.status = 'ATIVA'
                  AND p.status = 'ATIVO' AND prof.status = 'ATIVO'
            ) INTO possui_autorizacao;

            IF possui_autorizacao = FALSE THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Aluno sem autorizacao ativa nao pode solicitar chave.';
            END IF;
        END IF;
    END IF;
END;

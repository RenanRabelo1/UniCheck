-- Migration 004: evento que registra atrasos a cada minuto (exige EVENT privilege; o agendador precisa estar ligado).
-- Sem DELIMITER: o runMigrations envia o arquivo inteiro como uma instrução só.

CREATE EVENT ev_registrar_atrasos
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
    INSERT IGNORE INTO ocorrencia_atraso (id_item_solicitado, data_hora_geracao, status)
    SELECT i.id_item_solicitado, NOW(), 'ABERTA'
    FROM item_solicitado i
    INNER JOIN solicitacao s ON s.id_solicitacao = i.id_solicitacao
    WHERE i.status_item = 'RETIRADO'
      AND s.data_utilizacao = CURDATE()
      AND CURTIME() >= '22:40:00';
END

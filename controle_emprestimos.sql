-- MER CCT - Controle de Emprestimos
-- Requer MySQL 8.0.16+ (CHECK constraints) e InnoDB.

CREATE DATABASE IF NOT EXISTS cct_controle_emprestimos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cct_controle_emprestimos;

CREATE TABLE usuario (
    id_usuario BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    matricula VARCHAR(30) NOT NULL,
    email_institucional VARCHAR(150) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    contato VARCHAR(30),
    perfil ENUM('ALUNO', 'PROFESSOR', 'COORDENADOR') NOT NULL,
    status ENUM('ATIVO', 'INATIVO') NOT NULL DEFAULT 'ATIVO',
    CONSTRAINT uq_usuario_matricula UNIQUE (matricula),
    CONSTRAINT uq_usuario_email UNIQUE (email_institucional)
) ENGINE=InnoDB;

CREATE TABLE professor (
    id_professor BIGINT UNSIGNED PRIMARY KEY,
    area_departamento VARCHAR(120) NOT NULL,
    CONSTRAINT fk_professor_usuario
        FOREIGN KEY (id_professor) REFERENCES usuario (id_usuario)
) ENGINE=InnoDB;

CREATE TABLE aluno (
    id_aluno BIGINT UNSIGNED PRIMARY KEY,
    dados_academicos VARCHAR(255) NOT NULL,
    CONSTRAINT fk_aluno_usuario
        FOREIGN KEY (id_aluno) REFERENCES usuario (id_usuario)
) ENGINE=InnoDB;

CREATE TABLE coordenador_cct (
    id_coordenador BIGINT UNSIGNED PRIMARY KEY,
    dados_administrativos VARCHAR(255) NOT NULL,
    CONSTRAINT fk_coordenador_usuario
        FOREIGN KEY (id_coordenador) REFERENCES usuario (id_usuario)
) ENGINE=InnoDB;

CREATE TABLE projeto (
    id_projeto BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_professor BIGINT UNSIGNED NOT NULL,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    status ENUM('ATIVO', 'INATIVO') NOT NULL DEFAULT 'ATIVO',
    CONSTRAINT fk_projeto_professor
        FOREIGN KEY (id_professor) REFERENCES professor (id_professor)
) ENGINE=InnoDB;

CREATE TABLE autorizacao (
    id_autorizacao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_aluno BIGINT UNSIGNED NOT NULL,
    id_projeto BIGINT UNSIGNED NOT NULL,
    id_coordenador BIGINT UNSIGNED NOT NULL,
    data_autorizacao DATE NOT NULL,
    status ENUM('ATIVA', 'INATIVA') NOT NULL DEFAULT 'ATIVA',
    data_inativacao DATE,
    CONSTRAINT fk_autorizacao_aluno
        FOREIGN KEY (id_aluno) REFERENCES aluno (id_aluno),
    CONSTRAINT fk_autorizacao_projeto
        FOREIGN KEY (id_projeto) REFERENCES projeto (id_projeto),
    CONSTRAINT fk_autorizacao_coordenador
        FOREIGN KEY (id_coordenador) REFERENCES coordenador_cct (id_coordenador),
    CONSTRAINT ck_autorizacao_inativacao CHECK (
        (status = 'ATIVA' AND data_inativacao IS NULL)
        OR (status = 'INATIVA' AND data_inativacao IS NOT NULL)
    )
) ENGINE=InnoDB;

CREATE TABLE solicitacao (
    id_solicitacao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario_solicitante BIGINT UNSIGNED NOT NULL,
    numero_protocolo VARCHAR(40) NOT NULL,
    data_solicitacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_utilizacao DATE NOT NULL,
    hora_retirada_prevista TIME NOT NULL,
    hora_devolucao_prevista TIME NOT NULL,
    local_utilizacao VARCHAR(180) NOT NULL,
    observacoes TEXT,
    status_geral ENUM('PENDENTE', 'APROVADA', 'PARCIAL', 'RECUSADA', 'FINALIZADA', 'CANCELADA') NOT NULL DEFAULT 'PENDENTE',
    CONSTRAINT uq_solicitacao_protocolo UNIQUE (numero_protocolo),
    CONSTRAINT fk_solicitacao_usuario
        FOREIGN KEY (id_usuario_solicitante) REFERENCES usuario (id_usuario),
    CONSTRAINT ck_solicitacao_horarios CHECK (hora_devolucao_prevista > hora_retirada_prevista)
) ENGINE=InnoDB;

CREATE TABLE termo_responsabilidade (
    id_termo BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_solicitacao BIGINT UNSIGNED NOT NULL,
    id_professor_responsavel BIGINT UNSIGNED NOT NULL,
    id_coordenador_confirmacao BIGINT UNSIGNED NOT NULL,
    data_hora_aceite DATETIME,
    aceite_solicitante BOOLEAN NOT NULL DEFAULT FALSE,
    confirmacao_professor BOOLEAN NOT NULL DEFAULT FALSE,
    confirmacao_coordenador BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_termo_solicitacao UNIQUE (id_solicitacao),
    CONSTRAINT fk_termo_solicitacao
        FOREIGN KEY (id_solicitacao) REFERENCES solicitacao (id_solicitacao),
    CONSTRAINT fk_termo_professor
        FOREIGN KEY (id_professor_responsavel) REFERENCES professor (id_professor),
    CONSTRAINT fk_termo_coordenador
        FOREIGN KEY (id_coordenador_confirmacao) REFERENCES coordenador_cct (id_coordenador)
) ENGINE=InnoDB;

CREATE TABLE material (
    id_material BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    tipo_controle ENUM('INDIVIDUAL', 'QUANTIDADE') NOT NULL,
    patrimonio VARCHAR(60),
    quantidade_total INT UNSIGNED,
    quantidade_disponivel INT UNSIGNED,
    status ENUM('ATIVO', 'INATIVO', 'MANUTENCAO') NOT NULL DEFAULT 'ATIVO',
    CONSTRAINT uq_material_patrimonio UNIQUE (patrimonio),
    CONSTRAINT ck_material_controle CHECK (
        (tipo_controle = 'INDIVIDUAL' AND patrimonio IS NOT NULL
         AND quantidade_total = 1 AND quantidade_disponivel <= 1)
        OR (tipo_controle = 'QUANTIDADE' AND patrimonio IS NULL
            AND quantidade_total > 0 AND quantidade_disponivel <= quantidade_total)
    )
) ENGINE=InnoDB;

CREATE TABLE sala (
    id_sala BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL,
    bloco VARCHAR(30) NOT NULL,
    descricao VARCHAR(255),
    status ENUM('ATIVA', 'INATIVA') NOT NULL DEFAULT 'ATIVA',
    CONSTRAINT uq_sala_codigo UNIQUE (codigo)
) ENGINE=InnoDB;

CREATE TABLE chave (
    id_chave BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_sala BIGINT UNSIGNED NOT NULL,
    codigo VARCHAR(30) NOT NULL,
    tipo_chave ENUM('PRIMARIA', 'SECUNDARIA') NOT NULL,
    disponibilidade ENUM('DISPONIVEL', 'EMPRESTADA') NOT NULL DEFAULT 'DISPONIVEL',
    status ENUM('ATIVA', 'INATIVA', 'MANUTENCAO') NOT NULL DEFAULT 'ATIVA',
    CONSTRAINT uq_chave_codigo UNIQUE (codigo),
    CONSTRAINT fk_chave_sala
        FOREIGN KEY (id_sala) REFERENCES sala (id_sala)
) ENGINE=InnoDB;

CREATE TABLE item_solicitado (
    id_item_solicitado BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_solicitacao BIGINT UNSIGNED NOT NULL,
    id_material BIGINT UNSIGNED NULL,
    id_chave BIGINT UNSIGNED NULL,
    id_coordenador_decisao BIGINT UNSIGNED NULL,
    quantidade_solicitada INT UNSIGNED NOT NULL DEFAULT 1,
    status_item ENUM('PENDENTE', 'APROVADO', 'RECUSADO', 'RETIRADO', 'DEVOLVIDO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    motivo_recusa VARCHAR(255),
    data_hora_decisao DATETIME,
    tipo_chave_entregue ENUM('PRIMARIA', 'SECUNDARIA'),
    condicao_devolucao VARCHAR(255),
    observacoes TEXT,
    CONSTRAINT fk_item_solicitacao
        FOREIGN KEY (id_solicitacao) REFERENCES solicitacao (id_solicitacao),
    CONSTRAINT fk_item_material
        FOREIGN KEY (id_material) REFERENCES material (id_material),
    CONSTRAINT fk_item_chave
        FOREIGN KEY (id_chave) REFERENCES chave (id_chave),
    CONSTRAINT fk_item_coordenador
        FOREIGN KEY (id_coordenador_decisao) REFERENCES coordenador_cct (id_coordenador),
    CONSTRAINT ck_item_referencia CHECK (
        (id_material IS NOT NULL AND id_chave IS NULL)
        OR (id_material IS NULL AND id_chave IS NOT NULL)
    ),
    CONSTRAINT ck_item_quantidade CHECK (quantidade_solicitada > 0)
) ENGINE=InnoDB;

CREATE TABLE movimentacao (
    id_movimentacao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_item_solicitado BIGINT UNSIGNED NOT NULL,
    id_coordenador BIGINT UNSIGNED NOT NULL,
    tipo_movimentacao ENUM('RETIRADA', 'DEVOLUCAO') NOT NULL,
    data_hora_real DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacao TEXT,
    condicao_devolucao VARCHAR(255),
    CONSTRAINT fk_movimentacao_item
        FOREIGN KEY (id_item_solicitado) REFERENCES item_solicitado (id_item_solicitado),
    CONSTRAINT fk_movimentacao_coordenador
        FOREIGN KEY (id_coordenador) REFERENCES coordenador_cct (id_coordenador)
) ENGINE=InnoDB;

CREATE TABLE ocorrencia_atraso (
    id_atraso BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_item_solicitado BIGINT UNSIGNED NOT NULL,
    data_hora_geracao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_hora_resolucao DATETIME,
    status ENUM('ABERTA', 'RESOLVIDA') NOT NULL DEFAULT 'ABERTA',
    CONSTRAINT uq_atraso_item UNIQUE (id_item_solicitado),
    CONSTRAINT fk_atraso_item
        FOREIGN KEY (id_item_solicitado) REFERENCES item_solicitado (id_item_solicitado)
) ENGINE=InnoDB;

DELIMITER //

-- Um aluno só pode incluir uma chave na solicitação se tiver autorização ativa.
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
END//

CREATE TRIGGER trg_item_chave_autorizacao_bu
BEFORE UPDATE ON item_solicitado
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
END//

-- Ative o agendador (SET GLOBAL event_scheduler = ON) caso possua privilégio.
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
END//

DELIMITER ;

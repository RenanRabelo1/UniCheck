-- Dados de demonstração (ids a partir de 1001, para nunca colidir com contas cadastradas pela tela).
-- Pode ser executado várias vezes: INSERT IGNORE não repete o que já existe.
-- Todos os usuários de demonstração têm a senha: unicheck123

INSERT IGNORE INTO usuario (id_usuario, nome, matricula, email_institucional, senha_hash, perfil) VALUES
  (1001, 'Prof. Ricardo Mendes', '2048819', 'ricardo.mendes@unifor.br', '$2b$10$xeLxjxhfFQHS4fvSQahMuejDh8NjtnkG1jrqbW3jA4p/EydGPGRDW', 'PROFESSOR'),
  (1002, 'Lucas Almeida', '2412001', 'aluno.autorizado@unifor.br', '$2b$10$xeLxjxhfFQHS4fvSQahMuejDh8NjtnkG1jrqbW3jA4p/EydGPGRDW', 'ALUNO'),
  (1003, 'Aluno Sem Autorização', '2412002', 'aluno.naoautorizado@unifor.br', '$2b$10$xeLxjxhfFQHS4fvSQahMuejDh8NjtnkG1jrqbW3jA4p/EydGPGRDW', 'ALUNO'),
  (1004, 'Coordenação CCT', '18024900', 'coordenacao.cct@unifor.br', '$2b$10$xeLxjxhfFQHS4fvSQahMuejDh8NjtnkG1jrqbW3jA4p/EydGPGRDW', 'COORDENADOR');

INSERT IGNORE INTO professor (id_professor, area_departamento) VALUES (1001, 'Computação e Redes');
INSERT IGNORE INTO aluno (id_aluno, dados_academicos) VALUES (1002, 'Ciência da Computação'), (1003, 'Ciência da Computação');
INSERT IGNORE INTO coordenador_cct (id_coordenador, dados_administrativos) VALUES (1004, 'Coordenação do CCT');
INSERT IGNORE INTO projeto (id_projeto, id_professor, nome) VALUES (1001, 1001, 'Laboratório de Redes');
INSERT IGNORE INTO autorizacao (id_autorizacao, id_aluno, id_projeto, id_coordenador, data_autorizacao, status) VALUES (1001, 1002, 1001, 1004, '2026-09-01', 'ATIVA');

INSERT IGNORE INTO sala (id_sala, codigo, bloco, descricao) VALUES
  (1001, 'J-201', 'J', 'Laboratório de Redes'),
  (1002, 'J-204', 'J', 'Laboratório de Desenvolvimento'),
  (1003, 'J-311', 'J', 'Sala de Projetos');

INSERT IGNORE INTO material (id_material, nome, categoria, tipo_controle, detalhe, quantidade_total) VALUES
  (1001, 'Projetor Epson WXGA', 'Geral', 'QUANTIDADE', 'Patrimônio #24810', 1),
  (1002, 'Notebook Dell Latitude + carregador', 'Geral', 'QUANTIDADE', NULL, 6),
  (1003, 'Cabo HDMI 2.0', 'Geral', 'QUANTIDADE', NULL, 8),
  (1004, 'Kit Arduino e Sensores IoT', 'Geral', 'QUANTIDADE', 'Bancada B02', 3);

INSERT IGNORE INTO chave (id_chave, id_sala, codigo, tipo_chave) VALUES
  (1001, 1001, 'J-201-P', 'PRIMARIA'),
  (1002, 1002, 'J-204-P', 'PRIMARIA'),
  (1003, 1002, 'J-204-S', 'SECUNDARIA'),
  (1004, 1003, 'J-311-P', 'PRIMARIA');

INSERT IGNORE INTO solicitacao (id_solicitacao, id_usuario_solicitante, id_sala, numero_protocolo, data_solicitacao, data_utilizacao, hora_retirada_prevista, hora_devolucao_prevista, local_utilizacao, observacoes, status_geral) VALUES
  (1001, 1001, 1002, 'CCT-2026-01001', '2026-10-05 14:15:00', '2026-10-06', '08:00:00', '12:00:00', 'J-204 · Laboratório de Desenvolvimento', 'Aula de Desenvolvimento Web.', 'APROVADA'),
  (1002, 1001, 1002, 'CCT-2026-01002', '2026-10-05 15:00:00', '2026-10-07', '09:00:00', '11:00:00', 'J-204 · Laboratório de Desenvolvimento', NULL, 'PENDENTE'),
  (1003, 1001, 1001, 'CCT-2026-01003', '2026-10-04 16:30:00', '2026-10-05', '09:00:00', '17:00:00', 'J-201 · Laboratório de Redes', NULL, 'APROVADA'),
  (1004, 1001, 1003, 'CCT-2026-01004', '2026-10-02 10:00:00', '2026-10-02', '13:00:00', '18:00:00', 'J-311 · Sala de Projetos', NULL, 'FINALIZADA'),
  (1005, 1002, 1001, 'CCT-2026-01005', '2026-10-05 10:00:00', '2026-10-05', '10:00:00', '18:00:00', 'J-201 · Laboratório de Redes', NULL, 'APROVADA'),
  (1006, 1002, 1002, 'CCT-2026-01006', '2026-10-01 18:00:00', '2026-10-01', '18:00:00', '20:30:00', 'J-204 · Laboratório de Desenvolvimento', NULL, 'FINALIZADA'),
  (1007, 1002, 1003, 'CCT-2026-01007', '2026-10-05 11:00:00', '2026-10-06', '14:00:00', '16:00:00', 'J-311 · Sala de Projetos', NULL, 'PENDENTE');

INSERT IGNORE INTO item_solicitado (id_item_solicitado, id_solicitacao, id_material, id_chave, id_coordenador_decisao, quantidade_solicitada, status_item, motivo_recusa, data_hora_decisao, nome_item, detalhe_item, data_hora_atualizacao) VALUES
  (1001, 1001, 1002, NULL, 1004, 1, 'APROVADO', NULL, '2026-10-05 14:40:00', 'Notebook Dell Latitude + carregador', NULL, '2026-10-05 14:40:00'),
  (1002, 1001, 1003, NULL, 1004, 2, 'APROVADO', NULL, '2026-10-05 14:40:00', 'Cabo HDMI 2.0', NULL, '2026-10-05 14:40:00'),
  (1003, 1002, 1004, NULL, NULL, 1, 'PENDENTE', NULL, NULL, 'Kit Arduino e Sensores IoT', 'Bancada B02', '2026-10-05 15:00:00'),
  (1004, 1003, 1001, NULL, 1004, 1, 'RETIRADO', NULL, '2026-10-05 09:30:00', 'Projetor Epson WXGA', 'Patrimônio #24810', '2026-10-05 09:30:00'),
  (1005, 1003, 1002, NULL, 1004, 1, 'RETIRADO', NULL, '2026-10-05 09:30:00', 'Notebook Dell Latitude + carregador', NULL, '2026-10-05 09:30:00'),
  (1006, 1003, 1003, NULL, 1004, 1, 'RETIRADO', NULL, '2026-10-05 09:30:00', 'Cabo HDMI 2.0', NULL, '2026-10-05 09:30:00'),
  (1007, 1004, 1004, NULL, 1004, 1, 'DEVOLVIDO', NULL, '2026-10-02 17:45:00', 'Kit Arduino e Sensores IoT', 'Bancada B02', '2026-10-02 17:45:00'),
  (1008, 1005, NULL, 1001, 1004, 1, 'RETIRADO', NULL, '2026-10-05 10:20:00', 'Chave J-201 · Primária', 'Laboratório de Redes', '2026-10-05 10:20:00'),
  (1009, 1006, NULL, 1003, 1004, 1, 'DEVOLVIDO', NULL, '2026-10-01 20:10:00', 'Chave J-204 · Secundária', 'Laboratório de Desenvolvimento', '2026-10-01 20:10:00'),
  (1010, 1007, NULL, 1004, NULL, 1, 'PENDENTE', NULL, NULL, 'Chave J-311 · Primária', 'Sala de Projetos', '2026-10-05 11:00:00');

INSERT IGNORE INTO movimentacao (id_movimentacao, id_item_solicitado, id_coordenador, tipo_movimentacao, data_hora_real, responsavel) VALUES
  (1001, 1007, 1004, 'RETIRADA', '2026-10-02 13:05:00', 'Prof. Ricardo Mendes'),
  (1002, 1007, 1004, 'DEVOLUCAO', '2026-10-02 17:45:00', 'Prof. Ricardo Mendes'),
  (1003, 1009, 1004, 'RETIRADA', '2026-10-01 18:10:00', 'Lucas Almeida'),
  (1004, 1009, 1004, 'DEVOLUCAO', '2026-10-01 20:10:00', 'Lucas Almeida'),
  (1005, 1004, 1004, 'RETIRADA', '2026-10-05 09:30:00', 'Prof. Ricardo Mendes'),
  (1006, 1005, 1004, 'RETIRADA', '2026-10-05 09:30:00', 'Prof. Ricardo Mendes'),
  (1007, 1006, 1004, 'RETIRADA', '2026-10-05 09:30:00', 'Prof. Ricardo Mendes'),
  (1008, 1008, 1004, 'RETIRADA', '2026-10-05 10:20:00', 'Lucas Almeida');

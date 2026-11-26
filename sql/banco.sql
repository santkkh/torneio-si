-- =========================================
-- Banco de dados do Torneio de SI (SQLite)
-- =========================================

-- tabela das modalidades do torneio e quantas vagas cada uma tem
CREATE TABLE IF NOT EXISTS modalidades (
    id    INTEGER PRIMARY KEY,
    nome  TEXT    NOT NULL UNIQUE,
    vagas INTEGER NOT NULL CHECK (vagas > 0)
);

-- tabela das inscrições
-- UNIQUE no e-mail: a mesma pessoa não se inscreve duas vezes
-- REFERENCES: a modalidade precisa existir na tabela modalidades
CREATE TABLE IF NOT EXISTS inscricoes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nome          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    curso         TEXT    NOT NULL,
    periodo       INTEGER NOT NULL CHECK (periodo BETWEEN 1 AND 10),
    modalidade_id INTEGER NOT NULL REFERENCES modalidades (id),
    criado_em     TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- modalidades iniciais
INSERT OR IGNORE INTO modalidades (id, nome, vagas) VALUES
    (1, 'Free Fire', 8),
    (2, 'Clash Royale', 8),
    (3, 'Xadrez', 4);

-- inscrições de exemplo (pessoas fictícias)
INSERT OR IGNORE INTO inscricoes (nome, email, curso, periodo, modalidade_id) VALUES
    ('Ana Beatriz Lima', 'ana.lima@example.com', 'Sistemas de Informação', 1, 1),
    ('Carlos Eduardo Rocha', 'carlos.rocha@example.com', 'Ciência da Computação', 3, 2),
    ('Júlia Martins', 'julia.martins@example.com', 'Engenharia de Software', 2, 3);


-- =========================================
-- Consultas de exemplo
-- =========================================

-- 1. todos os inscritos com o nome da modalidade (JOIN)
SELECT i.id, i.nome, i.curso, i.periodo, m.nome AS modalidade
FROM inscricoes i
JOIN modalidades m ON m.id = i.modalidade_id
ORDER BY i.nome;

-- 2. buscar por parte do nome (LIKE)
SELECT nome, email FROM inscricoes WHERE nome LIKE '%ana%';

-- 3. inscritos e vagas restantes por modalidade (LEFT JOIN + GROUP BY)
SELECT m.nome,
       COUNT(i.id)           AS inscritos,
       m.vagas - COUNT(i.id) AS vagas_restantes
FROM modalidades m
LEFT JOIN inscricoes i ON i.modalidade_id = m.id
GROUP BY m.id
ORDER BY m.id;

-- 4. quantos inscritos de cada curso
SELECT curso, COUNT(*) AS total
FROM inscricoes
GROUP BY curso
ORDER BY total DESC;

-- 5. cancelar uma inscrição (troque o 3 pelo id desejado)
-- DELETE FROM inscricoes WHERE id = 3;

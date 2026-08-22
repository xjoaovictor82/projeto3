-- ============================================================
-- BANCO DE DADOS: loja_esportiva
-- Projeto: SportFit Store - Dashboard Administrativo
-- Compatível com MariaDB (XAMPP)
--
-- Este script cria o banco do zero. Rode-o inteiro de uma vez
-- no phpMyAdmin (aba SQL) ou via linha de comando:
--   mysql -u root -p < banco_loja_esportiva.sql
-- ============================================================

DROP DATABASE IF EXISTS loja_esportiva;
CREATE DATABASE loja_esportiva CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE loja_esportiva;

-- ============================================================
-- 1. TABELAS
-- ============================================================

-- Usuários do painel administrativo (login)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clientes da loja (CRUD nº 2)
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE,
    telefone VARCHAR(20),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Produtos vendidos na loja (CRUD nº 1)
CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    preco_custo DECIMAL(10,2) NOT NULL DEFAULT 0,
    preco_venda DECIMAL(10,2) NOT NULL DEFAULT 0,
    estoque_atual INT NOT NULL DEFAULT 0,
    imagem VARCHAR(255),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendas / pedidos (CRUD nº 3 - cabeçalho)
CREATE TABLE vendas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NULL,
    usuario_id INT NOT NULL,
    data_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'concluida',
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Itens de cada venda (detalhe da venda)
CREATE TABLE itens_venda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venda_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_vendas_data ON vendas(data_venda);

-- ============================================================
-- 2. TRIGGER (BEFORE UPDATE) - padroniza valores positivos
-- Rubrica: "Implementação de Triggers (BEFORE UPDATE) para
-- padronizar a inserção de valores positivos."
-- ============================================================

DELIMITER $$

CREATE TRIGGER trg_produtos_before_update
BEFORE UPDATE ON produtos
FOR EACH ROW
BEGIN
    IF NEW.preco_custo < 0 THEN
        SET NEW.preco_custo = ABS(NEW.preco_custo);
    END IF;
    IF NEW.preco_venda < 0 THEN
        SET NEW.preco_venda = ABS(NEW.preco_venda);
    END IF;
    IF NEW.estoque_atual < 0 THEN
        SET NEW.estoque_atual = 0;
    END IF;
END$$

-- Mesma regra também na inserção, para não deixar a tabela
-- entrar com dados inconsistentes já no cadastro.
CREATE TRIGGER trg_produtos_before_insert
BEFORE INSERT ON produtos
FOR EACH ROW
BEGIN
    IF NEW.preco_custo < 0 THEN
        SET NEW.preco_custo = ABS(NEW.preco_custo);
    END IF;
    IF NEW.preco_venda < 0 THEN
        SET NEW.preco_venda = ABS(NEW.preco_venda);
    END IF;
    IF NEW.estoque_atual < 0 THEN
        SET NEW.estoque_atual = 0;
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- 3. FUNÇÃO REUTILIZÁVEL
-- Rubrica: "Criação de uma função no banco de dados para
-- reutilização de scripts massivos ou complexos."
-- Calcula a margem de lucro (%) de um produto. É usada tanto
-- pelas Views quanto pelas Stored Procedures abaixo, evitando
-- repetir a mesma conta em vários lugares.
-- ============================================================

DELIMITER $$

CREATE FUNCTION fn_margem_lucro(p_custo DECIMAL(10,2), p_venda DECIMAL(10,2))
RETURNS DECIMAL(6,2)
DETERMINISTIC
BEGIN
    DECLARE v_margem DECIMAL(6,2);
    IF p_custo IS NULL OR p_custo = 0 THEN
        RETURN 0;
    END IF;
    SET v_margem = ((p_venda - p_custo) / p_custo) * 100;
    RETURN v_margem;
END$$

DELIMITER ;

-- ============================================================
-- 4. VIEW que consolida informações de várias tabelas
-- Rubrica: "Criação de View que centralize informações
-- importantes no sistema e que estão em diversas tabelas
-- distintas."
-- ============================================================

CREATE VIEW vw_vendas_detalhadas AS
SELECT
    v.id            AS venda_id,
    v.data_venda,
    v.status,
    c.nome          AS cliente_nome,
    c.email         AS cliente_email,
    u.usuario       AS vendedor,
    p.nome          AS produto_nome,
    p.categoria,
    iv.quantidade,
    iv.preco_unitario,
    (iv.quantidade * iv.preco_unitario) AS subtotal
FROM vendas v
JOIN usuarios u   ON u.id = v.usuario_id
LEFT JOIN clientes c ON c.id = v.cliente_id
JOIN itens_venda iv ON iv.venda_id = v.id
JOIN produtos p   ON p.id = iv.produto_id;

-- ============================================================
-- 5. CTEs e VIEWS ANALÍTICAS
-- Rubrica: "Criação de CTEs e Views analíticas no MariaDB que
-- limpem e consolidem os dados brutos do sistema, entregando-os
-- perfeitamente estruturados."
-- ============================================================

-- 5.1: resumo geral para os cards do topo da dashboard
CREATE VIEW vw_dashboard_resumo AS
WITH faturamento AS (
    SELECT
        COALESCE(SUM(quantidade * preco_unitario), 0) AS faturamento_total,
        COALESCE(SUM(quantidade), 0)                  AS itens_vendidos
    FROM itens_venda
),
estoque_critico AS (
    SELECT COUNT(*) AS produtos_estoque_critico
    FROM produtos
    WHERE estoque_atual <= 5
),
total_clientes AS (
    SELECT COUNT(*) AS total_clientes FROM clientes
)
SELECT
    f.faturamento_total,
    f.itens_vendidos,
    e.produtos_estoque_critico,
    tc.total_clientes
FROM faturamento f, estoque_critico e, total_clientes tc;

-- 5.2: produto mais vendido (ranking por quantidade)
CREATE VIEW vw_produto_mais_vendido AS
WITH vendas_por_produto AS (
    SELECT
        p.id,
        p.nome,
        p.categoria,
        SUM(iv.quantidade) AS total_vendido
    FROM itens_venda iv
    JOIN produtos p ON p.id = iv.produto_id
    GROUP BY p.id, p.nome, p.categoria
)
SELECT id, nome, categoria, total_vendido
FROM vendas_por_produto
ORDER BY total_vendido DESC
LIMIT 1;

-- 5.3: faturamento agrupado por categoria, já com margem média
CREATE VIEW vw_faturamento_por_categoria AS
WITH vendas_categoria AS (
    SELECT
        p.categoria,
        SUM(iv.quantidade * iv.preco_unitario) AS faturamento,
        SUM(iv.quantidade)                     AS unidades_vendidas
    FROM itens_venda iv
    JOIN produtos p ON p.id = iv.produto_id
    GROUP BY p.categoria
)
SELECT
    vc.categoria,
    vc.faturamento,
    vc.unidades_vendidas,
    ROUND(AVG(fn_margem_lucro(p.preco_custo, p.preco_venda)), 2) AS margem_media
FROM vendas_categoria vc
JOIN produtos p ON p.categoria = vc.categoria
GROUP BY vc.categoria, vc.faturamento, vc.unidades_vendidas;

-- 5.4: resumo por cliente (nome + total gasto + total de compras),
-- consolidando dados de clientes, vendas e itens_venda numa só consulta.
CREATE VIEW vw_clientes_resumo AS
WITH compras_cliente AS (
    SELECT
        v.cliente_id,
        COUNT(DISTINCT v.id)                        AS total_compras,
        COALESCE(SUM(iv.quantidade * iv.preco_unitario), 0) AS total_gasto
    FROM vendas v
    JOIN itens_venda iv ON iv.venda_id = v.id
    WHERE v.status = 'concluida'
    GROUP BY v.cliente_id
)
SELECT
    c.id,
    c.nome,
    c.email,
    c.telefone,
    COALESCE(cc.total_compras, 0) AS total_compras,
    COALESCE(cc.total_gasto, 0)   AS total_gasto
FROM clientes c
LEFT JOIN compras_cliente cc ON cc.cliente_id = c.id;

-- ============================================================
-- 6. STORED PROCEDURES
-- Rubrica: "Desenvolvimento de Stored Procedures otimizadas
-- para centralizar a busca, filtros e paginação dos indicadores
-- da dashboard, permitindo que a API em PHP faça chamadas
-- limpas (CALL) e assíncronas."
-- ============================================================

-- 6.1: busca + filtro por categoria + paginação de produtos
DELIMITER $$

CREATE PROCEDURE sp_listar_produtos(
    IN p_busca      VARCHAR(150),
    IN p_categoria  VARCHAR(80),
    IN p_limite     INT,
    IN p_offset     INT
)
BEGIN
    SELECT
        id, nome, categoria, preco_custo, preco_venda, estoque_atual, imagem,
        fn_margem_lucro(preco_custo, preco_venda) AS margem_lucro
    FROM produtos
    WHERE (p_busca IS NULL OR p_busca = '' OR nome LIKE CONCAT('%', p_busca, '%'))
      AND (p_categoria IS NULL OR p_categoria = '' OR categoria = p_categoria)
    ORDER BY nome
    LIMIT p_limite OFFSET p_offset;
END$$

DELIMITER ;

-- 6.2: todos os indicadores da dashboard em uma única chamada
DELIMITER $$

CREATE PROCEDURE sp_dashboard_indicadores()
BEGIN
    SELECT * FROM vw_dashboard_resumo;
    SELECT * FROM vw_produto_mais_vendido;
    SELECT * FROM vw_faturamento_por_categoria;
END$$

DELIMITER ;

-- 6.3: abrir uma venda nova (cabeçalho) - devolve o ID gerado
DELIMITER $$

CREATE PROCEDURE sp_criar_venda(
    IN  p_cliente_id INT,
    IN  p_usuario_id INT,
    OUT p_venda_id   INT
)
BEGIN
    INSERT INTO vendas (cliente_id, usuario_id) VALUES (p_cliente_id, p_usuario_id);
    SET p_venda_id = LAST_INSERT_ID();
END$$

DELIMITER ;

-- 6.4: adicionar um item à venda e dar baixa no estoque
-- (com verificação de estoque suficiente)
DELIMITER $$

CREATE PROCEDURE sp_adicionar_item_venda(
    IN p_venda_id   INT,
    IN p_produto_id INT,
    IN p_quantidade INT
)
BEGIN
    DECLARE v_estoque INT;
    DECLARE v_preco_venda DECIMAL(10,2);

    SELECT estoque_atual, preco_venda INTO v_estoque, v_preco_venda
    FROM produtos WHERE id = p_produto_id
    FOR UPDATE;

    IF v_estoque IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Produto não encontrado.';
    ELSEIF v_estoque < p_quantidade THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Estoque insuficiente para esse produto.';
    END IF;

    INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario)
    VALUES (p_venda_id, p_produto_id, p_quantidade, v_preco_venda);

    UPDATE produtos
    SET estoque_atual = estoque_atual - p_quantidade
    WHERE id = p_produto_id;
END$$

DELIMITER ;

-- 6.5: cancelar uma venda (estorna o estoque dos itens)
DELIMITER $$

CREATE PROCEDURE sp_cancelar_venda(IN p_venda_id INT)
BEGIN
    UPDATE produtos p
    JOIN itens_venda iv ON iv.produto_id = p.id
    SET p.estoque_atual = p.estoque_atual + iv.quantidade
    WHERE iv.venda_id = p_venda_id;

    UPDATE vendas SET status = 'cancelada' WHERE id = p_venda_id;
END$$

DELIMITER ;

-- 6.6: listar vendas com paginação simples, já consolidadas por venda
-- (uma linha por venda, com total calculado a partir dos itens)
DELIMITER $$

CREATE PROCEDURE sp_listar_vendas(
    IN p_limite INT,
    IN p_offset INT
)
BEGIN
    SELECT
        v.id,
        v.data_venda,
        v.status,
        COALESCE(c.nome, 'Consumidor não identificado') AS cliente_nome,
        u.usuario AS vendedor,
        COALESCE(SUM(iv.quantidade * iv.preco_unitario), 0) AS total_venda,
        COALESCE(SUM(iv.quantidade), 0) AS itens_qtd
    FROM vendas v
    JOIN usuarios u      ON u.id = v.usuario_id
    LEFT JOIN clientes c ON c.id = v.cliente_id
    LEFT JOIN itens_venda iv ON iv.venda_id = v.id
    GROUP BY v.id, v.data_venda, v.status, c.nome, u.usuario
    ORDER BY v.data_venda DESC
    LIMIT p_limite OFFSET p_offset;
END$$

DELIMITER ;

-- ============================================================
-- 7. DADOS DE EXEMPLO (opcional, ajuda a testar dashboard/CRUD)
-- ============================================================

-- Produtos sem foto própria ficam com imagem = '' de propósito: o site
-- mostra automaticamente um ícone estilizado por categoria nesse caso,
-- em vez de reaproveitar uma foto que não corresponde ao produto real.
--
-- Os produtos abaixo com URL completa (https://...) usam fotos reais
-- hospedadas no Unsplash (licença Unsplash License, uso livre incl.
-- comercial). Se preferir imagens 100% locais, baixe os arquivos e
-- troque o valor da coluna "imagem" pelo caminho em img/.
INSERT INTO produtos (nome, categoria, preco_custo, preco_venda, estoque_atual, imagem) VALUES
('Camisa Dry Fit Preta',        'Camisetas', 35.00,  79.90, 40, 'img/camisa1.webp'),
('Camisa Dry Fit Branca',       'Camisetas', 35.00,  79.90, 25, 'https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?q=80&w=800&auto=format&fit=crop'),
('Camisa Regata Treino Azul',   'Camisetas', 30.00,  69.90, 20, 'img/camisa3.svg'),
('Camisa Manga Longa Térmica',  'Camisetas', 42.00,  99.90, 18, 'img/camisa4.svg'),
('Tênis Corrida Pro',           'Calçados',  180.00, 349.90, 15, 'https://images.unsplash.com/photo-1562183241-b937e95585b6?q=80&w=800&auto=format&fit=crop'),
('Tênis Caminhada Light',       'Calçados',  120.00, 229.90, 8,  'https://images.unsplash.com/photo-1542272604-78d13c1f741a?q=80&w=800&auto=format&fit=crop'),
('Chuteira Society',            'Calçados',  150.00, 289.90, 12, 'https://images.unsplash.com/photo-1751743713337-87713148ea16?q=80&w=800&auto=format&fit=crop'),
('Short Esportivo Compressão',  'Shorts',    28.00,  69.90, 30, 'https://images.unsplash.com/photo-1612032882906-2fa6f7b5f30f?q=80&w=800&auto=format&fit=crop'),
('Short Corrida Leve',          'Shorts',    24.00,  59.90, 22, 'https://images.unsplash.com/photo-1612032882906-2fa6f7b5f30f?q=80&w=800&auto=format&fit=crop'),
('Squeeze 1L',                  'Acessórios',12.00,  34.90, 60, 'https://images.unsplash.com/photo-1616740540792-3daec604777d?q=80&w=800&auto=format&fit=crop'),
('Luva de Treino',              'Acessórios',18.00,  49.90, 3,  ''),
('Mochila Esportiva',           'Acessórios',45.00,  119.90, 10, ''),
-- Produtos novos (a partir daqui): ids seguem a partir de 13, não
-- interferem nas vendas de exemplo abaixo (que usam produto_id 1-10).
('Tênis Trilha Trail Runner',   'Calçados',  160.00, 299.90, 14, ''),
('Legging Feminina Fitness',    'Shorts',    32.00,  89.90, 26, ''),
('Boné Esportivo Aba Curva',    'Acessórios',15.00,  44.90, 35, ''),
('Meião de Futebol',            'Acessórios',9.00,   24.90, 50, ''),
('Óculos de Sol Esportivo',     'Acessórios',22.00,  69.90, 16, ''),
('Relógio Monitor Cardíaco',    'Acessórios',95.00,  229.90, 9,  ''),
('Jaqueta Corta-Vento',         'Casacos',   58.00,  149.90, 17, ''),
('Bola de Futebol Oficial',     'Bolas',     40.00,  99.90, 24, 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=800&auto=format&fit=crop'),
('Bola de Vôlei',               'Bolas',     35.00,  89.90, 19, '');

INSERT INTO clientes (nome, email, telefone) VALUES
('Ana Souza',   'ana.souza@email.com',   '(44) 99999-0001'),
('Bruno Lima',  'bruno.lima@email.com',  '(44) 99999-0002'),
('Carla Mendes','carla.mendes@email.com','(44) 99999-0003');

-- Vendas de exemplo, para a dashboard já nascer com números reais em vez
-- de zerada. usuario_id = 1 assume que este INSERT abaixo já rodou (ele
-- sempre cria o primeiro usuário com id 1, já que o banco acabou de ser
-- recriado do zero lá no início do script).
--
-- A hash abaixo é uma hash bcrypt REAL (gerada e conferida à parte) da
-- senha "admin123" - não é mais um placeholder. Login funciona assim que
-- você importar este arquivo, sem precisar rodar mais nada.
INSERT INTO usuarios (usuario, senha) VALUES ('admin', '$2b$12$PMu7J85P5mV98Ye0WUiSZ.nDIjFwxx8ZGQ73nPHgf2z8hqoK6nztG')
ON DUPLICATE KEY UPDATE senha = VALUES(senha);

INSERT INTO vendas (cliente_id, usuario_id, status) VALUES
(1, 1, 'concluida'),
(2, 1, 'concluida'),
(3, 1, 'concluida'),
(1, 1, 'concluida');

INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario) VALUES
(1, 1, 2, 79.90),
(1, 5, 1, 349.90),
(2, 2, 1, 79.90),
(2, 8, 3, 69.90),
(3, 1, 1, 79.90),
(3, 10, 2, 34.90),
(4, 5, 1, 349.90),
(4, 6, 1, 229.90);

-- Observação: a senha do usuário 'admin' criado acima é "admin123".
-- criar_admin.php continua disponível caso você queira trocar essa senha
-- depois - ele sempre atualiza o hash do usuário 'admin' com a senha que
-- estiver escrita nele.

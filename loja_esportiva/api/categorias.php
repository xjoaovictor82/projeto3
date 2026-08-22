<?php
// api/categorias.php
// Devolve as categorias que realmente existem na tabela produtos.
// Existir esse endpoint evita o bug clássico de menu "fixo" no HTML
// ficando fora de sincronia com as categorias reais cadastradas no banco.

error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/conexao.php';

try {
    $stmt = $pdo->query('SELECT DISTINCT categoria FROM produtos ORDER BY categoria');
    $categorias = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode($categorias);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro ao buscar categorias: ' . $e->getMessage()]);
}

<?php
// api/dashboard.php
// Alimenta o painel administrativo. Só acessível logado.
//
// Retorna dois tipos de dado, de propósito:
// 1) Indicadores já calculados no banco (CALL sp_dashboard_indicadores),
//    vindos das Views/CTEs analíticas.
// 2) Arrays "crus" (itens_venda_raw e produtos) para o TypeScript do
//    painel recalcular os mesmos números no front (.reduce/.filter/.map),
//    conforme a rubrica de Lógica Avançada.

session_start();
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(['erro' => 'Sessão expirada. Faça login novamente.']);
    exit;
}

require_once __DIR__ . '/conexao.php';

try {
    // --- 1) Indicadores pré-calculados no banco (Views/CTEs via Stored Procedure) ---
    $stmt = $pdo->query('CALL sp_dashboard_indicadores()');

    $resumo = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    $stmt->nextRowset();

    $produtoMaisVendido = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    $stmt->nextRowset();

    $faturamentoPorCategoria = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $stmt->closeCursor();

    // --- 2) Dados crus para o front recalcular por conta própria ---
    $itensVendaRaw = $pdo->query(
        "SELECT iv.quantidade, iv.preco_unitario, p.nome AS produto_nome, p.categoria
         FROM itens_venda iv
         JOIN produtos p ON p.id = iv.produto_id
         JOIN vendas v ON v.id = iv.venda_id
         WHERE v.status = 'concluida'"
    )->fetchAll(PDO::FETCH_ASSOC);

    $produtos = $pdo->query(
        'SELECT id, nome, categoria, preco_custo, preco_venda, estoque_atual FROM produtos'
    )->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'resumo'                    => $resumo,
        'produto_mais_vendido'      => $produtoMaisVendido,
        'faturamento_por_categoria' => $faturamentoPorCategoria,
        'itens_venda_raw'           => $itensVendaRaw,
        'produtos'                  => $produtos,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro ao montar dashboard: ' . $e->getMessage()]);
}

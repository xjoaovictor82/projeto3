<?php
// api/listas_produtos.php
// Lista produtos chamando a Stored Procedure sp_listar_produtos, que
// centraliza busca + filtro por categoria + paginação direto no banco.
// Suporta: ?busca=&categoria=&limite=&offset=

error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/conexao.php';

$busca     = trim($_GET['busca'] ?? '');
$categoria = trim($_GET['categoria'] ?? '');
$limite    = isset($_GET['limite']) ? max(1, min(200, (int)$_GET['limite'])) : 100;
$offset    = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;

try {
    $stmt = $pdo->prepare('CALL sp_listar_produtos(:busca, :categoria, :limite, :offset)');
    $stmt->bindValue(':busca', $busca !== '' ? $busca : null, PDO::PARAM_STR);
    $stmt->bindValue(':categoria', $categoria !== '' ? $categoria : null, PDO::PARAM_STR);
    $stmt->bindValue(':limite', $limite, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $produtos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $stmt->closeCursor(); // libera a conexão para a próxima CALL (necessário com stored procedures no PDO)

    echo json_encode($produtos);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro ao buscar produtos: ' . $e->getMessage()]);
}

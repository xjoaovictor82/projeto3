<?php
// api/crud_vendas.php
// CRUD de vendas: criar (com itens), listar, cancelar (não há "editar"
// venda fechada de propósito - o correto em um sistema de vendas real é
// cancelar e abrir uma nova, o que também estorna o estoque).
// Só funciona para quem está logado.

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

$acao = $_POST['acao'] ?? $_GET['acao'] ?? '';

try {
    switch ($acao) {

        case 'listar':
            $stmt = $pdo->prepare('CALL sp_listar_vendas(:limite, :offset)');
            $stmt->bindValue(':limite', 100, PDO::PARAM_INT);
            $stmt->bindValue(':offset', 0, PDO::PARAM_INT);
            $stmt->execute();
            $vendas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $stmt->closeCursor();
            echo json_encode($vendas);
            break;

        case 'criar':
            $clienteId = !empty($_POST['cliente_id']) ? (int)$_POST['cliente_id'] : null;
            $itensJson = $_POST['itens'] ?? '[]';
            $itens = json_decode($itensJson, true);

            if (!is_array($itens) || count($itens) === 0) {
                http_response_code(422);
                echo json_encode(['erro' => 'Adicione ao menos um item à venda.']);
                exit;
            }

            $pdo->beginTransaction();

            // sp_criar_venda usa um parâmetro OUT; no PDO isso é feito com @variavel de sessão do MySQL
            $stmt = $pdo->prepare('CALL sp_criar_venda(:cliente_id, :usuario_id, @venda_id)');
            $stmt->execute([
                ':cliente_id' => $clienteId,
                ':usuario_id' => $_SESSION['usuario_id'],
            ]);
            $stmt->closeCursor();

            $vendaId = (int)$pdo->query('SELECT @venda_id')->fetchColumn();

            foreach ($itens as $item) {
                $produtoId  = (int)($item['produto_id'] ?? 0);
                $quantidade = (int)($item['quantidade'] ?? 0);

                if ($produtoId <= 0 || $quantidade <= 0) {
                    throw new RuntimeException('Item de venda inválido.');
                }

                $stmtItem = $pdo->prepare('CALL sp_adicionar_item_venda(:venda_id, :produto_id, :quantidade)');
                $stmtItem->execute([
                    ':venda_id'   => $vendaId,
                    ':produto_id' => $produtoId,
                    ':quantidade' => $quantidade,
                ]);
                $stmtItem->closeCursor();
            }

            $pdo->commit();
            echo json_encode(['sucesso' => true, 'id' => $vendaId]);
            break;

        case 'cancelar':
            $id = (int)($_POST['id'] ?? 0);
            if ($id <= 0) {
                http_response_code(422);
                echo json_encode(['erro' => 'ID da venda inválido.']);
                exit;
            }

            $stmt = $pdo->prepare('CALL sp_cancelar_venda(:id)');
            $stmt->execute([':id' => $id]);
            $stmt->closeCursor();

            echo json_encode(['sucesso' => true]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['erro' => 'Ação inválida.']);
    }
} catch (RuntimeException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(422);
    echo json_encode(['erro' => $e->getMessage()]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    // SIGNAL das stored procedures (ex.: "Estoque insuficiente") chega aqui como PDOException
    http_response_code(422);
    echo json_encode(['erro' => $e->getMessage()]);
}

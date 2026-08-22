<?php
// api/crud_clientes.php
// CRUD de clientes (adicionar / editar / excluir / listar via vw_clientes_resumo).
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

function validarCliente(array $dados): array {
    $erros = [];
    if (trim($dados['nome'] ?? '') === '') $erros[] = 'Nome é obrigatório.';
    $email = trim($dados['email'] ?? '');
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) $erros[] = 'E-mail inválido.';
    return $erros;
}

try {
    switch ($acao) {

        case 'listar':
            // Usa a View que já centraliza clientes + total de compras + total gasto
            $clientes = $pdo->query('SELECT * FROM vw_clientes_resumo ORDER BY nome')->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($clientes);
            break;

        case 'adicionar':
            $erros = validarCliente($_POST);
            if ($erros) {
                http_response_code(422);
                echo json_encode(['erro' => implode(' ', $erros)]);
                exit;
            }

            $stmt = $pdo->prepare('INSERT INTO clientes (nome, email, telefone) VALUES (:nome, :email, :telefone)');
            $stmt->execute([
                ':nome'     => trim($_POST['nome']),
                ':email'    => trim($_POST['email'] ?? '') ?: null,
                ':telefone' => trim($_POST['telefone'] ?? '') ?: null,
            ]);

            echo json_encode(['sucesso' => true, 'id' => (int)$pdo->lastInsertId()]);
            break;

        case 'editar':
            $id = (int)($_POST['id'] ?? 0);
            if ($id <= 0) {
                http_response_code(422);
                echo json_encode(['erro' => 'ID do cliente inválido.']);
                exit;
            }

            $erros = validarCliente($_POST);
            if ($erros) {
                http_response_code(422);
                echo json_encode(['erro' => implode(' ', $erros)]);
                exit;
            }

            $stmt = $pdo->prepare('UPDATE clientes SET nome = :nome, email = :email, telefone = :telefone WHERE id = :id');
            $stmt->execute([
                ':nome'     => trim($_POST['nome']),
                ':email'    => trim($_POST['email'] ?? '') ?: null,
                ':telefone' => trim($_POST['telefone'] ?? '') ?: null,
                ':id'       => $id,
            ]);

            echo json_encode(['sucesso' => true]);
            break;

        case 'excluir':
            $id = (int)($_POST['id'] ?? 0);
            if ($id <= 0) {
                http_response_code(422);
                echo json_encode(['erro' => 'ID do cliente inválido.']);
                exit;
            }

            // Cliente com vendas vinculadas não pode ser excluído por integridade
            // referencial; a mensagem deixa isso claro em vez de estourar um erro cru.
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM vendas WHERE cliente_id = :id');
            $stmt->execute([':id' => $id]);
            if ((int)$stmt->fetchColumn() > 0) {
                http_response_code(409);
                echo json_encode(['erro' => 'Este cliente possui vendas registradas e não pode ser excluído.']);
                exit;
            }

            $stmt = $pdo->prepare('DELETE FROM clientes WHERE id = :id');
            $stmt->execute([':id' => $id]);

            echo json_encode(['sucesso' => true]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['erro' => 'Ação inválida.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro no banco de dados: ' . $e->getMessage()]);
}

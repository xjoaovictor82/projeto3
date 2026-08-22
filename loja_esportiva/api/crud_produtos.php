<?php
// api/crud_produtos.php
// Centraliza adicionar / editar / excluir produtos.
// Só funciona para quem está logado (sessão criada em api/login.php).

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

$acao = $_POST['acao'] ?? '';

function validarProduto(array $dados): array {
    $erros = [];
    if (trim($dados['nome'] ?? '') === '') $erros[] = 'Nome é obrigatório.';
    if (trim($dados['categoria'] ?? '') === '') $erros[] = 'Categoria é obrigatória.';
    if (!is_numeric($dados['preco_custo'] ?? '')) $erros[] = 'Preço de custo inválido.';
    if (!is_numeric($dados['preco_venda'] ?? '')) $erros[] = 'Preço de venda inválido.';
    if (!is_numeric($dados['estoque_atual'] ?? '')) $erros[] = 'Estoque inválido.';
    return $erros;
}

try {
    switch ($acao) {

        case 'adicionar':
            $erros = validarProduto($_POST);
            if ($erros) {
                http_response_code(422);
                echo json_encode(['erro' => implode(' ', $erros)]);
                exit;
            }

            $stmt = $pdo->prepare("INSERT INTO produtos (nome, categoria, preco_custo, preco_venda, estoque_atual, imagem)
                                    VALUES (:nome, :categoria, :preco_custo, :preco_venda, :estoque_atual, :imagem)");
            $stmt->execute([
                ':nome'          => trim($_POST['nome']),
                ':categoria'     => trim($_POST['categoria']),
                ':preco_custo'   => (float)$_POST['preco_custo'],
                ':preco_venda'   => (float)$_POST['preco_venda'],
                ':estoque_atual' => (int)$_POST['estoque_atual'],
                ':imagem'        => trim($_POST['imagem'] ?? ''),
            ]);

            echo json_encode(['sucesso' => true, 'id' => (int)$pdo->lastInsertId()]);
            break;

        case 'editar':
            $id = (int)($_POST['id'] ?? 0);
            if ($id <= 0) {
                http_response_code(422);
                echo json_encode(['erro' => 'ID do produto inválido.']);
                exit;
            }

            $erros = validarProduto($_POST);
            if ($erros) {
                http_response_code(422);
                echo json_encode(['erro' => implode(' ', $erros)]);
                exit;
            }

            $stmt = $pdo->prepare("UPDATE produtos SET
                                        nome = :nome,
                                        categoria = :categoria,
                                        preco_custo = :preco_custo,
                                        preco_venda = :preco_venda,
                                        estoque_atual = :estoque_atual,
                                        imagem = :imagem
                                    WHERE id = :id");
            $stmt->execute([
                ':nome'          => trim($_POST['nome']),
                ':categoria'     => trim($_POST['categoria']),
                ':preco_custo'   => (float)$_POST['preco_custo'],
                ':preco_venda'   => (float)$_POST['preco_venda'],
                ':estoque_atual' => (int)$_POST['estoque_atual'],
                ':imagem'        => trim($_POST['imagem'] ?? ''),
                ':id'            => $id,
            ]);

            echo json_encode(['sucesso' => true]);
            break;

        case 'excluir':
            $id = (int)($_POST['id'] ?? 0);
            if ($id <= 0) {
                http_response_code(422);
                echo json_encode(['erro' => 'ID do produto inválido.']);
                exit;
            }

            $stmt = $pdo->prepare("DELETE FROM produtos WHERE id = :id");
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

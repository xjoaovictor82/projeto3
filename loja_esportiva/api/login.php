<?php
session_start();
require_once __DIR__ . '/conexao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../login.php');
    exit;
}

// --- Proteção simples contra força bruta ---
// Limita tentativas por sessão: depois de 5 erros seguidos, exige uma
// pausa de 30s antes de deixar tentar de novo. Não é infalível (é por
// sessão, não por IP), mas cobre o caso de alguém ficar testando senha
// no formulário sem precisar de tabela extra no banco.
const MAX_TENTATIVAS = 5;
const BLOQUEIO_SEGUNDOS = 30;

$_SESSION['login_tentativas'] = $_SESSION['login_tentativas'] ?? 0;
$_SESSION['login_bloqueado_ate'] = $_SESSION['login_bloqueado_ate'] ?? 0;

if ($_SESSION['login_bloqueado_ate'] > time()) {
    $restante = $_SESSION['login_bloqueado_ate'] - time();
    header('Location: ../login.php?erro=' . urlencode("Muitas tentativas. Aguarde {$restante}s e tente novamente."));
    exit;
}

// CSRF: token gerado no login.php e conferido aqui antes de processar o POST.
if (!isset($_POST['csrf_token']) || !isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
    header('Location: ../login.php?erro=' . urlencode('Sessão expirada, tente novamente.'));
    exit;
}

$usuario = trim($_POST['usuario'] ?? '');
$senha = $_POST['senha'] ?? '';

if ($usuario === '' || $senha === '') {
    header('Location: ../login.php?erro=' . urlencode('Preencha usuário e senha.'));
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, usuario, senha FROM usuarios WHERE usuario = :usuario LIMIT 1");
    $stmt->execute([':usuario' => $usuario]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($senha, $user['senha'])) {
        unset($_SESSION['login_tentativas'], $_SESSION['login_bloqueado_ate']);
        session_regenerate_id(true);
        $_SESSION['usuario_id'] = $user['id'];
        $_SESSION['usuario_nome'] = $user['usuario'];
        header('Location: ../admin.php');
        exit;
    }

    $_SESSION['login_tentativas']++;
    if ($_SESSION['login_tentativas'] >= MAX_TENTATIVAS) {
        $_SESSION['login_bloqueado_ate'] = time() + BLOQUEIO_SEGUNDOS;
        $_SESSION['login_tentativas'] = 0;
    }

    // Mensagem genérica de propósito: não revela se o erro foi o usuário
    // ou a senha, para não ajudar quem estiver tentando adivinhar login.
    header('Location: ../login.php?erro=' . urlencode('Usuário ou senha inválidos.'));
    exit;
} catch (PDOException $e) {
    header('Location: ../login.php?erro=' . urlencode('Erro ao conectar ao banco de dados.'));
    exit;
}

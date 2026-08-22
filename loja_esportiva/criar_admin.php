<?php
// ATENÇÃO: Rode este arquivo UMA VEZ no navegador para criar/resetar o
// usuário admin. Ele é "auto-suficiente": cria a tabela usuarios se ela
// não existir, então funciona mesmo se você rodar antes ou depois do
// sql/banco_loja_esportiva.sql. Depois de usar, apague este arquivo.

require_once __DIR__ . '/api/conexao.php';

$usuario = 'admin';
$senhaPura = 'admin123'; // troque essa senha depois de logar, se quiser
$hash = password_hash($senhaPura, PASSWORD_DEFAULT);

try {
    // Garante que a tabela existe, não importa a ordem em que os scripts rodaram
    $pdo->exec("CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario VARCHAR(50) NOT NULL UNIQUE,
        senha VARCHAR(255) NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $stmt = $pdo->prepare("INSERT INTO usuarios (usuario, senha) VALUES (:usuario, :senha)
                            ON DUPLICATE KEY UPDATE senha = VALUES(senha)");
    $stmt->execute([':usuario' => $usuario, ':senha' => $hash]);

    $total = $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn();

    echo "<h3>Usuário admin criado/resetado com sucesso!</h3>";
    echo "Usuário: <b>$usuario</b><br>";
    echo "Senha: <b>$senhaPura</b><br>";
    echo "Total de usuários na tabela agora: <b>$total</b><br><br>";
    echo "<a href='login.php'>Ir para o login</a><br>";
    echo "<b>Depois de logar, apague este arquivo (criar_admin.php) por segurança.</b>";
} catch (PDOException $e) {
    echo "<h3>Erro ao criar usuário</h3>";
    echo $e->getMessage();
    echo "<br><br>Verifique em api/conexao.php se o nome do banco (\$db) está certo e se o MySQL do XAMPP está ligado.";
}

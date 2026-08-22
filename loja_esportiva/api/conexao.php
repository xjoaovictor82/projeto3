<?php
// Arquivo: conexao.php

$host = 'localhost';
$db   = 'loja_esportiva';
$user = 'root';
$pass = '';

try {
     $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
     $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
     echo "Erro na conexao com o banco: " . $e->getMessage();
     exit;
}
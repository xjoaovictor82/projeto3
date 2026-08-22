<?php
// ATENÇÃO: Rode este arquivo UMA VEZ no navegador (com o XAMPP ligado e
// com internet), depois de importar sql/banco_loja_esportiva.sql.
//
// O que ele faz:
//   1. Procura na tabela "produtos" quais itens ainda estão com uma URL
//      externa (https://images.unsplash.com/...) na coluna "imagem".
//   2. Baixa cada foto de verdade para dentro da pasta img/ deste projeto.
//   3. Atualiza o banco para apontar para o arquivo local (img/...jpg) em
//      vez do link externo.
//
// Depois de rodar, as fotos passam a ser arquivos reais no seu projeto —
// funcionam mesmo offline e podem ser entregues junto com o código.
// Pode apagar este arquivo depois de usar.

require_once __DIR__ . '/api/conexao.php';

// user_agent "de navegador" porque alguns servidores de imagem (Unsplash
// incluso) recusam pedidos sem User-Agent, achando que é um bot malicioso.
$contexto = stream_context_create([
    'http' => [
        'method'  => 'GET',
        'header'  => "User-Agent: Mozilla/5.0 (compatible; SportFitStore/1.0)\r\n",
        'timeout' => 20,
    ],
]);

function gerarSlug(string $texto): string
{
    $mapaAcentos = [
        'á'=>'a','à'=>'a','ã'=>'a','â'=>'a','ä'=>'a',
        'é'=>'e','è'=>'e','ê'=>'e','ë'=>'e',
        'í'=>'i','ì'=>'i','î'=>'i','ï'=>'i',
        'ó'=>'o','ò'=>'o','õ'=>'o','ô'=>'o','ö'=>'o',
        'ú'=>'u','ù'=>'u','û'=>'u','ü'=>'u',
        'ç'=>'c','ñ'=>'n',
        'Á'=>'a','À'=>'a','Ã'=>'a','Â'=>'a','Ä'=>'a',
        'É'=>'e','È'=>'e','Ê'=>'e','Ë'=>'e',
        'Í'=>'i','Ì'=>'i','Î'=>'i','Ï'=>'i',
        'Ó'=>'o','Ò'=>'o','Õ'=>'o','Ô'=>'o','Ö'=>'o',
        'Ú'=>'u','Ù'=>'u','Û'=>'u','Ü'=>'u',
        'Ç'=>'c','Ñ'=>'n',
    ];
    $texto = strtr($texto, $mapaAcentos);
    $texto = strtolower($texto);
    $texto = preg_replace('/[^a-z0-9]+/', '_', $texto);
    return trim($texto, '_');
}

$pastaImg = __DIR__ . '/img';
if (!is_dir($pastaImg)) {
    mkdir($pastaImg, 0755, true);
}

function baixarConteudo(string $url, $contexto)
{
    // Caminho normal: file_get_contents (precisa de allow_url_fopen = On,
    // que é o padrão no PHP do XAMPP).
    $dados = @file_get_contents($url, false, $contexto);
    if ($dados !== false && strlen($dados) > 1000) {
        return $dados;
    }

    // Fallback: se allow_url_fopen estiver desligado, tenta via cURL
    // (extensão que também vem habilitada por padrão no XAMPP).
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT        => 20,
            CURLOPT_USERAGENT      => 'Mozilla/5.0 (compatible; SportFitStore/1.0)',
        ]);
        $dados = curl_exec($ch);
        $erro = curl_error($ch);
        curl_close($ch);
        if ($dados !== false && strlen($dados) > 1000) {
            return $dados;
        }
    }

    return false;
}

$relatorio = [];

try {
    $stmt = $pdo->query("SELECT id, nome, imagem FROM produtos WHERE imagem LIKE 'http%'");
    $produtos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($produtos)) {
        echo "<h3>Nenhuma imagem externa encontrada.</h3>";
        echo "Todos os produtos já usam arquivos locais (ou não têm imagem cadastrada). Nada a baixar.";
        exit;
    }

    $stmtUpdate = $pdo->prepare("UPDATE produtos SET imagem = :imagem WHERE id = :id");

    foreach ($produtos as $produto) {
        $slug = gerarSlug($produto['nome']);
        $nomeArquivo = "produto_{$produto['id']}_{$slug}.jpg";
        $caminhoLocal = $pastaImg . '/' . $nomeArquivo;
        $caminhoRelativo = 'img/' . $nomeArquivo;

        $dados = baixarConteudo($produto['imagem'], $contexto);

        if ($dados === false) {
            $relatorio[] = [
                'produto' => $produto['nome'],
                'status'  => 'erro',
                'detalhe' => 'Falha ao baixar a imagem (verifique sua conexão com a internet).',
            ];
            continue;
        }

        file_put_contents($caminhoLocal, $dados);
        $stmtUpdate->execute([':imagem' => $caminhoRelativo, ':id' => $produto['id']]);

        $relatorio[] = [
            'produto' => $produto['nome'],
            'status'  => 'ok',
            'detalhe' => $caminhoRelativo . ' (' . round(strlen($dados) / 1024) . ' KB)',
        ];
    }

    echo "<h3>Download concluído</h3>";
    echo "<table border='1' cellpadding='6' cellspacing='0' style='border-collapse:collapse;font-family:sans-serif;font-size:14px;'>";
    echo "<tr><th>Produto</th><th>Status</th><th>Detalhe</th></tr>";
    foreach ($relatorio as $linha) {
        $cor = $linha['status'] === 'ok' ? '#e6ffed' : '#ffe6e6';
        echo "<tr style='background:{$cor}'><td>{$linha['produto']}</td><td>{$linha['status']}</td><td>{$linha['detalhe']}</td></tr>";
    }
    echo "</table>";
    echo "<br><a href='index.php'>Ver a loja</a> | <a href='admin.php'>Ir para o painel</a>";
    echo "<br><br><b>Depois de conferir que deu tudo certo, apague este arquivo (baixar_imagens.php) por segurança.</b>";
} catch (PDOException $e) {
    echo "<h3>Erro ao acessar o banco</h3>";
    echo $e->getMessage();
    echo "<br><br>Verifique em api/conexao.php se o nome do banco está certo e se o MySQL do XAMPP está ligado.";
}

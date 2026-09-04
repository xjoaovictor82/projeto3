<?php
session_start();
if (isset($_SESSION['usuario_id'])) {
    header('Location: admin.php');
    exit;
}
$erro = $_GET['erro'] ?? '';

// Token CSRF: gerado uma vez por sessão e conferido em api/login.php
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
$csrfToken = $_SESSION['csrf_token'];
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Entrar - SportFit Store</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            background-color: #f4f5f7;
            color: #111111;
            font-family: 'Inter', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
        }
        .login-card {
            border-radius: 16px;
            border: none;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.08), 0 10px 10px -5px rgba(0,0,0,0.04);
            overflow: hidden;
        }
        .login-header {
            background-color: #000000;
            color: #ffffff;
            padding: 32px;
            text-align: center;
        }
        .btn-buy-custom {
            background-color: #ffea00;
            color: #000000;
            border-radius: 10px;
            font-weight: 800;
            padding: 10px;
            border: none;
            transition: all 0.2s ease;
        }
        .btn-buy-custom:hover {
            background-color: #ffd600;
            color: #000000;
            transform: scale(1.02);
        }
        .btn-buy-custom:disabled {
            opacity: 0.75;
            transform: none;
            cursor: not-allowed;
        }
        .form-control:focus {
            border-color: #000000;
            box-shadow: 0 0 0 0.2rem rgba(0,0,0,0.1);
        }
        .form-control.is-invalid:focus {
            box-shadow: 0 0 0 0.2rem rgba(220,53,69,0.15);
        }
        .campo-senha-wrapper {
            position: relative;
        }
        .btn-toggle-senha {
            position: absolute;
            top: 0;
            right: 0;
            height: 100%;
            padding: 0 14px;
            border: none;
            background: transparent;
            color: #6c757d;
        }
        .btn-toggle-senha:hover {
            color: #000000;
        }
        .credenciais-teste {
            background-color: #f4f5f7;
            border: 1px dashed #c9c9c9;
            border-radius: 10px;
            padding: 10px 14px;
            font-size: 0.8rem;
            color: #444;
        }
        .credenciais-teste b {
            color: #111111;
        }
        .spinner-border-sm-custom {
            width: 1rem;
            height: 1rem;
            border-width: 0.15em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-11 col-sm-8 col-md-5 col-lg-4">
                <div class="card login-card">
                    <div class="login-header">
                        <h3 class="fw-extrabold m-0" style="letter-spacing: -1px;">
                            <i class="bi bi-lightning-charge-fill text-warning"></i> SPORTFIT
                        </h3>
                        <p class="mb-0 small text-white-50 mt-1">Painel Administrativo</p>
                    </div>
                    <div class="card-body p-4 p-md-5">
                        <div id="alerta-erro" class="alert alert-danger py-2 small mb-3<?php echo $erro ? '' : ' d-none'; ?>">
                            <?php echo htmlspecialchars($erro); ?>
                        </div>

                        <form action="api/login.php" method="POST" id="form-login" novalidate>
                            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrfToken); ?>">
                            <div class="mb-3">
                                <label for="usuario" class="form-label fw-semibold small text-uppercase">Usuário</label>
                                <input type="text" class="form-control" id="usuario" name="usuario" required autofocus autocomplete="username">
                                <div class="invalid-feedback">Informe o usuário.</div>
                            </div>
                            <div class="mb-2">
                                <label for="senha" class="form-label fw-semibold small text-uppercase">Senha</label>
                                <div class="campo-senha-wrapper">
                                    <input type="password" class="form-control" id="senha" name="senha" required autocomplete="current-password">
                                    <button type="button" class="btn-toggle-senha" id="btn-toggle-senha" tabindex="-1" aria-label="Mostrar senha">
                                        <i class="bi bi-eye-fill" id="icone-toggle-senha"></i>
                                    </button>
                                </div>
                                <div class="invalid-feedback">Informe a senha.</div>
                            </div>
                            <div class="form-check mb-4">
                                <input class="form-check-input" type="checkbox" id="lembrar-usuario">
                                <label class="form-check-label small text-muted" for="lembrar-usuario">
                                    Lembrar meu usuário neste navegador
                                </label>
                            </div>
                            <button type="submit" class="btn btn-buy-custom w-100" id="btn-entrar">
                                <span id="btn-entrar-texto"><i class="bi bi-box-arrow-in-right me-2"></i>Entrar</span>
                            </button>
                        </form>

                        <div class="credenciais-teste mt-4">
                            <i class="bi bi-info-circle me-1"></i>
                            Acesso de teste (projeto acadêmico): usuário <b>admin</b> / senha <b>admin123</b>
                            — gerado por <code>criar_admin.php</code>.
                        </div>

                        <div class="text-center mt-4">
                            <a href="index.php" class="text-decoration-none text-muted small">
                                <i class="bi bi-arrow-left"></i> Voltar para a loja
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        (function () {
            const form = document.getElementById('form-login');
            const campoUsuario = document.getElementById('usuario');
            const campoSenha = document.getElementById('senha');
            const btnToggleSenha = document.getElementById('btn-toggle-senha');
            const iconeToggleSenha = document.getElementById('icone-toggle-senha');
            const btnEntrar = document.getElementById('btn-entrar');
            const btnEntrarTexto = document.getElementById('btn-entrar-texto');
            const alertaErro = document.getElementById('alerta-erro');
            const lembrarUsuario = document.getElementById('lembrar-usuario');
            const CHAVE_USUARIO_LEMBRADO = 'sportfit_usuario_lembrado';

            // Restaura o usuário lembrado (apenas o nome, nunca a senha)
            const usuarioSalvo = localStorage.getItem(CHAVE_USUARIO_LEMBRADO);
            if (usuarioSalvo) {
                campoUsuario.value = usuarioSalvo;
                lembrarUsuario.checked = true;
                campoSenha.focus();
            }

            // Mostrar/ocultar senha
            btnToggleSenha.addEventListener('click', function () {
                const mostrando = campoSenha.type === 'text';
                campoSenha.type = mostrando ? 'password' : 'text';
                iconeToggleSenha.className = mostrando ? 'bi bi-eye-fill' : 'bi bi-eye-slash-fill';
                btnToggleSenha.setAttribute('aria-label', mostrando ? 'Mostrar senha' : 'Ocultar senha');
            });

            // Validação simples no cliente antes de enviar, além da
            // validação obrigatória que o servidor já faz em api/login.php
            form.addEventListener('submit', function (evento) {
                let valido = true;

                [campoUsuario, campoSenha].forEach(function (campo) {
                    if (campo.value.trim() === '') {
                        campo.classList.add('is-invalid');
                        valido = false;
                    } else {
                        campo.classList.remove('is-invalid');
                    }
                });

                if (!valido) {
                    evento.preventDefault();
                    alertaErro.textContent = 'Preencha usuário e senha para continuar.';
                    alertaErro.classList.remove('d-none');
                    return;
                }

                if (lembrarUsuario.checked) {
                    localStorage.setItem(CHAVE_USUARIO_LEMBRADO, campoUsuario.value.trim());
                } else {
                    localStorage.removeItem(CHAVE_USUARIO_LEMBRADO);
                }

                // Estado de carregamento: evita duplo clique e dá feedback
                // visual enquanto o servidor confere as credenciais.
                btnEntrar.disabled = true;
                btnEntrarTexto.innerHTML = '<span class="spinner-border spinner-border-sm-custom me-2" role="status" aria-hidden="true"></span>Entrando...';
            });

            [campoUsuario, campoSenha].forEach(function (campo) {
                campo.addEventListener('input', function () {
                    campo.classList.remove('is-invalid');
                });
            });
        })();
    </script>
</body>
</html>

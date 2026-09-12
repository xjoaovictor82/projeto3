<?php
session_start();
if (!isset($_SESSION['usuario_id'])) {
    header('Location: login.php');
    exit;
}
$nomeUsuario = $_SESSION['usuario_nome'] ?? 'Admin';
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel Administrativo - SportFit Store</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            background-color: #f4f5f7;
            color: #111111;
            font-family: 'Inter', sans-serif;
            overflow-x: hidden;
        }
        .bg-black-custom { background-color: #000000; }
        .btn-buy-custom {
            background-color: #ffea00;
            color: #000000;
            font-weight: 800;
            border: none;
        }
        .btn-buy-custom:hover { background-color: #ffd600; color: #000000; }
        .card-painel {
            border-radius: 16px;
            border: none;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.06);
        }
        .table thead { background-color: #111111; color: #fff; }
        .badge-estoque-baixo { background-color: #dc3545; }
        .thumb-produto { width: 48px; height: 48px; object-fit: contain; border-radius: 8px; background: #f8f9fa; }
        span.thumb-produto { font-size: 1.1rem; }

        .painel-tabs { border-bottom: 2px solid #e5e7eb; margin-bottom: 1.5rem; }
        .painel-tab {
            border: none;
            background: none;
            padding: 10px 18px;
            font-weight: 700;
            color: #6b7280;
            border-bottom: 3px solid transparent;
            cursor: pointer;
        }
        .painel-tab.active { color: #111111; border-bottom-color: #ffea00; }
        .painel-tab:hover { color: #111111; }
    </style>
</head>
<body>
    <header class="bg-black-custom text-white shadow-sm">
        <div class="container py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h3 class="fw-extrabold m-0" style="letter-spacing: -1px;">
                <i class="bi bi-lightning-charge-fill text-warning"></i> SPORTFIT <span class="fw-normal small text-white-50 d-none d-sm-inline">/ admin</span>
            </h3>
            <div class="d-flex align-items-center gap-2 gap-md-3 flex-wrap">
                <span class="small text-white-50 d-none d-md-inline"><i class="bi bi-person-circle"></i> <?php echo htmlspecialchars($nomeUsuario); ?></span>
                <a href="index.php" class="btn btn-outline-light btn-sm rounded-pill"><i class="bi bi-shop"></i> <span class="d-none d-sm-inline">Ver loja</span></a>
                <a href="api/logout.php" class="btn btn-light btn-sm text-dark fw-semibold rounded-pill"><i class="bi bi-box-arrow-right"></i> <span class="d-none d-sm-inline">Sair</span></a>
            </div>
        </div>
    </header>

    <main class="container my-4">
        <div id="alerta-painel"></div>

        <!-- Navegação por abas -->
        <div class="painel-tabs d-flex gap-2 flex-wrap">
            <button class="painel-tab active" data-tab="dashboard"><i class="bi bi-speedometer2 me-1"></i> Dashboard</button>
            <button class="painel-tab" data-tab="produtos"><i class="bi bi-box-seam me-1"></i> Produtos</button>
            <button class="painel-tab" data-tab="clientes"><i class="bi bi-people me-1"></i> Clientes</button>
            <button class="painel-tab" data-tab="vendas"><i class="bi bi-receipt me-1"></i> Vendas</button>
        </div>

        <!-- ================= DASHBOARD ================= -->
        <section id="secao-dashboard" class="painel-secao">
            <div class="row g-3 mb-4" id="dash-cards-resumo">
                <div class="col-12 text-muted">Carregando indicadores...</div>
            </div>

            <div class="row g-3">
                <div class="col-lg-6">
                    <div class="card card-painel p-4 h-100">
                        <h6 class="fw-bold mb-3"><i class="bi bi-trophy-fill text-warning"></i> Produto mais vendido</h6>
                        <div id="dash-produto-destaque"><p class="text-muted mb-0">Carregando...</p></div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="card card-painel p-4 h-100">
                        <h6 class="fw-bold mb-3"><i class="bi bi-bar-chart-fill"></i> Faturamento por categoria</h6>
                        <div id="dash-categorias"><p class="text-muted mb-0">Carregando...</p></div>
                    </div>
                </div>
                <div class="col-12">
                    <div class="card card-painel p-4">
                        <h6 class="fw-bold mb-3"><i class="bi bi-exclamation-triangle-fill text-danger"></i> Estoque crítico (≤ 5 un)</h6>
                        <div id="dash-estoque-critico"><p class="text-muted mb-0">Carregando...</p></div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ================= PRODUTOS ================= -->
        <section id="secao-produtos" class="painel-secao d-none">
            <div class="card card-painel p-4">
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                    <h5 class="fw-bold m-0"><i class="bi bi-box-seam"></i> Produtos</h5>
                    <button class="btn btn-buy-custom rounded-pill px-3" id="btn-novo-produto">
                        <i class="bi bi-plus-lg me-1"></i> Novo produto
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="table align-middle table-hover">
                        <thead>
                            <tr>
                                <th>Img</th><th>Nome</th><th>Categoria</th><th>Preço custo</th>
                                <th>Preço venda</th><th>Estoque</th><th class="text-end">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="tabela-produtos">
                            <tr><td colspan="7" class="text-center py-4 text-muted">Carregando produtos...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- ================= CLIENTES ================= -->
        <section id="secao-clientes" class="painel-secao d-none">
            <div class="card card-painel p-4">
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                    <h5 class="fw-bold m-0"><i class="bi bi-people"></i> Clientes</h5>
                    <button class="btn btn-buy-custom rounded-pill px-3" id="btn-novo-cliente">
                        <i class="bi bi-plus-lg me-1"></i> Novo cliente
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="table align-middle table-hover">
                        <thead>
                            <tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Histórico</th><th class="text-end">Ações</th></tr>
                        </thead>
                        <tbody id="tabela-clientes">
                            <tr><td colspan="5" class="text-center py-4 text-muted">Carregando clientes...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- ================= VENDAS ================= -->
        <section id="secao-vendas" class="painel-secao d-none">
            <div class="card card-painel p-4">
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                    <h5 class="fw-bold m-0"><i class="bi bi-receipt"></i> Vendas</h5>
                    <button class="btn btn-buy-custom rounded-pill px-3" id="btn-nova-venda">
                        <i class="bi bi-plus-lg me-1"></i> Nova venda
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="table align-middle table-hover">
                        <thead>
                            <tr><th>#</th><th>Data</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Status</th><th class="text-end">Ações</th></tr>
                        </thead>
                        <tbody id="tabela-vendas">
                            <tr><td colspan="7" class="text-center py-4 text-muted">Carregando vendas...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    </main>

    <!-- Modal Produto -->
    <div class="modal fade" id="modalProduto" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content" style="border-radius: 16px;">
                <form id="form-produto">
                    <div class="modal-header">
                        <h5 class="modal-title fw-bold" id="modalProdutoTitulo">Novo produto</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="produto-id" name="id">
                        <div class="mb-3">
                            <label class="form-label small fw-semibold text-uppercase">Nome</label>
                            <input type="text" class="form-control" id="produto-nome" name="nome" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small fw-semibold text-uppercase">Categoria</label>
                            <input type="text" class="form-control" id="produto-categoria" name="categoria" required>
                        </div>
                        <div class="row">
                            <div class="col-6 mb-3">
                                <label class="form-label small fw-semibold text-uppercase">Preço custo</label>
                                <input type="number" step="0.01" min="0" class="form-control" id="produto-preco-custo" name="preco_custo" required>
                            </div>
                            <div class="col-6 mb-3">
                                <label class="form-label small fw-semibold text-uppercase">Preço venda</label>
                                <input type="number" step="0.01" min="0" class="form-control" id="produto-preco-venda" name="preco_venda" required>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small fw-semibold text-uppercase">Estoque atual</label>
                            <input type="number" step="1" min="0" class="form-control" id="produto-estoque" name="estoque_atual" required>
                        </div>
                        <div class="mb-1">
                            <label class="form-label small fw-semibold text-uppercase">Imagem (URL ou caminho)</label>
                            <input type="text" class="form-control" id="produto-imagem" name="imagem" placeholder="img/exemplo.jpg">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary rounded-pill" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-buy-custom rounded-pill px-4">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Modal Cliente -->
    <div class="modal fade" id="modalCliente" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content" style="border-radius: 16px;">
                <form id="form-cliente">
                    <div class="modal-header">
                        <h5 class="modal-title fw-bold" id="modalClienteTitulo">Novo cliente</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="cliente-id" name="id">
                        <div class="mb-3">
                            <label class="form-label small fw-semibold text-uppercase">Nome</label>
                            <input type="text" class="form-control" id="cliente-nome" name="nome" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small fw-semibold text-uppercase">E-mail</label>
                            <input type="email" class="form-control" id="cliente-email" name="email">
                        </div>
                        <div class="mb-1">
                            <label class="form-label small fw-semibold text-uppercase">Telefone</label>
                            <input type="text" class="form-control" id="cliente-telefone" name="telefone" placeholder="(44) 99999-0000">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary rounded-pill" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-buy-custom rounded-pill px-4">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Modal Venda -->
    <div class="modal fade" id="modalVenda" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content" style="border-radius: 16px;">
                <form id="form-venda">
                    <div class="modal-header">
                        <h5 class="modal-title fw-bold">Nova venda</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div id="alerta-venda"></div>
                        <div class="mb-3">
                            <label class="form-label small fw-semibold text-uppercase">Cliente</label>
                            <select class="form-select" id="venda-cliente">
                                <option value="">Consumidor não identificado</option>
                            </select>
                        </div>
                        <hr>
                        <div class="row g-2 align-items-end mb-3">
                            <div class="col-7">
                                <label class="form-label small fw-semibold text-uppercase">Produto</label>
                                <select class="form-select" id="venda-produto"></select>
                            </div>
                            <div class="col-3">
                                <label class="form-label small fw-semibold text-uppercase">Qtd</label>
                                <input type="number" min="1" value="1" class="form-control" id="venda-quantidade">
                            </div>
                            <div class="col-2">
                                <button type="button" class="btn btn-dark w-100" id="btn-adicionar-item-venda"><i class="bi bi-plus-lg"></i></button>
                            </div>
                        </div>
                        <div id="venda-carrinho-lista" class="mb-2"></div>
                        <div class="d-flex justify-content-between fw-bold border-top pt-2">
                            <span>Total</span>
                            <span id="venda-carrinho-total">R$ 0,00</span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary rounded-pill" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-buy-custom rounded-pill px-4">Finalizar venda</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <!-- JS compilado a partir de js/app_admin.ts (type="module" por causa do export {} do TS) -->
    <script type="module" src="js/app_admin.js"></script>
</body>
</html>

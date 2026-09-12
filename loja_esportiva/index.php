<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SportFit Store</title>
    <!-- Bootstrap CSS e Ícones -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/index.css">
</head>
<body>

    <!-- Header / Navbar Principal -->
    <header class="bg-black-custom text-white sticky-top shadow-sm">
        <div class="container py-3">
            <div class="row align-items-center g-2">
                <div class="col-6 col-md-2 order-md-0">
                    <h3 class="fw-extrabold m-0 tracking-wider cursor-pointer btn-categoria" data-categoria="todas" style="letter-spacing: -1px; font-size: clamp(1.15rem, 4vw, 1.75rem);">
                        <i class="bi bi-lightning-charge-fill text-warning"></i> SPORTFIT
                    </h3>
                </div>
                <div class="col-6 col-md-4 text-end order-md-2">
                    <a href="login.php" class="btn btn-outline-light btn-sm me-2 fw-semibold rounded-pill px-3" id="btn-login">
                        <i class="bi bi-person"></i> <span class="d-none d-sm-inline">Entrar</span>
                    </a>
                    <button class="btn btn-light btn-sm text-dark fw-bold rounded-pill px-3" id="btn-carrinho">
                        <i class="bi bi-bag-check-fill me-1"></i> <span id="cart-count">0</span>
                    </button>
                </div>
                <div class="col-12 col-md-6 order-md-1">
                    <form id="form-busca" class="search-box input-group">
                        <input type="text" id="campo-busca" class="form-control border-0 shadow-none px-3 text-dark" placeholder="O que você está procurando hoje?">
                        <button type="submit" class="btn btn-white text-dark px-3"><i class="bi bi-search"></i></button>
                    </form>
                </div>
            </div>
        </div>
        
        <!-- Menu de Categorias: gerado em JS a partir de api/categorias.php,
             então nunca fica fora de sincronia com o que existe no banco -->
        <div class="nav-categories py-2">
            <div id="nav-categorias" class="container d-flex justify-content-start justify-content-md-between text-uppercase gap-2 overflow-auto">
                <a href="javascript:void(0)" class="btn-categoria active" data-categoria="todas"><i class="bi bi-grid-fill me-1"></i> Todos</a>
            </div>
        </div>
    </header>

    <!-- Barra Amarela de Aviso/Parcelamento -->
    <div class="top-promo-bar text-center py-2 shadow-sm">
        <i class="bi bi-credit-card me-1"></i> ESCOLHA E PARCELE EM ATÉ 10X SEM JUROS NOS CARTÕES
    </div>

    <!-- Hero em Vídeo: primeira impressão da loja -->
    <section class="hero-video-section">
        <video autoplay muted loop playsinline id="hero-video"
               poster="img/banner1.jpg"
               onerror="this.closest('.hero-video-section').classList.add('hero-video-fallback')">
            <source src="https://assets.mixkit.co/videos/52106/52106-720.mp4" type="video/mp4">
        </video>
        <div class="hero-video-overlay">
            <h1><i class="bi bi-lightning-charge-fill text-warning"></i> Treine sem limites</h1>
            <p>Camisetas dry fit, tênis de corrida, chuteiras e acessórios para quem não para. Equipamento de verdade para o seu treino de verdade.</p>
            <a href="#vitrine-produtos" class="btn btn-buy-custom">
                <i class="bi bi-bag-check-fill me-2"></i>Ver produtos
            </a>
        </div>
        <button type="button" class="hero-mute-toggle" id="btn-mute-hero" title="Ativar/desativar som do vídeo">
            <i class="bi bi-volume-mute-fill" id="icone-mute"></i>
        </button>
    </section>

    <!-- Banner de Ofertas Rápidas -->
    <div class="container my-4">
        <div class="row g-3">
            <div class="col-6 col-md-3">
                <div class="promo-card">2 por R$ 99,90</div>
            </div>
            <div class="col-6 col-md-3">
                <div class="promo-card">2 por R$ 129,90</div>
            </div>
            <div class="col-6 col-md-3">
                <div class="promo-card">Produtos até R$ 99,99</div>
            </div>
            <div class="col-6 col-md-3">
                <div class="promo-card promo-outline">OUTLET</div>
            </div>
        </div>
    </div>

    <!-- Vitrine de Produtos -->
    <main class="container mb-5">
        <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
            <div>
                <h4 class="fw-bold m-0 text-uppercase tracking-tight text-dark" id="titulo-vitrine">Destaques para você</h4>
            </div>
            <span class="badge bg-light text-dark border px-3 py-2 rounded-pill fw-normal" id="total-produtos">Carregando...</span>
        </div>
        
        <div id="vitrine-produtos" class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
            <!-- O JS (js/app.js, compilado de js/app.ts) gera os produtos aqui -->
        </div>
    </main>

    <!-- Sobre a SportFit -->
    <section class="bg-black-custom text-white py-5 mt-5">
        <div class="container">
            <div class="row g-4 align-items-center">
                <div class="col-lg-6">
                    <h3 class="fw-extrabold text-uppercase mb-3" style="letter-spacing: -1px;">
                        <i class="bi bi-lightning-charge-fill text-warning"></i> Sobre a SportFit
                    </h3>
                    <p class="text-white-50 mb-3">
                        A SportFit nasceu para quem treina todo dia: corrida de rua, futebol de fim de semana
                        ou musculação na academia. Trabalhamos com camisetas dry fit, calçados esportivos,
                        shorts de compressão e acessórios de treino, sempre com preço justo e parcelamento
                        facilitado.
                    </p>
                    <p class="text-white-50 mb-0">
                        Todo o catálogo é gerenciado pelo nosso próprio painel administrativo, com estoque,
                        vendas e indicadores atualizados em tempo real — sem depender de planilha.
                    </p>
                </div>
                <div class="col-lg-6">
                    <div class="row g-3 text-center">
                        <div class="col-6">
                            <div class="p-3 border border-secondary rounded-3">
                                <i class="bi bi-truck fs-3 text-warning"></i>
                                <p class="small fw-semibold mb-0 mt-2">Entrega para todo o Brasil</p>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="p-3 border border-secondary rounded-3">
                                <i class="bi bi-arrow-repeat fs-3 text-warning"></i>
                                <p class="small fw-semibold mb-0 mt-2">Troca grátis em 30 dias</p>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="p-3 border border-secondary rounded-3">
                                <i class="bi bi-shield-check fs-3 text-warning"></i>
                                <p class="small fw-semibold mb-0 mt-2">Compra 100% segura</p>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="p-3 border border-secondary rounded-3">
                                <i class="bi bi-credit-card-2-front fs-3 text-warning"></i>
                                <p class="small fw-semibold mb-0 mt-2">Até 10x sem juros</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <footer class="bg-black-custom text-white-50 text-center py-3 small border-top border-secondary">
        &copy; <?php echo date('Y'); ?> SportFit Store — Projeto acadêmico ADS.
    </footer>

    <!-- Modal de Checkout: abre ao clicar em "Comprar", com opções de
         pagamento (Débito, Crédito e Pix) igual a uma loja de verdade. -->
    <div class="modal fade" id="modal-checkout" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fw-bold"><i class="bi bi-bag-check-fill me-2"></i>Finalizar compra</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <div class="modal-body">

                    <!-- Tela de pagamento -->
                    <div id="checkout-tela-pagamento">
                        <!-- Resumo do produto -->
                        <div class="checkout-resumo-produto d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <p class="text-muted small mb-1">Produto</p>
                                <p class="fw-bold mb-0" id="checkout-nome-produto">-</p>
                            </div>
                            <div class="text-end">
                                <p class="text-muted small mb-1">Total</p>
                                <p class="fw-extrabold mb-0 fs-5" id="checkout-preco-produto">-</p>
                            </div>
                        </div>

                        <p class="fw-semibold mb-2">Escolha a forma de pagamento</p>
                        <div class="checkout-metodos mb-4">
                            <div class="metodo-pagamento" data-metodo="credito">
                                <i class="bi bi-credit-card-fill"></i>
                                <span>Crédito</span>
                            </div>
                            <div class="metodo-pagamento" data-metodo="debito">
                                <i class="bi bi-credit-card-2-back-fill"></i>
                                <span>Débito</span>
                            </div>
                            <div class="metodo-pagamento" data-metodo="pix">
                                <i class="bi bi-qr-code"></i>
                                <span>Pix</span>
                            </div>
                        </div>

                        <!-- Formulário Cartão (Crédito e Débito usam o mesmo formulário) -->
                        <div class="checkout-form-pagamento" id="checkout-form-cartao">
                            <div class="mb-3">
                                <label class="form-label small fw-semibold">Número do cartão</label>
                                <input type="text" class="form-control" id="checkout-cartao-numero" placeholder="0000 0000 0000 0000" maxlength="19">
                            </div>
                            <div class="mb-3">
                                <label class="form-label small fw-semibold">Nome impresso no cartão</label>
                                <input type="text" class="form-control" id="checkout-cartao-nome" placeholder="Como está no cartão">
                            </div>
                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <label class="form-label small fw-semibold">Validade</label>
                                    <input type="text" class="form-control" id="checkout-cartao-validade" placeholder="MM/AA" maxlength="5">
                                </div>
                                <div class="col-6">
                                    <label class="form-label small fw-semibold">CVV</label>
                                    <input type="text" class="form-control" id="checkout-cartao-cvv" placeholder="123" maxlength="4">
                                </div>
                            </div>
                            <div class="mb-2" id="checkout-parcelas-wrapper">
                                <label class="form-label small fw-semibold">Parcelas</label>
                                <select class="form-select" id="checkout-cartao-parcelas">
                                    <option value="1">1x sem juros</option>
                                </select>
                            </div>
                        </div>

                        <!-- Pix -->
                        <div class="checkout-form-pagamento" id="checkout-form-pix">
                            <div class="checkout-pix-box">
                                <div class="pix-icone"><i class="bi bi-qr-code"></i></div>
                                <p class="fw-semibold mb-1">Pague com Pix</p>
                                <p class="text-muted small mb-0">Escaneie o QR Code ou copie o código abaixo no app do seu banco. Aprovação em poucos segundos.</p>
                                <div class="input-group mt-3">
                                    <input type="text" class="form-control text-truncate" id="checkout-pix-codigo" value="00020126580014BR.GOV.BCB.PIX0136sportfit-store-simulacao520400005303986540510.005802BR5913SportFit Loja6009SAO PAULO62070503***6304ABCD" readonly>
                                    <button class="btn btn-outline-dark" type="button" id="btn-copiar-pix"><i class="bi bi-clipboard"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tela de sucesso -->
                    <div class="checkout-sucesso" id="checkout-tela-sucesso">
                        <i class="bi bi-check-circle-fill"></i>
                        <h5 class="fw-bold mt-3 mb-1">Pedido confirmado!</h5>
                        <p class="text-muted mb-0">Recebemos seu pagamento e já vamos preparar seu produto para envio.</p>
                    </div>

                </div>
                <div class="modal-footer border-0 pt-0" id="checkout-rodape-pagamento">
                    <button type="button" class="btn btn-light w-100 mb-2" data-bs-dismiss="modal">Continuar comprando</button>
                    <button type="button" class="btn btn-finalizar-compra w-100" id="btn-finalizar-compra" disabled>Selecione uma forma de pagamento</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Painel lateral do Carrinho: abre ao clicar no botão do carrinho -->
    <div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvas-carrinho" aria-labelledby="offcanvas-carrinho-titulo">
        <div class="offcanvas-header border-bottom">
            <h5 class="offcanvas-title fw-bold" id="offcanvas-carrinho-titulo">
                <i class="bi bi-bag-check-fill me-2"></i>Seu carrinho
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Fechar"></button>
        </div>
        <div class="offcanvas-body d-flex flex-column p-0">
            <div id="carrinho-lista" class="flex-grow-1 overflow-auto px-3">
                <!-- Itens do carrinho gerados via JS (js/app.js) -->
            </div>
            <div class="border-top p-3" id="carrinho-rodape" style="display: none;">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="fw-semibold">Total</span>
                    <span class="fw-extrabold fs-5" id="carrinho-total">R$ 0,00</span>
                </div>
                <button class="btn btn-finalizar-compra w-100" id="btn-finalizar-carrinho">
                    <i class="bi bi-lock-fill me-2"></i>Finalizar compra
                </button>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <!-- JS compilado a partir de js/app.ts (type="module" por causa do export {} do TS) -->
    <script type="module" src="js/app.js"></script>

    <!-- Controle simples de som do vídeo de hero (fica mudo por padrão
         para o autoplay funcionar em todos os navegadores) -->
    <script>
        (function () {
            const video = document.getElementById('hero-video');
            const botao = document.getElementById('btn-mute-hero');
            const icone = document.getElementById('icone-mute');
            if (!video || !botao || !icone) return;

            botao.addEventListener('click', function () {
                video.muted = !video.muted;
                icone.className = video.muted ? 'bi bi-volume-mute-fill' : 'bi bi-volume-up-fill';
            });
        })();
    </script>
</body>
</html>
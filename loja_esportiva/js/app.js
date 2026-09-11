var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const API_PRODUTOS = "api/listas_produtos.php";
const API_CATEGORIAS = "api/categorias.php";
let todosProdutos = [];
function normalizarTexto(texto) {
    if (!texto)
        return "";
    return texto
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}
function estiloCategoria(categoria) {
    const cat = normalizarTexto(categoria);
    if (cat.includes("calcado"))
        return { icone: "bi-stopwatch-fill", cor: "#c2410c" };
    if (cat.includes("camiset"))
        return { icone: "bi-bag-fill", cor: "#1d4ed8" };
    if (cat.includes("short"))
        return { icone: "bi-bounding-box-circles", cor: "#15803d" };
    if (cat.includes("acessorio"))
        return { icone: "bi-droplet-fill", cor: "#0891b2" };
    if (cat.includes("bola"))
        return { icone: "bi-circle-fill", cor: "#b91c1c" };
    if (cat.includes("casaco") || cat.includes("jaqueta"))
        return { icone: "bi-cloud-fill", cor: "#334155" };
    return { icone: "bi-trophy-fill", cor: "#111111" };
}
function mostrarPlaceholder(img, icone, cor) {
    const div = document.createElement("div");
    div.className = "produto-placeholder d-flex align-items-center justify-content-center h-100";
    div.style.background = `linear-gradient(135deg, ${cor}, #000000)`;
    div.style.borderRadius = "10px";
    div.innerHTML = `<i class="bi ${icone} text-warning" style="font-size: 3rem;"></i>`;
    img.replaceWith(div);
}
// Expõe para o atributo onerror inline no HTML gerado
window.mostrarPlaceholder = mostrarPlaceholder;
function carregarCategorias() {
    return __awaiter(this, void 0, void 0, function* () {
        const nav = document.getElementById("nav-categorias");
        if (!nav)
            return;
        try {
            const resposta = yield fetch(API_CATEGORIAS);
            const categorias = yield resposta.json();
            // map: transforma cada categoria do banco num link de navegação,
            // sempre em sincronia com o que realmente existe em produtos.categoria
            const linksHtml = categorias
                .map((cat) => `<a href="javascript:void(0)" class="btn-categoria" data-categoria="${cat}">${cat}</a>`)
                .join("");
            nav.innerHTML = `<a href="javascript:void(0)" class="btn-categoria active" data-categoria="todas"><i class="bi bi-grid-fill me-1"></i> Todos</a>${linksHtml}`;
            document.querySelectorAll(".btn-categoria").forEach((btn) => {
                btn.addEventListener("click", () => {
                    var _a;
                    document.querySelectorAll(".btn-categoria").forEach((b) => b.classList.remove("active"));
                    btn.classList.add("active");
                    const categoria = (_a = btn.getAttribute("data-categoria")) !== null && _a !== void 0 ? _a : "todas";
                    filtrarCategoria(categoria);
                });
            });
        }
        catch (erro) {
            console.error("Erro ao carregar categorias:", erro);
        }
    });
}
function carregarLoja() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const resposta = yield fetch(API_PRODUTOS);
            todosProdutos = (yield resposta.json());
            renderizarProdutos(todosProdutos);
        }
        catch (erro) {
            console.error("Erro ao carregar a loja:", erro);
            const vitrine = document.getElementById("vitrine-produtos");
            if (vitrine)
                vitrine.innerHTML = `<div class="w-100 text-center text-danger py-5">Erro ao carregar os produtos.</div>`;
        }
    });
}
function renderizarProdutos(lista) {
    const vitrine = document.getElementById("vitrine-produtos");
    const contador = document.getElementById("total-produtos");
    if (!vitrine)
        return;
    if (contador)
        contador.innerText = `${lista.length} produto(s) encontrado(s)`;
    // Edge case: nenhuma categoria/busca bate com produto nenhum
    if (lista.length === 0) {
        vitrine.innerHTML = `<div class="w-100 text-center text-muted py-5 fs-5">Nenhum produto encontrado nesta categoria.</div>`;
        return;
    }
    vitrine.innerHTML = lista.map(cartaoProduto).join("");
    document.querySelectorAll(".btn-comprar").forEach((btn) => {
        btn.onclick = () => {
            var _a, _b, _c;
            const nome = (_a = btn.getAttribute("data-nome")) !== null && _a !== void 0 ? _a : "";
            const preco = parseFloat((_b = btn.getAttribute("data-preco")) !== null && _b !== void 0 ? _b : "0");
            const imagem = (_c = btn.getAttribute("data-imagem")) !== null && _c !== void 0 ? _c : "";
            adicionarAoCarrinho(nome, preco, imagem);
            mostrarFeedbackComprar(btn);
        };
    });
}
let carrinho = [];
function mostrarFeedbackComprar(botao) {
    const htmlOriginal = botao.innerHTML;
    botao.innerHTML = `<i class="bi bi-check-lg me-2"></i>Adicionado!`;
    botao.classList.add("adicionado");
    botao.disabled = true;
    setTimeout(() => {
        botao.innerHTML = htmlOriginal;
        botao.classList.remove("adicionado");
        botao.disabled = false;
    }, 900);
}
function adicionarAoCarrinho(nome, preco, imagem) {
    const itemExistente = carrinho.find((item) => item.nome === nome);
    if (itemExistente) {
        itemExistente.quantidade++;
    }
    else {
        carrinho.push({ nome, preco, imagem, quantidade: 1 });
    }
    atualizarContadorCarrinho();
}
function atualizarContadorCarrinho() {
    const total = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
    const contadorCarrinho = document.getElementById("cart-count");
    if (contadorCarrinho)
        contadorCarrinho.innerText = String(total);
}
function calcularTotalCarrinho() {
    return carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
}
function itemCarrinhoHtml(item) {
    const temImagem = Boolean(item.imagem && item.imagem.trim() !== "");
    const imagemHtml = temImagem
        ? `<img src="${item.imagem}" alt="${item.nome}">`
        : `<i class="bi bi-trophy-fill"></i>`;
    return `
    <div class="carrinho-item">
      <div class="carrinho-item-imagem">${imagemHtml}</div>
      <div class="flex-grow-1">
        <p class="fw-semibold mb-1" style="font-size: 0.9rem;">${item.nome}</p>
        <p class="text-muted small mb-2">${formatarMoeda(item.preco)} un.</p>
        <div class="d-flex justify-content-between align-items-center">
          <div class="carrinho-qtd-controle">
            <button type="button" class="btn-carrinho-menos" data-nome="${item.nome}">-</button>
            <span>${item.quantidade}</span>
            <button type="button" class="btn-carrinho-mais" data-nome="${item.nome}">+</button>
          </div>
          <button type="button" class="carrinho-item-remover" data-nome="${item.nome}">Remover</button>
        </div>
      </div>
    </div>`;
}
function renderizarCarrinho() {
    const lista = document.getElementById("carrinho-lista");
    const rodape = document.getElementById("carrinho-rodape");
    const totalEl = document.getElementById("carrinho-total");
    if (!lista)
        return;
    if (carrinho.length === 0) {
        lista.innerHTML = `<div class="carrinho-vazio"><i class="bi bi-bag-x"></i>Seu carrinho está vazio.</div>`;
        if (rodape)
            rodape.style.display = "none";
        return;
    }
    if (rodape)
        rodape.style.display = "block";
    lista.innerHTML = carrinho.map(itemCarrinhoHtml).join("");
    if (totalEl)
        totalEl.innerText = formatarMoeda(calcularTotalCarrinho());
    document.querySelectorAll(".btn-carrinho-mais").forEach((btn) => {
        btn.onclick = () => { var _a; return alterarQuantidadeCarrinho((_a = btn.getAttribute("data-nome")) !== null && _a !== void 0 ? _a : "", 1); };
    });
    document.querySelectorAll(".btn-carrinho-menos").forEach((btn) => {
        btn.onclick = () => { var _a; return alterarQuantidadeCarrinho((_a = btn.getAttribute("data-nome")) !== null && _a !== void 0 ? _a : "", -1); };
    });
    document.querySelectorAll(".carrinho-item-remover").forEach((btn) => {
        btn.onclick = () => { var _a; return removerDoCarrinho((_a = btn.getAttribute("data-nome")) !== null && _a !== void 0 ? _a : ""); };
    });
}
function alterarQuantidadeCarrinho(nome, delta) {
    const item = carrinho.find((i) => i.nome === nome);
    if (!item)
        return;
    item.quantidade += delta;
    if (item.quantidade <= 0) {
        carrinho = carrinho.filter((i) => i.nome !== nome);
    }
    atualizarContadorCarrinho();
    renderizarCarrinho();
}
function removerDoCarrinho(nome) {
    carrinho = carrinho.filter((i) => i.nome !== nome);
    atualizarContadorCarrinho();
    renderizarCarrinho();
}
function configurarCarrinho() {
    const btnCarrinho = document.getElementById("btn-carrinho");
    const offcanvasEl = document.getElementById("offcanvas-carrinho");
    if (btnCarrinho && offcanvasEl) {
        btnCarrinho.onclick = () => {
            renderizarCarrinho();
            const bootstrap = window.bootstrap;
            const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
            offcanvas.show();
        };
    }
    const btnFinalizarCarrinho = document.getElementById("btn-finalizar-carrinho");
    btnFinalizarCarrinho === null || btnFinalizarCarrinho === void 0 ? void 0 : btnFinalizarCarrinho.addEventListener("click", () => {
        var _a;
        if (carrinho.length === 0 || !offcanvasEl)
            return;
        const bootstrap = window.bootstrap;
        (_a = bootstrap.Offcanvas.getInstance(offcanvasEl)) === null || _a === void 0 ? void 0 : _a.hide();
        const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
        const rotulo = `Carrinho (${totalItens} ${totalItens === 1 ? "item" : "itens"})`;
        abrirCheckout(rotulo, calcularTotalCarrinho());
    });
}
// ============================================================
// Checkout: modal de pagamento (Crédito, Débito e Pix)
// ============================================================
let checkoutProduto = null;
let checkoutMetodoSelecionado = null;
function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function abrirCheckout(nome, preco) {
    checkoutProduto = { nome, preco };
    checkoutMetodoSelecionado = null;
    const nomeEl = document.getElementById("checkout-nome-produto");
    const precoEl = document.getElementById("checkout-preco-produto");
    if (nomeEl)
        nomeEl.innerText = nome;
    if (precoEl)
        precoEl.innerText = formatarMoeda(preco);
    popularParcelas(preco);
    resetarFormularioCheckout();
    const modalEl = document.getElementById("modal-checkout");
    if (!modalEl)
        return;
    const bootstrap = window.bootstrap;
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}
function popularParcelas(preco) {
    const select = document.getElementById("checkout-cartao-parcelas");
    if (!select)
        return;
    // Máximo de 10x sem juros, igual à faixa anunciada na barra amarela do topo
    const maxParcelas = 10;
    let opcoes = "";
    for (let i = 1; i <= maxParcelas; i++) {
        const valorParcela = formatarMoeda(preco / i);
        opcoes += `<option value="${i}">${i}x de ${valorParcela} sem juros</option>`;
    }
    select.innerHTML = opcoes;
}
function resetarFormularioCheckout() {
    checkoutMetodoSelecionado = null;
    document.querySelectorAll(".metodo-pagamento").forEach((el) => el.classList.remove("selecionado"));
    document.querySelectorAll(".checkout-form-pagamento").forEach((el) => el.classList.remove("ativo"));
    const camposCartao = ["checkout-cartao-numero", "checkout-cartao-nome", "checkout-cartao-validade", "checkout-cartao-cvv"];
    camposCartao.forEach((id) => {
        const campo = document.getElementById(id);
        if (campo)
            campo.value = "";
    });
    const telaPagamento = document.getElementById("checkout-tela-pagamento");
    const telaSucesso = document.getElementById("checkout-tela-sucesso");
    const rodape = document.getElementById("checkout-rodape-pagamento");
    if (telaPagamento)
        telaPagamento.style.display = "block";
    if (telaSucesso)
        telaSucesso.classList.remove("ativo");
    if (rodape)
        rodape.style.display = "flex";
    atualizarBotaoFinalizar();
}
function atualizarBotaoFinalizar() {
    const botao = document.getElementById("btn-finalizar-compra");
    if (!botao)
        return;
    if (!checkoutMetodoSelecionado || !checkoutProduto) {
        botao.disabled = true;
        botao.innerText = "Selecione uma forma de pagamento";
        return;
    }
    botao.disabled = false;
    botao.innerText = `Finalizar compra · ${formatarMoeda(checkoutProduto.preco)}`;
}
function selecionarMetodoPagamento(metodo) {
    checkoutMetodoSelecionado = metodo;
    document.querySelectorAll(".metodo-pagamento").forEach((el) => {
        el.classList.toggle("selecionado", el.getAttribute("data-metodo") === metodo);
    });
    const formCartao = document.getElementById("checkout-form-cartao");
    const formPix = document.getElementById("checkout-form-pix");
    const parcelasWrapper = document.getElementById("checkout-parcelas-wrapper");
    if (metodo === "pix") {
        formCartao === null || formCartao === void 0 ? void 0 : formCartao.classList.remove("ativo");
        formPix === null || formPix === void 0 ? void 0 : formPix.classList.add("ativo");
    }
    else {
        formPix === null || formPix === void 0 ? void 0 : formPix.classList.remove("ativo");
        formCartao === null || formCartao === void 0 ? void 0 : formCartao.classList.add("ativo");
        // Débito não parcela, só o crédito
        if (parcelasWrapper)
            parcelasWrapper.style.display = metodo === "credito" ? "block" : "none";
    }
    atualizarBotaoFinalizar();
}
function finalizarCompra() {
    if (!checkoutProduto || !checkoutMetodoSelecionado)
        return;
    carrinho = [];
    atualizarContadorCarrinho();
    const telaPagamento = document.getElementById("checkout-tela-pagamento");
    const telaSucesso = document.getElementById("checkout-tela-sucesso");
    const rodape = document.getElementById("checkout-rodape-pagamento");
    if (telaPagamento)
        telaPagamento.style.display = "none";
    if (telaSucesso)
        telaSucesso.classList.add("ativo");
    if (rodape)
        rodape.style.display = "none";
}
function configurarCheckout() {
    document.querySelectorAll(".metodo-pagamento").forEach((el) => {
        el.addEventListener("click", () => {
            const metodo = el.getAttribute("data-metodo");
            if (metodo)
                selecionarMetodoPagamento(metodo);
        });
    });
    const botaoFinalizar = document.getElementById("btn-finalizar-compra");
    botaoFinalizar === null || botaoFinalizar === void 0 ? void 0 : botaoFinalizar.addEventListener("click", finalizarCompra);
    const botaoCopiarPix = document.getElementById("btn-copiar-pix");
    botaoCopiarPix === null || botaoCopiarPix === void 0 ? void 0 : botaoCopiarPix.addEventListener("click", () => {
        var _a;
        const campoPix = document.getElementById("checkout-pix-codigo");
        if (!campoPix)
            return;
        campoPix.select();
        (_a = navigator.clipboard) === null || _a === void 0 ? void 0 : _a.writeText(campoPix.value).catch(() => { });
        const icone = botaoCopiarPix.querySelector("i");
        if (icone) {
            icone.className = "bi bi-check2";
            setTimeout(() => (icone.className = "bi bi-clipboard"), 1500);
        }
    });
    const modalEl = document.getElementById("modal-checkout");
    modalEl === null || modalEl === void 0 ? void 0 : modalEl.addEventListener("hidden.bs.modal", () => {
        resetarFormularioCheckout();
        checkoutProduto = null;
    });
}
function cartaoProduto(prod) {
    var _a;
    const precoFormatado = parseFloat(prod.preco_venda).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
    const esgotado = prod.estoque_atual <= 0;
    const botaoHtml = esgotado
        ? `<button class="btn btn-secondary w-100 rounded-3 py-2 fw-semibold" disabled>Esgotado</button>`
        : `<button class="btn btn-buy-custom w-100 btn-comprar" data-nome="${prod.nome}" data-preco="${prod.preco_venda}" data-imagem="${(_a = prod.imagem) !== null && _a !== void 0 ? _a : ""}"><i class="bi bi-cart-plus me-2"></i>Comprar</button>`;
    const estilo = estiloCategoria(prod.categoria);
    const temImagem = Boolean(prod.imagem && prod.imagem.trim() !== "");
    const imagemHtml = temImagem
        ? `<img src="${prod.imagem}" alt="${prod.nome}" class="card-img-top" style="height: 190px; width: 100%; object-fit: contain;" onerror="mostrarPlaceholder(this, '${estilo.icone}', '${estilo.cor}')">`
        : `<div class="produto-placeholder d-flex align-items-center justify-content-center h-100" style="background: linear-gradient(135deg, ${estilo.cor}, #000000); border-radius: 10px;"><i class="bi ${estilo.icone} text-warning" style="font-size: 3rem;"></i></div>`;
    return `
    <div class="col">
      <div class="card product-card h-100 shadow-sm">
        <div class="product-img-container text-center p-3" style="height: 220px;">
          <span class="badge-category">${prod.categoria}</span>
          ${imagemHtml}
        </div>
        <div class="card-body d-flex flex-column justify-content-between p-3">
          <div>
            <h6 class="card-title text-dark fw-bold mb-1" style="font-size: 0.95rem;">${prod.nome}</h6>
            <p class="text-muted small mb-2" style="font-size: 0.8rem;">Estoque: ${prod.estoque_atual} un</p>
          </div>
          <div>
            <h5 class="text-dark fw-extrabold mb-3" style="font-size: 1.25rem;">${precoFormatado}</h5>
            ${botaoHtml}
          </div>
        </div>
      </div>
    </div>`;
}
function filtrarCategoria(categoria) {
    const titulo = document.getElementById("titulo-vitrine");
    const termoBuscado = normalizarTexto(categoria);
    if (termoBuscado === "todas" || termoBuscado === "") {
        if (titulo)
            titulo.innerText = "Destaques para você";
        renderizarProdutos(todosProdutos);
        return;
    }
    if (titulo)
        titulo.innerText = `Categoria: ${categoria.toUpperCase()}`;
    const filtrados = todosProdutos.filter((p) => normalizarTexto(p.categoria).includes(termoBuscado));
    renderizarProdutos(filtrados);
}
function configurarBusca() {
    const formBusca = document.getElementById("form-busca");
    const campoBusca = document.getElementById("campo-busca");
    if (!formBusca || !campoBusca)
        return;
    formBusca.addEventListener("submit", (evento) => {
        evento.preventDefault();
        const termo = normalizarTexto(campoBusca.value);
        const titulo = document.getElementById("titulo-vitrine");
        if (!termo) {
            filtrarCategoria("todas");
            return;
        }
        if (titulo)
            titulo.innerText = `Resultado para: "${campoBusca.value}"`;
        const resultado = todosProdutos.filter((p) => normalizarTexto(p.nome).includes(termo) || normalizarTexto(p.categoria).includes(termo));
        renderizarProdutos(resultado);
    });
}
document.addEventListener("DOMContentLoaded", () => {
    carregarCategorias();
    carregarLoja();
    configurarBusca();
    configurarCheckout();
    configurarCarrinho();
});
export {};

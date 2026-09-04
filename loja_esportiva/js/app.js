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
let carrinhoItens = [];
// Instâncias Bootstrap (criadas uma vez, reaproveitadas em todo clique)
let offcanvasCarrinho = null;
let modalDetalheProduto = null;
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
function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
// ============================================================
// Carrinho
// ============================================================
function atualizarContadorCarrinho() {
    const total = carrinhoItens.reduce((soma, item) => soma + item.quantidade, 0);
    const contadorCarrinho = document.getElementById("cart-count");
    if (contadorCarrinho)
        contadorCarrinho.innerText = String(total);
}
function mostrarToast(mensagem) {
    const toastEl = document.getElementById("toast-carrinho");
    const textoEl = document.getElementById("toast-carrinho-texto");
    if (!toastEl || !textoEl)
        return;
    textoEl.innerHTML = `<i class="bi bi-check-circle-fill text-warning me-2"></i>${mensagem}`;
    // @ts-ignore - bootstrap vem do bundle carregado via CDN, sem tipos
    const toast = new bootstrap.Toast(toastEl, { delay: 2500 });
    toast.show();
}
function adicionarAoCarrinho(produto, quantidade = 1) {
    const existente = carrinhoItens.find((i) => i.id === produto.id);
    const preco = parseFloat(produto.preco_venda);
    if (existente) {
        existente.quantidade = Math.min(existente.quantidade + quantidade, produto.estoque_atual);
    }
    else {
        carrinhoItens.push({
            id: produto.id,
            nome: produto.nome,
            preco,
            imagem: produto.imagem,
            categoria: produto.categoria,
            estoque_atual: produto.estoque_atual,
            quantidade: Math.min(quantidade, produto.estoque_atual),
        });
    }
    atualizarContadorCarrinho();
    renderizarCarrinho();
    mostrarToast(`"${produto.nome}" adicionado ao carrinho!`);
}
function alterarQuantidade(id, delta) {
    const item = carrinhoItens.find((i) => i.id === id);
    if (!item)
        return;
    item.quantidade += delta;
    if (item.quantidade <= 0) {
        carrinhoItens = carrinhoItens.filter((i) => i.id !== id);
    }
    else if (item.quantidade > item.estoque_atual) {
        item.quantidade = item.estoque_atual;
    }
    atualizarContadorCarrinho();
    renderizarCarrinho();
}
function removerDoCarrinho(id) {
    carrinhoItens = carrinhoItens.filter((i) => i.id !== id);
    atualizarContadorCarrinho();
    renderizarCarrinho();
}
function itemCarrinhoHtml(item) {
    const estilo = estiloCategoria(item.categoria);
    const temImagem = Boolean(item.imagem && item.imagem.trim() !== "");
    const imagemHtml = temImagem
        ? `<img src="${item.imagem}" alt="${item.nome}" class="carrinho-item-img" onerror="mostrarPlaceholder(this, '${estilo.icone}', '${estilo.cor}')">`
        : `<div class="carrinho-item-img d-flex align-items-center justify-content-center" style="background: linear-gradient(135deg, ${estilo.cor}, #000000);"><i class="bi ${estilo.icone} text-warning"></i></div>`;
    const subtotal = formatarMoeda(item.preco * item.quantidade);
    return `
    <div class="d-flex align-items-center gap-3 py-3 border-bottom" data-id-carrinho="${item.id}">
      ${imagemHtml}
      <div class="flex-grow-1">
        <p class="fw-semibold mb-1 small">${item.nome}</p>
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="carrinho-qtd-btn btn-diminuir" data-id="${item.id}">−</button>
          <span class="fw-semibold" style="min-width: 20px; text-align: center;">${item.quantidade}</span>
          <button type="button" class="carrinho-qtd-btn btn-aumentar" data-id="${item.id}">+</button>
        </div>
      </div>
      <div class="text-end">
        <p class="fw-bold mb-1 small">${subtotal}</p>
        <button type="button" class="btn btn-sm btn-link text-danger p-0 btn-remover-item" data-id="${item.id}">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>`;
}
function renderizarCarrinho() {
    const container = document.getElementById("carrinho-itens");
    const totalEl = document.getElementById("carrinho-total");
    if (!container || !totalEl)
        return;
    if (carrinhoItens.length === 0) {
        container.innerHTML = `
      <div class="text-center text-muted py-5">
        <i class="bi bi-bag-x" style="font-size: 2.5rem;"></i>
        <p class="mt-3 mb-0">Seu carrinho está vazio.</p>
      </div>`;
        totalEl.innerText = formatarMoeda(0);
        return;
    }
    container.innerHTML = carrinhoItens.map(itemCarrinhoHtml).join("");
    const total = carrinhoItens.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
    totalEl.innerText = formatarMoeda(total);
    container.querySelectorAll(".btn-aumentar").forEach((btn) => {
        btn.onclick = () => alterarQuantidade(Number(btn.getAttribute("data-id")), 1);
    });
    container.querySelectorAll(".btn-diminuir").forEach((btn) => {
        btn.onclick = () => alterarQuantidade(Number(btn.getAttribute("data-id")), -1);
    });
    container.querySelectorAll(".btn-remover-item").forEach((btn) => {
        btn.onclick = () => removerDoCarrinho(Number(btn.getAttribute("data-id")));
    });
}
// ============================================================
// Detalhe rápido do produto (abre em modal, na própria página)
// ============================================================
function abrirDetalheProduto(produto) {
    const corpo = document.getElementById("detalhe-produto-corpo");
    if (!corpo || !modalDetalheProduto)
        return;
    const precoFormatado = formatarMoeda(parseFloat(produto.preco_venda));
    const esgotado = produto.estoque_atual <= 0;
    const estilo = estiloCategoria(produto.categoria);
    const temImagem = Boolean(produto.imagem && produto.imagem.trim() !== "");
    const imagemHtml = temImagem
        ? `<img src="${produto.imagem}" alt="${produto.nome}" class="w-100 h-100" style="object-fit: contain;" onerror="mostrarPlaceholder(this, '${estilo.icone}', '${estilo.cor}')">`
        : `<div class="d-flex align-items-center justify-content-center h-100" style="background: linear-gradient(135deg, ${estilo.cor}, #000000); border-radius: 12px;"><i class="bi ${estilo.icone} text-warning" style="font-size: 4.5rem;"></i></div>`;
    const botaoHtml = esgotado
        ? `<button class="btn btn-secondary w-100 rounded-3 py-2 fw-semibold" disabled>Esgotado</button>`
        : `<button class="btn btn-buy-custom w-100" id="btn-comprar-detalhe"><i class="bi bi-cart-plus me-2"></i>Adicionar ao carrinho</button>`;
    corpo.innerHTML = `
    <div class="row g-4">
      <div class="col-md-6">
        <div class="product-img-container p-3" style="height: 320px; cursor: default;">
          <span class="badge-category">${produto.categoria}</span>
          ${imagemHtml}
        </div>
      </div>
      <div class="col-md-6 d-flex flex-column">
        <h4 class="fw-bold text-dark mb-2">${produto.nome}</h4>
        <p class="text-muted mb-3"><i class="bi bi-box-seam me-1"></i>Estoque: ${produto.estoque_atual} unidade(s)</p>
        <h3 class="fw-extrabold text-dark mb-4">${precoFormatado}</h3>
        <div class="mt-auto">${botaoHtml}</div>
      </div>
    </div>`;
    const btnComprar = document.getElementById("btn-comprar-detalhe");
    if (btnComprar) {
        btnComprar.onclick = () => {
            adicionarAoCarrinho(produto);
            modalDetalheProduto.hide();
        };
    }
    modalDetalheProduto.show();
}
// ============================================================
// Categorias e vitrine
// ============================================================
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
    // Clique em qualquer parte do card abre o detalhe rápido (mesma página)
    document.querySelectorAll(".product-card").forEach((card) => {
        card.onclick = () => {
            const id = Number(card.getAttribute("data-id"));
            const produto = todosProdutos.find((p) => p.id === id);
            if (produto)
                abrirDetalheProduto(produto);
        };
    });
    // Clique no botão "Comprar" adiciona direto ao carrinho, sem abrir o detalhe
    document.querySelectorAll(".btn-comprar").forEach((btn) => {
        btn.onclick = (evento) => {
            evento.stopPropagation();
            const id = Number(btn.getAttribute("data-id"));
            const produto = todosProdutos.find((p) => p.id === id);
            if (produto)
                adicionarAoCarrinho(produto);
        };
    });
}
function cartaoProduto(prod) {
    const precoFormatado = formatarMoeda(parseFloat(prod.preco_venda));
    const esgotado = prod.estoque_atual <= 0;
    const botaoHtml = esgotado
        ? `<button class="btn btn-secondary w-100 rounded-3 py-2 fw-semibold" disabled>Esgotado</button>`
        : `<button class="btn btn-buy-custom w-100 btn-comprar" data-id="${prod.id}"><i class="bi bi-cart-plus me-2"></i>Comprar</button>`;
    const estilo = estiloCategoria(prod.categoria);
    const temImagem = Boolean(prod.imagem && prod.imagem.trim() !== "");
    const imagemHtml = temImagem
        ? `<img src="${prod.imagem}" alt="${prod.nome}" class="card-img-top" style="height: 190px; width: 100%; object-fit: contain;" onerror="mostrarPlaceholder(this, '${estilo.icone}', '${estilo.cor}')">`
        : `<div class="produto-placeholder d-flex align-items-center justify-content-center h-100" style="background: linear-gradient(135deg, ${estilo.cor}, #000000); border-radius: 10px;"><i class="bi ${estilo.icone} text-warning" style="font-size: 3rem;"></i></div>`;
    return `
    <div class="col">
      <div class="card product-card h-100 shadow-sm" data-id="${prod.id}">
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
    // @ts-ignore - bootstrap vem do bundle carregado via CDN, sem tipos
    const offcanvasEl = document.getElementById("offcanvasCarrinho");
    // @ts-ignore
    if (offcanvasEl)
        offcanvasCarrinho = new bootstrap.Offcanvas(offcanvasEl);
    const modalEl = document.getElementById("modalDetalheProduto");
    // @ts-ignore
    if (modalEl)
        modalDetalheProduto = new bootstrap.Modal(modalEl);
    carregarCategorias();
    carregarLoja();
    configurarBusca();
    renderizarCarrinho();
    const btnCarrinho = document.getElementById("btn-carrinho");
    if (btnCarrinho) {
        btnCarrinho.onclick = () => {
            if (offcanvasCarrinho)
                offcanvasCarrinho.show();
        };
    }
    const btnFinalizar = document.getElementById("btn-finalizar-compra");
    if (btnFinalizar) {
        btnFinalizar.onclick = () => {
            if (carrinhoItens.length === 0) {
                mostrarToast("Seu carrinho está vazio.");
                return;
            }
            mostrarToast("Finalização de compra ainda não implementada neste projeto.");
        };
    }
});
export {};


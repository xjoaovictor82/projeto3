export {};

// ============================================================
// app.ts - Vitrine pública SportFit Store
// ============================================================

interface Produto {
  id: number;
  nome: string;
  categoria: string;
  preco_custo: string;
  preco_venda: string;
  estoque_atual: number;
  imagem: string;
}

const API_PRODUTOS = "api/listas_produtos.php";
const API_CATEGORIAS = "api/categorias.php";

let todosProdutos: Produto[] = [];
let carrinho = 0;

function normalizarTexto(texto: string | null | undefined): string {
  if (!texto) return "";
  return texto
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function estiloCategoria(categoria: string): { icone: string; cor: string } {
  const cat = normalizarTexto(categoria);
  if (cat.includes("calcado")) return { icone: "bi-stopwatch-fill", cor: "#c2410c" };
  if (cat.includes("camiset")) return { icone: "bi-bag-fill", cor: "#1d4ed8" };
  if (cat.includes("short")) return { icone: "bi-bounding-box-circles", cor: "#15803d" };
  if (cat.includes("acessorio")) return { icone: "bi-droplet-fill", cor: "#0891b2" };
  if (cat.includes("bola")) return { icone: "bi-circle-fill", cor: "#b91c1c" };
  if (cat.includes("casaco") || cat.includes("jaqueta")) return { icone: "bi-cloud-fill", cor: "#334155" };
  return { icone: "bi-trophy-fill", cor: "#111111" };
}

function mostrarPlaceholder(img: HTMLImageElement, icone: string, cor: string): void {
  const div = document.createElement("div");
  div.className = "produto-placeholder d-flex align-items-center justify-content-center h-100";
  div.style.background = `linear-gradient(135deg, ${cor}, #000000)`;
  div.style.borderRadius = "10px";
  div.innerHTML = `<i class="bi ${icone} text-warning" style="font-size: 3rem;"></i>`;
  img.replaceWith(div);
}

// Expõe para o atributo onerror inline no HTML gerado
(window as unknown as { mostrarPlaceholder: typeof mostrarPlaceholder }).mostrarPlaceholder = mostrarPlaceholder;

async function carregarCategorias(): Promise<void> {
  const nav = document.getElementById("nav-categorias");
  if (!nav) return;

  try {
    const resposta = await fetch(API_CATEGORIAS);
    const categorias: string[] = await resposta.json();

    // map: transforma cada categoria do banco num link de navegação,
    // sempre em sincronia com o que realmente existe em produtos.categoria
    const linksHtml = categorias
      .map((cat) => `<a href="javascript:void(0)" class="btn-categoria" data-categoria="${cat}">${cat}</a>`)
      .join("");

    nav.innerHTML = `<a href="javascript:void(0)" class="btn-categoria active" data-categoria="todas"><i class="bi bi-grid-fill me-1"></i> Todos</a>${linksHtml}`;

    document.querySelectorAll<HTMLElement>(".btn-categoria").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".btn-categoria").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const categoria = btn.getAttribute("data-categoria") ?? "todas";
        filtrarCategoria(categoria);
      });
    });
  } catch (erro) {
    console.error("Erro ao carregar categorias:", erro);
  }
}

async function carregarLoja(): Promise<void> {
  try {
    const resposta = await fetch(API_PRODUTOS);
    todosProdutos = (await resposta.json()) as Produto[];
    renderizarProdutos(todosProdutos);
  } catch (erro) {
    console.error("Erro ao carregar a loja:", erro);
    const vitrine = document.getElementById("vitrine-produtos");
    if (vitrine) vitrine.innerHTML = `<div class="w-100 text-center text-danger py-5">Erro ao carregar os produtos.</div>`;
  }
}

function renderizarProdutos(lista: Produto[]): void {
  const vitrine = document.getElementById("vitrine-produtos");
  const contador = document.getElementById("total-produtos");
  if (!vitrine) return;

  if (contador) contador.innerText = `${lista.length} produto(s) encontrado(s)`;

  // Edge case: nenhuma categoria/busca bate com produto nenhum
  if (lista.length === 0) {
    vitrine.innerHTML = `<div class="w-100 text-center text-muted py-5 fs-5">Nenhum produto encontrado nesta categoria.</div>`;
    return;
  }

  vitrine.innerHTML = lista.map(cartaoProduto).join("");

  document.querySelectorAll<HTMLButtonElement>(".btn-comprar").forEach((btn) => {
    btn.onclick = () => {
      const nome = btn.getAttribute("data-nome") ?? "";
      carrinho++;
      const contadorCarrinho = document.getElementById("cart-count");
      if (contadorCarrinho) contadorCarrinho.innerText = String(carrinho);
      alert(`"${nome}" foi adicionado ao seu carrinho!`);
    };
  });
}

function cartaoProduto(prod: Produto): string {
  const precoFormatado = parseFloat(prod.preco_venda).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const esgotado = prod.estoque_atual <= 0;
  const botaoHtml = esgotado
    ? `<button class="btn btn-secondary w-100 rounded-3 py-2 fw-semibold" disabled>Esgotado</button>`
    : `<button class="btn btn-buy-custom w-100 btn-comprar" data-nome="${prod.nome}"><i class="bi bi-cart-plus me-2"></i>Comprar</button>`;

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

function filtrarCategoria(categoria: string): void {
  const titulo = document.getElementById("titulo-vitrine");
  const termoBuscado = normalizarTexto(categoria);

  if (termoBuscado === "todas" || termoBuscado === "") {
    if (titulo) titulo.innerText = "Destaques para você";
    renderizarProdutos(todosProdutos);
    return;
  }

  if (titulo) titulo.innerText = `Categoria: ${categoria.toUpperCase()}`;

  const filtrados = todosProdutos.filter((p) => normalizarTexto(p.categoria).includes(termoBuscado));
  renderizarProdutos(filtrados);
}

function configurarBusca(): void {
  const formBusca = document.getElementById("form-busca") as HTMLFormElement | null;
  const campoBusca = document.getElementById("campo-busca") as HTMLInputElement | null;
  if (!formBusca || !campoBusca) return;

  formBusca.addEventListener("submit", (evento: SubmitEvent) => {
    evento.preventDefault();
    const termo = normalizarTexto(campoBusca.value);
    const titulo = document.getElementById("titulo-vitrine");

    if (!termo) {
      filtrarCategoria("todas");
      return;
    }

    if (titulo) titulo.innerText = `Resultado para: "${campoBusca.value}"`;

    const resultado = todosProdutos.filter(
      (p) => normalizarTexto(p.nome).includes(termo) || normalizarTexto(p.categoria).includes(termo)
    );
    renderizarProdutos(resultado);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  carregarCategorias();
  carregarLoja();
  configurarBusca();

  const btnCarrinho = document.getElementById("btn-carrinho");
  if (btnCarrinho) {
    btnCarrinho.onclick = () => alert(`Você possui ${carrinho} item(ns) no seu carrinho.`);
  }
});

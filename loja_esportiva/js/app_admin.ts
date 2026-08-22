export {};

// ============================================================
// app_admin.ts - Painel Administrativo SportFit Store
// Consome as APIs em PHP (que por sua vez chamam Views/CTEs/Stored
// Procedures no MariaDB) e também recalcula os principais indicadores
// no próprio front-end a partir do array bruto, para cruzar com o
// valor vindo do banco e demonstrar o uso de reduce/filter/map.
// ============================================================

// ---------- Contratos de dados (mapeiam 100% o JSON do PHP) ----------

interface Produto {
  id: number;
  nome: string;
  categoria: string;
  preco_custo: string;
  preco_venda: string;
  estoque_atual: number;
  imagem: string;
}

interface ItemVendaRaw {
  quantidade: number;
  preco_unitario: string;
  produto_nome: string;
  categoria: string;
}

interface DashboardResumo {
  faturamento_total: string;
  itens_vendidos: string;
  produtos_estoque_critico: number;
  total_clientes: number;
}

interface ProdutoMaisVendido {
  id: number;
  nome: string;
  categoria: string;
  total_vendido: string;
}

interface FaturamentoCategoria {
  categoria: string;
  faturamento: string;
  unidades_vendidas: string;
  margem_media: string;
}

interface DashboardResponse {
  resumo: DashboardResumo | null;
  produto_mais_vendido: ProdutoMaisVendido | null;
  faturamento_por_categoria: FaturamentoCategoria[];
  itens_venda_raw: ItemVendaRaw[];
  produtos: Produto[];
}

interface Cliente {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  total_compras: number;
  total_gasto: string;
}

interface VendaResumo {
  id: number;
  data_venda: string;
  status: string;
  cliente_nome: string;
  vendedor: string;
  total_venda: string;
  itens_qtd: string;
}

interface RespostaApi {
  sucesso?: boolean;
  erro?: string;
  id?: number;
}

interface ItemCarrinhoVenda {
  produto_id: number;
  nome: string;
  quantidade: number;
  preco_unitario: number;
}

// ---------- Utilitários genéricos ----------

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizarTexto(texto: string | null | undefined): string {
  if (!texto) return "";
  return texto
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

async function buscarJSON<T>(url: string, opcoes?: RequestInit): Promise<T> {
  const resposta = await fetch(url, opcoes);
  const dados = (await resposta.json()) as T;
  if (!resposta.ok) {
    const erro = (dados as unknown as RespostaApi).erro ?? "Erro na requisição.";
    throw new Error(erro);
  }
  return dados;
}

function mostrarAlerta(elementoId: string, mensagem: string, tipo: "success" | "danger" = "danger"): void {
  const alvo = document.getElementById(elementoId);
  if (!alvo) return;
  alvo.innerHTML = `
    <div class="alert alert-${tipo} alert-dismissible fade show py-2" role="alert">
      ${mensagem}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
}

function estiloCategoria(categoria: string): { icone: string; cor: string } {
  const cat = normalizarTexto(categoria);
  if (cat.includes("calcado")) return { icone: "bi-stopwatch-fill", cor: "#c2410c" };
  if (cat.includes("camiset")) return { icone: "bi-bag-fill", cor: "#1d4ed8" };
  if (cat.includes("short")) return { icone: "bi-bounding-box-circles", cor: "#15803d" };
  if (cat.includes("acessorio")) return { icone: "bi-droplet-fill", cor: "#0891b2" };
  return { icone: "bi-trophy-fill", cor: "#111111" };
}

function mostrarPlaceholderThumb(img: HTMLImageElement, icone: string, cor: string): void {
  const span = document.createElement("span");
  span.className = "thumb-produto d-inline-flex align-items-center justify-content-center";
  span.style.background = `linear-gradient(135deg, ${cor}, #000000)`;
  span.innerHTML = `<i class="bi ${icone} text-warning"></i>`;
  img.replaceWith(span);
}

// Exposta em window porque é chamada via atributo inline onerror="" no HTML gerado
(window as unknown as { mostrarPlaceholderThumb: typeof mostrarPlaceholderThumb }).mostrarPlaceholderThumb = mostrarPlaceholderThumb;

// ============================================================
// DASHBOARD
// Recalcula os indicadores a partir do array bruto (itens_venda_raw)
// usando reduce/filter/map, e mostra ao lado o valor vindo do banco
// (Views/CTEs), como conferência cruzada entre front e back-end.
// ============================================================

function calcularFaturamentoTotal(itens: ItemVendaRaw[]): number {
  // reduce: soma quantidade * preço unitário de cada item bruto
  return itens.reduce((acumulado, item) => acumulado + item.quantidade * parseFloat(item.preco_unitario), 0);
}

function calcularFaturamentoPorCategoria(itens: ItemVendaRaw[]): Map<string, number> {
  // filter (implícito por categoria) + reduce, construindo um acumulador por chave
  return itens.reduce((mapa, item) => {
    const atual = mapa.get(item.categoria) ?? 0;
    mapa.set(item.categoria, atual + item.quantidade * parseFloat(item.preco_unitario));
    return mapa;
  }, new Map<string, number>());
}

function encontrarProdutoDestaque(itens: ItemVendaRaw[]): { nome: string; categoria: string; total: number } | null {
  if (itens.length === 0) return null;

  // Algoritmo de ranking por frequência: objeto chave-valor contando
  // quantidade vendida por produto, sem depender da View do banco.
  const contagem: Record<string, { categoria: string; total: number }> = {};

  for (const item of itens) {
    if (!contagem[item.produto_nome]) {
      contagem[item.produto_nome] = { categoria: item.categoria, total: 0 };
    }
    contagem[item.produto_nome].total += item.quantidade;
  }

  let nomeDestaque = "";
  let maiorTotal = -1;
  for (const nome in contagem) {
    if (contagem[nome].total > maiorTotal) {
      maiorTotal = contagem[nome].total;
      nomeDestaque = nome;
    }
  }

  if (nomeDestaque === "") return null;
  return { nome: nomeDestaque, categoria: contagem[nomeDestaque].categoria, total: maiorTotal };
}

function produtosComEstoqueCritico(produtos: Produto[]): Produto[] {
  // filter: isola o subconjunto de produtos com estoque baixo (<= 5)
  return produtos.filter((p) => p.estoque_atual <= 5);
}

function formatarCategoriasParaGrafico(mapa: Map<string, number>): { categoria: string; valorFormatado: string; valor: number }[] {
  // map: transforma o Map de números crus em algo pronto para renderizar
  return Array.from(mapa.entries())
    .map(([categoria, valor]) => ({ categoria, valor, valorFormatado: formatarMoeda(valor) }))
    .sort((a, b) => b.valor - a.valor);
}

function renderizarCardsResumo(dados: DashboardResponse, faturamentoCalculado: number): void {
  const container = document.getElementById("dash-cards-resumo");
  if (!container) return;

  const totalClientes = dados.resumo?.total_clientes ?? 0;
  const estoqueCritico = produtosComEstoqueCritico(dados.produtos);
  const itensVendidos = dados.itens_venda_raw.reduce((soma, item) => soma + item.quantidade, 0);

  container.innerHTML = `
    <div class="col-6 col-lg-3">
      <div class="card card-painel p-3 h-100">
        <span class="small text-muted text-uppercase fw-semibold">Faturamento total</span>
        <h4 class="fw-extrabold mb-0 mt-1">${formatarMoeda(faturamentoCalculado)}</h4>
      </div>
    </div>
    <div class="col-6 col-lg-3">
      <div class="card card-painel p-3 h-100">
        <span class="small text-muted text-uppercase fw-semibold">Itens vendidos</span>
        <h4 class="fw-extrabold mb-0 mt-1">${itensVendidos}</h4>
      </div>
    </div>
    <div class="col-6 col-lg-3">
      <div class="card card-painel p-3 h-100">
        <span class="small text-muted text-uppercase fw-semibold">Estoque crítico</span>
        <h4 class="fw-extrabold mb-0 mt-1 ${estoqueCritico.length > 0 ? "text-danger" : ""}">${estoqueCritico.length}</h4>
      </div>
    </div>
    <div class="col-6 col-lg-3">
      <div class="card card-painel p-3 h-100">
        <span class="small text-muted text-uppercase fw-semibold">Clientes cadastrados</span>
        <h4 class="fw-extrabold mb-0 mt-1">${totalClientes}</h4>
      </div>
    </div>
  `;
}

function renderizarDestaque(dados: DashboardResponse): void {
  const container = document.getElementById("dash-produto-destaque");
  if (!container) return;

  // Edge case: banco sem vendas ainda - nenhuma função de cálculo deve quebrar.
  const destaqueCalculado = encontrarProdutoDestaque(dados.itens_venda_raw);
  if (!destaqueCalculado) {
    container.innerHTML = `<p class="text-muted mb-0">Nenhum dado registrado ainda. Assim que houver vendas, o produto mais vendido aparece aqui.</p>`;
    return;
  }

  const estilo = estiloCategoria(destaqueCalculado.categoria);
  container.innerHTML = `
    <div class="d-flex align-items-center gap-3">
      <div class="d-flex align-items-center justify-content-center rounded-3" style="width:56px;height:56px;background:linear-gradient(135deg, ${estilo.cor}, #000000);">
        <i class="bi ${estilo.icone} text-warning fs-4"></i>
      </div>
      <div>
        <h6 class="fw-bold mb-0">${destaqueCalculado.nome}</h6>
        <span class="small text-muted">${destaqueCalculado.categoria} · ${destaqueCalculado.total} unidades vendidas</span>
      </div>
    </div>
  `;
}

function renderizarFaturamentoPorCategoria(dados: DashboardResponse): void {
  const container = document.getElementById("dash-categorias");
  if (!container) return;

  const mapaCalculado = calcularFaturamentoPorCategoria(dados.itens_venda_raw);

  // Edge case: sem vendas -> sem categorias com faturamento.
  if (mapaCalculado.size === 0) {
    container.innerHTML = `<p class="text-muted mb-0">Nenhum dado registrado.</p>`;
    return;
  }

  const linhas = formatarCategoriasParaGrafico(mapaCalculado);
  const maiorValor = linhas[0]?.valor ?? 1;

  container.innerHTML = linhas
    .map((linha) => {
      const porcentagem = maiorValor > 0 ? Math.round((linha.valor / maiorValor) * 100) : 0;
      return `
        <div class="mb-2">
          <div class="d-flex justify-content-between small mb-1">
            <span class="fw-semibold">${linha.categoria}</span>
            <span>${linha.valorFormatado}</span>
          </div>
          <div class="progress" style="height:8px;border-radius:6px;">
            <div class="progress-bar bg-dark" style="width:${porcentagem}%"></div>
          </div>
        </div>`;
    })
    .join("");
}

function renderizarEstoqueCritico(dados: DashboardResponse): void {
  const container = document.getElementById("dash-estoque-critico");
  if (!container) return;

  const criticos = produtosComEstoqueCritico(dados.produtos);

  if (criticos.length === 0) {
    container.innerHTML = `<p class="text-muted mb-0">Nenhum produto com estoque crítico. 🎉</p>`;
    return;
  }

  container.innerHTML = criticos
    .map((p) => `
      <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
        <span class="small fw-semibold">${p.nome}</span>
        <span class="badge badge-estoque-baixo">${p.estoque_atual} un</span>
      </div>`)
    .join("");
}

async function carregarDashboard(): Promise<void> {
  try {
    const dados = await buscarJSON<DashboardResponse>("api/dashboard.php");

    // Faturamento recalculado no front, a partir do array bruto (reduce)
    const faturamentoCalculado = calcularFaturamentoTotal(dados.itens_venda_raw);

    renderizarCardsResumo(dados, faturamentoCalculado);
    renderizarDestaque(dados);
    renderizarFaturamentoPorCategoria(dados);
    renderizarEstoqueCritico(dados);
  } catch (erro) {
    const painel = document.getElementById("dash-cards-resumo");
    if (painel) {
      const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido.";
      painel.innerHTML = `<div class="col-12 text-danger">Erro ao carregar a dashboard: ${mensagem}</div>`;
    }
  }
}

// ============================================================
// PRODUTOS (CRUD 1/3)
// ============================================================

async function carregarProdutos(): Promise<void> {
  const tabela = document.getElementById("tabela-produtos");
  if (!tabela) return;

  try {
    const produtos = await buscarJSON<Produto[]>("api/listas_produtos.php?limite=200");

    if (produtos.length === 0) {
      tabela.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Nenhum produto cadastrado.</td></tr>`;
      return;
    }

    tabela.innerHTML = produtos.map(linhaProduto).join("");

    document.querySelectorAll<HTMLButtonElement>(".btn-editar-produto").forEach((btn) => {
      btn.onclick = () => {
        const dado = btn.getAttribute("data-produto");
        if (dado) abrirModalEdicaoProduto(JSON.parse(dado) as Produto);
      };
    });
    document.querySelectorAll<HTMLButtonElement>(".btn-excluir-produto").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        const nome = btn.getAttribute("data-nome");
        if (id && nome) excluirProduto(id, nome);
      };
    });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido.";
    tabela.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">${mensagem}</td></tr>`;
  }
}

function linhaProduto(p: Produto): string {
  const precoVenda = formatarMoeda(parseFloat(p.preco_venda));
  const precoCusto = formatarMoeda(parseFloat(p.preco_custo));
  const badgeEstoque = p.estoque_atual <= 0 ? "badge-estoque-baixo" : p.estoque_atual <= 5 ? "bg-warning text-dark" : "bg-success";
  const estilo = estiloCategoria(p.categoria);
  const temImagem = Boolean(p.imagem && p.imagem.trim() !== "");
  const imgHtml = temImagem
    ? `<img src="${p.imagem}" class="thumb-produto" onerror="mostrarPlaceholderThumb(this, '${estilo.icone}', '${estilo.cor}')">`
    : `<span class="thumb-produto d-inline-flex align-items-center justify-content-center" style="background: linear-gradient(135deg, ${estilo.cor}, #000000);"><i class="bi ${estilo.icone} text-warning"></i></span>`;

  return `
    <tr data-id="${p.id}">
      <td>${imgHtml}</td>
      <td class="fw-semibold">${p.nome}</td>
      <td><span class="badge bg-dark">${p.categoria}</span></td>
      <td>${precoCusto}</td>
      <td>${precoVenda}</td>
      <td><span class="badge ${badgeEstoque}">${p.estoque_atual} un</span></td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-dark btn-editar-produto" data-produto='${JSON.stringify(p)}'><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-excluir-produto" data-id="${p.id}" data-nome="${p.nome}"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
}

function abrirModalNovoProduto(): void {
  const form = document.getElementById("form-produto") as HTMLFormElement | null;
  const idInput = document.getElementById("produto-id") as HTMLInputElement | null;
  const titulo = document.getElementById("modalProdutoTitulo");
  if (!form || !idInput || !titulo) return;

  form.reset();
  idInput.value = "";
  titulo.innerText = "Novo produto";
  abrirModal("modalProduto");
}

function abrirModalEdicaoProduto(produto: Produto): void {
  const campos: [string, string][] = [
    ["produto-id", String(produto.id)],
    ["produto-nome", produto.nome],
    ["produto-categoria", produto.categoria],
    ["produto-preco-custo", produto.preco_custo],
    ["produto-preco-venda", produto.preco_venda],
    ["produto-estoque", String(produto.estoque_atual)],
    ["produto-imagem", produto.imagem ?? ""],
  ];
  for (const [id, valor] of campos) {
    const campo = document.getElementById(id) as HTMLInputElement | null;
    if (campo) campo.value = valor;
  }
  const titulo = document.getElementById("modalProdutoTitulo");
  if (titulo) titulo.innerText = "Editar produto";
  abrirModal("modalProduto");
}

async function excluirProduto(id: string, nome: string): Promise<void> {
  if (!confirm(`Tem certeza que deseja excluir "${nome}"? Essa ação não pode ser desfeita.`)) return;

  const dados = new FormData();
  dados.append("acao", "excluir");
  dados.append("id", id);

  try {
    const resultado = await buscarJSON<RespostaApi>("api/crud_produtos.php", { method: "POST", body: dados });
    if (resultado.sucesso) {
      mostrarAlerta("alerta-painel", `Produto "${nome}" excluído com sucesso.`, "success");
      carregarProdutos();
      carregarDashboard();
    }
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao excluir produto.";
    mostrarAlerta("alerta-painel", mensagem);
  }
}

function configurarFormularioProduto(): void {
  const form = document.getElementById("form-produto") as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener("submit", async (evento: SubmitEvent) => {
    evento.preventDefault();
    const idInput = document.getElementById("produto-id") as HTMLInputElement;
    const acao = idInput.value ? "editar" : "adicionar";

    const dados = new FormData(form);
    dados.set("acao", acao);

    try {
      const resultado = await buscarJSON<RespostaApi>("api/crud_produtos.php", { method: "POST", body: dados });
      if (resultado.sucesso) {
        fecharModal("modalProduto");
        mostrarAlerta("alerta-painel", acao === "editar" ? "Produto atualizado com sucesso." : "Produto adicionado com sucesso.", "success");
        carregarProdutos();
        carregarDashboard();
      }
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : "Erro ao salvar produto.";
      mostrarAlerta("alerta-painel", mensagem);
    }
  });
}

// ============================================================
// CLIENTES (CRUD 2/3)
// ============================================================

async function carregarClientes(): Promise<void> {
  const tabela = document.getElementById("tabela-clientes");
  if (!tabela) return;

  try {
    const clientes = await buscarJSON<Cliente[]>("api/crud_clientes.php?acao=listar");

    if (clientes.length === 0) {
      tabela.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum cliente cadastrado.</td></tr>`;
      return;
    }

    tabela.innerHTML = clientes
      .map(
        (c) => `
      <tr data-id="${c.id}">
        <td class="fw-semibold">${c.nome}</td>
        <td>${c.email ?? "-"}</td>
        <td>${c.telefone ?? "-"}</td>
        <td>${c.total_compras}x · ${formatarMoeda(parseFloat(c.total_gasto))}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-dark btn-editar-cliente" data-cliente='${JSON.stringify(c)}'><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger btn-excluir-cliente" data-id="${c.id}" data-nome="${c.nome}"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`
      )
      .join("");

    document.querySelectorAll<HTMLButtonElement>(".btn-editar-cliente").forEach((btn) => {
      btn.onclick = () => {
        const dado = btn.getAttribute("data-cliente");
        if (dado) abrirModalEdicaoCliente(JSON.parse(dado) as Cliente);
      };
    });
    document.querySelectorAll<HTMLButtonElement>(".btn-excluir-cliente").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        const nome = btn.getAttribute("data-nome");
        if (id && nome) excluirCliente(id, nome);
      };
    });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido.";
    tabela.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">${mensagem}</td></tr>`;
  }
}

function abrirModalNovoCliente(): void {
  const form = document.getElementById("form-cliente") as HTMLFormElement | null;
  const idInput = document.getElementById("cliente-id") as HTMLInputElement | null;
  const titulo = document.getElementById("modalClienteTitulo");
  if (!form || !idInput || !titulo) return;

  form.reset();
  idInput.value = "";
  titulo.innerText = "Novo cliente";
  abrirModal("modalCliente");
}

function abrirModalEdicaoCliente(cliente: Cliente): void {
  const campos: [string, string][] = [
    ["cliente-id", String(cliente.id)],
    ["cliente-nome", cliente.nome],
    ["cliente-email", cliente.email ?? ""],
    ["cliente-telefone", cliente.telefone ?? ""],
  ];
  for (const [id, valor] of campos) {
    const campo = document.getElementById(id) as HTMLInputElement | null;
    if (campo) campo.value = valor;
  }
  const titulo = document.getElementById("modalClienteTitulo");
  if (titulo) titulo.innerText = "Editar cliente";
  abrirModal("modalCliente");
}

async function excluirCliente(id: string, nome: string): Promise<void> {
  if (!confirm(`Tem certeza que deseja excluir "${nome}"?`)) return;

  const dados = new FormData();
  dados.append("acao", "excluir");
  dados.append("id", id);

  try {
    const resultado = await buscarJSON<RespostaApi>("api/crud_clientes.php", { method: "POST", body: dados });
    if (resultado.sucesso) {
      mostrarAlerta("alerta-painel", `Cliente "${nome}" excluído com sucesso.`, "success");
      carregarClientes();
    }
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao excluir cliente.";
    mostrarAlerta("alerta-painel", mensagem);
  }
}

function configurarFormularioCliente(): void {
  const form = document.getElementById("form-cliente") as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener("submit", async (evento: SubmitEvent) => {
    evento.preventDefault();
    const idInput = document.getElementById("cliente-id") as HTMLInputElement;
    const acao = idInput.value ? "editar" : "adicionar";

    const dados = new FormData(form);
    dados.set("acao", acao);

    try {
      const resultado = await buscarJSON<RespostaApi>("api/crud_clientes.php", { method: "POST", body: dados });
      if (resultado.sucesso) {
        fecharModal("modalCliente");
        mostrarAlerta("alerta-painel", acao === "editar" ? "Cliente atualizado com sucesso." : "Cliente adicionado com sucesso.", "success");
        carregarClientes();
      }
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : "Erro ao salvar cliente.";
      mostrarAlerta("alerta-painel", mensagem);
    }
  });
}

// ============================================================
// VENDAS (CRUD 3/3)
// ============================================================

let carrinhoVenda: ItemCarrinhoVenda[] = [];
let produtosDisponiveis: Produto[] = [];

async function carregarVendas(): Promise<void> {
  const tabela = document.getElementById("tabela-vendas");
  if (!tabela) return;

  try {
    const vendas = await buscarJSON<VendaResumo[]>("api/crud_vendas.php?acao=listar");

    if (vendas.length === 0) {
      tabela.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Nenhuma venda registrada.</td></tr>`;
      return;
    }

    tabela.innerHTML = vendas
      .map((v) => {
        const badgeStatus = v.status === "cancelada" ? "bg-secondary" : "bg-success";
        const botaoCancelar =
          v.status === "cancelada"
            ? ""
            : `<button class="btn btn-sm btn-outline-danger btn-cancelar-venda" data-id="${v.id}"><i class="bi bi-x-circle"></i> Cancelar</button>`;
        return `
        <tr data-id="${v.id}">
          <td>#${v.id}</td>
          <td>${new Date(v.data_venda).toLocaleString("pt-BR")}</td>
          <td>${v.cliente_nome}</td>
          <td>${v.itens_qtd} un</td>
          <td>${formatarMoeda(parseFloat(v.total_venda))}</td>
          <td><span class="badge ${badgeStatus}">${v.status}</span></td>
          <td class="text-end">${botaoCancelar}</td>
        </tr>`;
      })
      .join("");

    document.querySelectorAll<HTMLButtonElement>(".btn-cancelar-venda").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        if (id) cancelarVenda(id);
      };
    });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido.";
    tabela.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">${mensagem}</td></tr>`;
  }
}

async function cancelarVenda(id: string): Promise<void> {
  if (!confirm("Cancelar esta venda? O estoque dos itens será estornado.")) return;

  const dados = new FormData();
  dados.append("acao", "cancelar");
  dados.append("id", id);

  try {
    const resultado = await buscarJSON<RespostaApi>("api/crud_vendas.php", { method: "POST", body: dados });
    if (resultado.sucesso) {
      mostrarAlerta("alerta-painel", "Venda cancelada e estoque estornado.", "success");
      carregarVendas();
      carregarProdutos();
      carregarDashboard();
    }
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao cancelar venda.";
    mostrarAlerta("alerta-painel", mensagem);
  }
}

async function abrirModalNovaVenda(): Promise<void> {
  carrinhoVenda = [];
  renderizarCarrinhoVenda();

  const selectProduto = document.getElementById("venda-produto") as HTMLSelectElement | null;
  if (selectProduto) {
    try {
      produtosDisponiveis = await buscarJSON<Produto[]>("api/listas_produtos.php?limite=200");
      // map: transforma a lista de produtos nas <option> do select
      selectProduto.innerHTML = produtosDisponiveis
        .filter((p) => p.estoque_atual > 0)
        .map((p) => `<option value="${p.id}">${p.nome} (estoque: ${p.estoque_atual})</option>`)
        .join("");
    } catch {
      selectProduto.innerHTML = `<option value="">Erro ao carregar produtos</option>`;
    }
  }

  abrirModal("modalVenda");
}

function renderizarCarrinhoVenda(): void {
  const lista = document.getElementById("venda-carrinho-lista");
  const totalEl = document.getElementById("venda-carrinho-total");
  if (!lista || !totalEl) return;

  if (carrinhoVenda.length === 0) {
    lista.innerHTML = `<p class="text-muted small mb-0">Nenhum item adicionado ainda.</p>`;
    totalEl.innerText = formatarMoeda(0);
    return;
  }

  lista.innerHTML = carrinhoVenda
    .map(
      (item, indice) => `
    <div class="d-flex justify-content-between align-items-center border-bottom py-1">
      <span class="small">${item.quantidade}x ${item.nome}</span>
      <span class="small d-flex align-items-center gap-2">
        ${formatarMoeda(item.quantidade * item.preco_unitario)}
        <button type="button" class="btn btn-sm btn-link text-danger p-0 btn-remover-item" data-indice="${indice}"><i class="bi bi-x-lg"></i></button>
      </span>
    </div>`
    )
    .join("");

  const total = carrinhoVenda.reduce((soma, item) => soma + item.quantidade * item.preco_unitario, 0);
  totalEl.innerText = formatarMoeda(total);

  document.querySelectorAll<HTMLButtonElement>(".btn-remover-item").forEach((btn) => {
    btn.onclick = () => {
      const indice = Number(btn.getAttribute("data-indice"));
      carrinhoVenda = carrinhoVenda.filter((_, i) => i !== indice);
      renderizarCarrinhoVenda();
    };
  });
}

function adicionarItemAoCarrinho(): void {
  const selectProduto = document.getElementById("venda-produto") as HTMLSelectElement | null;
  const inputQuantidade = document.getElementById("venda-quantidade") as HTMLInputElement | null;
  if (!selectProduto || !inputQuantidade) return;

  const produtoId = Number(selectProduto.value);
  const quantidade = Number(inputQuantidade.value);
  const produto = produtosDisponiveis.find((p) => p.id === produtoId);

  if (!produto || quantidade <= 0) return;
  if (quantidade > produto.estoque_atual) {
    mostrarAlerta("alerta-venda", `Estoque insuficiente. Disponível: ${produto.estoque_atual} un.`);
    return;
  }

  const existente = carrinhoVenda.find((item) => item.produto_id === produtoId);
  if (existente) {
    existente.quantidade += quantidade;
  } else {
    carrinhoVenda.push({
      produto_id: produtoId,
      nome: produto.nome,
      quantidade,
      preco_unitario: parseFloat(produto.preco_venda),
    });
  }

  inputQuantidade.value = "1";
  renderizarCarrinhoVenda();
}

function configurarFormularioVenda(): void {
  const botaoAdicionarItem = document.getElementById("btn-adicionar-item-venda");
  if (botaoAdicionarItem) botaoAdicionarItem.addEventListener("click", adicionarItemAoCarrinho);

  const form = document.getElementById("form-venda") as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener("submit", async (evento: SubmitEvent) => {
    evento.preventDefault();

    if (carrinhoVenda.length === 0) {
      mostrarAlerta("alerta-venda", "Adicione ao menos um item antes de finalizar.");
      return;
    }

    const clienteSelect = document.getElementById("venda-cliente") as HTMLSelectElement | null;
    const dados = new FormData();
    dados.append("acao", "criar");
    if (clienteSelect && clienteSelect.value) dados.append("cliente_id", clienteSelect.value);
    dados.append("itens", JSON.stringify(carrinhoVenda.map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade }))));

    try {
      const resultado = await buscarJSON<RespostaApi>("api/crud_vendas.php", { method: "POST", body: dados });
      if (resultado.sucesso) {
        fecharModal("modalVenda");
        mostrarAlerta("alerta-painel", `Venda #${resultado.id} registrada com sucesso.`, "success");
        carrinhoVenda = [];
        carregarVendas();
        carregarProdutos();
        carregarDashboard();
      }
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : "Erro ao registrar venda.";
      mostrarAlerta("alerta-venda", mensagem);
    }
  });
}

async function carregarClientesNoSelectVenda(): Promise<void> {
  const select = document.getElementById("venda-cliente") as HTMLSelectElement | null;
  if (!select) return;
  try {
    const clientes = await buscarJSON<Cliente[]>("api/crud_clientes.php?acao=listar");
    select.innerHTML =
      `<option value="">Consumidor não identificado</option>` +
      clientes.map((c) => `<option value="${c.id}">${c.nome}</option>`).join("");
  } catch {
    select.innerHTML = `<option value="">Consumidor não identificado</option>`;
  }
}

// ============================================================
// Helpers de modal (evitam repetir `new bootstrap.Modal(...)` em cada função)
// ============================================================

declare const bootstrap: { Modal: { getOrCreateInstance(el: HTMLElement): { show(): void; hide(): void } } };

function abrirModal(id: string): void {
  const el = document.getElementById(id);
  if (el) bootstrap.Modal.getOrCreateInstance(el).show();
}

function fecharModal(id: string): void {
  const el = document.getElementById(id);
  if (el) bootstrap.Modal.getOrCreateInstance(el).hide();
}

// ============================================================
// Abas do painel
// ============================================================

function configurarAbas(): void {
  document.querySelectorAll<HTMLElement>(".painel-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const alvo = tab.getAttribute("data-tab");
      if (!alvo) return;

      document.querySelectorAll<HTMLElement>(".painel-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      document.querySelectorAll<HTMLElement>(".painel-secao").forEach((secao) => {
        secao.classList.toggle("d-none", secao.id !== `secao-${alvo}`);
      });
    });
  });
}

// ============================================================
// Inicialização
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  configurarAbas();
  configurarFormularioProduto();
  configurarFormularioCliente();
  configurarFormularioVenda();

  carregarDashboard();
  carregarProdutos();
  carregarClientes();
  carregarVendas();

  const btnNovoProduto = document.getElementById("btn-novo-produto");
  if (btnNovoProduto) btnNovoProduto.addEventListener("click", abrirModalNovoProduto);

  const btnNovoCliente = document.getElementById("btn-novo-cliente");
  if (btnNovoCliente) btnNovoCliente.addEventListener("click", abrirModalNovoCliente);

  const btnNovaVenda = document.getElementById("btn-nova-venda");
  if (btnNovaVenda) {
    btnNovaVenda.addEventListener("click", () => {
      abrirModalNovaVenda();
      carregarClientesNoSelectVenda();
    });
  }
});

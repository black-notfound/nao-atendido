// VARIÁVEIS GLOBAUS
let dataSelecionadaGlobal = localStorage.getItem("data");
let df = dataSelecionadaGlobal.split("-");
df = `${df[2]}_${df[1]}_${df[0]}`;

document.addEventListener("DOMContentLoaded", () => {
  const botaoRelatorio = document.getElementById("OFENSORES");
  const loadingBox = document.getElementById("loadingBox");
  loadingBox.classList.add("hidden");
  loadingBox.style.visibility = "hidden";

  botaoRelatorio.addEventListener("click", async () => {
    loadingBox.style.visibility = "visible";
    console.log(df);
    try {
      const url = `/gerar-relatorio${df}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro ao gerar relatório.");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `Nat-${df}.xlsx`; // ou .xlsx, depende do formato
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl); // limpa a URL gerada
    } catch (error) {
      alert("Erro ao gerar relatório: " + error.message);
    }

    loadingBox.style.visibility = "hidden";
  });
});

// tabelas.js

// Função para preencher as tabelas com os dados do JSON
function preencherTabela(dados, tabelaId, chave) {
  const tabelaBody = document
    .getElementById(tabelaId)
    .getElementsByTagName("tbody")[0];
  tabelaBody.innerHTML = ""; // Limpa a tabela antes de preenchê-la

  // Verifica se os dados existem antes de tentar preenchê-la
  if (dados.OFENSORES_RESUMO[chave].SKU.length === 0) {
    console.log("Os dados estão vazios!");
    return; // Caso os dados estejam vazios, retorna sem preencher a tabela
  }

  // Preenche a tabela com os dados
  for (let i = 0; i < dados.OFENSORES_RESUMO[chave].SKU.length; i++) {
    const linha = document.createElement("tr");

    // Percorre as chaves do objeto "dados"
    for (let key of Object.keys(dados.OFENSORES_RESUMO[chave])) {
      const valor = document.createElement("td");
      // Se o valor for um array, pega o elemento de índice i; caso contrário, usa o valor diretamente
      valor.textContent = Array.isArray(dados.OFENSORES_RESUMO[chave][key])
        ? dados.OFENSORES_RESUMO[chave][key][i]
        : dados.OFENSORES_RESUMO[chave][key];
      linha.appendChild(valor);
    }

    tabelaBody.appendChild(linha); // Adiciona a linha na tabela
  }
}

// Função para carregar o arquivo JSON e preencher a tabela
function carregarDados(arquivoJson, tabelaId, chave) {
  fetch(arquivoJson) // Caminho do arquivo JSON
    .then((response) => response.json()) // Converte o arquivo JSON em objeto JavaScript
    .then((dados) => {
      preencherTabela(dados, tabelaId, chave); // Preenche a tabela com os dados
    })
    .catch((error) => {
      console.error("Erro ao carregar os dados:", error);
    });
}

// Função que será executada ao carregar a página
const dataSelecionada = localStorage.getItem("data");

if (dataSelecionada) {
  // Use a data para carregar os dados corretamente
  const [year, month, day] = dataSelecionada.split("-");
  const fileName = `Nat_${day}_${month}_${year}.json`;

  carregarDados(`Jsons/${fileName}`, "tabela-dados", "MAIORES");
  carregarDados(`Jsons/${fileName}`, "tabela-separacao", "SEPARAÇÃO");
  carregarDados(`Jsons/${fileName}`, "tabela-ressuprimento", "RESSUPRIMENTO");
} else {
  // Se não houver data salva, carregar os dados do dia de hoje
  console.log("Nenhuma data selecionada, carregando dados do dia atual.");
  carregarDados("Jsons/Nat_hoje.json", "tabela-dados", "MAIORES"); // Substitua por como você carregar dados do dia atual
}

// Selecionando os elementos da sidebar e do conteúdo
const sidebar = document.getElementById("sidebar");
const openBtn = document.getElementById("open-btn");
const closeBtn = document.getElementById("close-btn");
const content = document.querySelector(".content");
const toggleItemsBtn = document.getElementById("toggle-items");
const toggleItemsBtn1 = document.getElementById("toggle-items1");
const toggleItemsBtn2 = document.getElementById("toggle-items2");
const itemList = document.getElementById("itemlist");
const itemList1 = document.getElementById("itemlist1");
const itemList2 = document.getElementById("itemlist2");
const toggleDetalhamentoBtn = document.getElementById("toggle-detalhamento");
const detalhamentoContainer = document.getElementById("detalhamento-container");
const ofensoresBtn = document.getElementById("ofensores-btn");
const rotasBtn = document.getElementById("rotas-btn"); // Novo botão

// Abrir a sidebar
openBtn.addEventListener("click", () => {
  sidebar.classList.add("open");
  content.classList.add("open");
});

// Fechar a sidebar
closeBtn.addEventListener("click", () => {
  sidebar.classList.remove("open");
  content.classList.remove("open");
});

// Fechar a sidebar ao clicar fora dela
document.addEventListener("click", (event) => {
  if (
    !sidebar.contains(event.target) &&
    !openBtn.contains(event.target) &&
    sidebar.classList.contains("open")
  ) {
    sidebar.classList.remove("open");
    content.classList.remove("open");
  }
});

// Mostrar ou esconder os itens na sidebar
toggleItemsBtn.addEventListener("click", () => {
  itemList.classList.toggle("show");
});

toggleItemsBtn1.addEventListener("click", () => {
  itemList1.classList.toggle("show");
});

toggleItemsBtn2.addEventListener("click", () => {
  itemList2.classList.toggle("show");
});

// Mostrar ou esconder os botões MÁQUINA, MEZANINO e EXTERNO ao clicar em "DETALHAMENTO DE ERROS"
toggleDetalhamentoBtn.addEventListener("click", () => {
  detalhamentoContainer.style.display =
    detalhamentoContainer.style.display === "none" ? "block" : "none";
});

// Redirecionar para a página OFENSORES.html ao clicar no botão "OFENSORES"
ofensoresBtn.addEventListener("click", () => {
  window.location.href = "OFENSORES.html";
});

// Redirecionar para a página ROTAS POR SETOR.html ao clicar no botão "ROTAS POR SETOR"
rotasBtn.addEventListener("click", () => {
  window.location.href = "ROTAS POR SETOR.HTML";
});

function verificarMouse(evento) {
  const elemento = evento.target;
  const tr = elemento.closest("tr");
  const tds = tr.getElementsByTagName("td");

  for (let i = 0; i < tds.length; i++) {
    tds[i].style.backgroundColor = "rgba(0, 153, 13, 0.95)";
  }
}

const f = document.getElementById("calendar");
f.value = dataSelecionadaGlobal;

document.addEventListener("DOMContentLoaded", function () {
  flatpickr("#calendar", {
    dateFormat: "d/m/Y",
    allowInput: true, // permite foco/click mesmo com readonly
  });
});

function restaurarCor(event) {
  const elemento = event.target;
  const tr = elemento.closest("tr");
  const tds = tr.getElementsByTagName("td");

  for (let i = 0; i < tds.length; i++) {
    tds[i].style.backgroundColor = "";
  }
}

document.querySelectorAll("table").forEach((td) => {
  td.addEventListener("mouseover", verificarMouse);
  td.addEventListener("mouseout", restaurarCor);
});

f.addEventListener("change", () => {
  let nova_data = f.value.split("-");
  nova_data = `${nova_data[2]}_${nova_data[1]}_${nova_data[0]}`;
  df = nova_data;
  carregarDados(`Jsons/Nat_${nova_data}.json`, "tabela-dados", "MAIORES"); // Carrega os dados do arquivo ofensores.json
  carregarDados(`Jsons/Nat_${nova_data}.json`, "tabela-separacao", "SEPARAÇÃO"); // Carrega os dados do arquivo separação.json
  carregarDados(
    `Jsons/Nat_${nova_data}.json`,
    "tabela-ressuprimento",
    "RESSUPRIMENTO"
  );
});

async function initCalendar() {
  try {
    const response = await fetch("Jsons/config.json");
    const data = await response.json();
    const availableDates = data.DIAS;

    console.log("Datas disponíveis:", availableDates);

    flatpickr("#calendar", {
      locale: "pt",
      altInput: true,
      altFormat: "d-m-Y", // Exibição amigável
      dateFormat: "Y-m-d", // Formato usado internamente
      enable: availableDates, // Apenas datas permitidas
      defaultDate: localStorage.getItem("data") || availableDates[0],
      locale: {
        firstDayOfWeek: 1,
      },
      onChange: function (selectedDates, dateStr, instance) {
        // dateStr vem no formato Y-m-d, já no formato correto
        localStorage.setItem("data", dateStr);
        df = dateStr;
        console.log("Data selecionada:", dateStr);
      },
    });
  } catch (error) {
    console.error("Erro ao carregar datas:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  carregarDados();

  // Inicializa o calendário
  initCalendar();

  // Define o valor inicial no campo, se ainda não estiver definido
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = (hoje.getMonth() + 1).toString().padStart(2, "0");
  const dia = hoje.getDate().toString().padStart(2, "0");

  const dataHoje = `${ano}-${mes}-${dia}`;
  const calendarioInput = document.querySelector("#calendar");

  // Se a data atual estiver nas datas permitidas, usa ela como valor inicial
  if (!localStorage.getItem("data")) {
    localStorage.setItem("data", dataHoje);
    calendarioInput.value = dataHoje;
  }

  // Atualiza gráficos e tabelas com base na data armazenada
  const dataSelecionada = localStorage.getItem("data");

  if (dataSelecionada) {
    atualizarGrafico_1("NAT");
    carregarTabela("NAT");
    atualizarRosquinhas(selectedTime);

    calendarioInput.value = dataSelecionada;
  }

  // Detecta troca manual da data (backup se necessário)
  calendarioInput.addEventListener("change", () => {
    const novaData = calendarioInput.value;
    localStorage.setItem("data", novaData);
    console.log("Data manualmente alterada:", novaData);
  });
});

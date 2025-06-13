// Variáveis e constantes globais
let grafico = null;
let animacaoRadar = null;
let offset = 0;
const intensidade = Array(1000).fill(0);
let valor_atual = null;
let dados_finais = null;
let caminhoArquivo = null; // Este valor passará a conter a string do arquivo unificado, p. ex.: "Jsons/Nat_27_03_2025.json"
const alturaGrafico = 1000;
const larguraGrafico = 600;
let horarios = []; // Array global para armazenar os horários lidos do JSON
let dataFormatada;
let meusDias;
let atual;
// Objeto para armazenar as instâncias dos gráficos de rosca
const pieCharts = {};
document.addEventListener("DOMContentLoaded", () => {
  const dataSalva = localStorage.getItem("data");
  let dataParaUsar;

  if (dataSalva) {
    dataParaUsar = dataSalva;
  } else {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, "0");
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const ano = hoje.getFullYear();
    dataParaUsar = `${dia}-${mes}-${ano}`;
    
    localStorage.setItem("data", dataParaUsar);
  }
  let [ano, mes, dia] = dataParaUsar.split('-');
  dataParaUsar = `${dia}-${mes}-${ano}`;
  // ✅ Atualiza o campo do calendário (caso ele exista)
  const calendarInput = document.getElementById("calendar");
  if (calendarInput) {
    calendarInput.value = dataParaUsar;
  }

  // ✅ Carrega os dados da data correta
  carregarDadosDoDia(dataParaUsar);
});


// Cache de elementos do DOM
const sidebar = document.getElementById("sidebar");
const openBtn = document.getElementById("open-btn");
const closeBtn = document.getElementById("close-btn");
const content = document.querySelector(".content");
const toggleItemsBtns = [
  document.getElementById("toggle-items"),
  document.getElementById("toggle-items1"),
  document.getElementById("toggle-items2"),
];
const itemLists = [
  document.getElementById("itemlist"),
  document.getElementById("itemlist1"),
  document.getElementById("itemlist2"),
];
const toggleDetalhamentoBtn = document.getElementById("toggle-detalhamento");
const detalhamentoContainer = document.getElementById("detalhamento-container");
const ofensoresBtn = document.getElementById("ofensores-btn");
const rotasBtn = document.getElementById("rotas-btn");
const timeSlider = document.getElementById("timeSlider");
const timeLabel = document.getElementById("timeLabel");
const showCalendarBtn = document.getElementById("show-calendar-btn");
const calendar = document.getElementById("calendar");

// Função debounce para limitar a frequência de execução
const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

// Funções utilitárias
const toggleVisibility = (element) => element.classList.toggle("show");
const redirectToPage = (url) => (window.location.href = url);
const toggleSidebar = (action) => {
  const method = action === "open" ? "add" : "remove";
  sidebar.classList[method]("open");
  content.classList[method]("open");
};

// Eventos relacionados à sidebar
openBtn.addEventListener("click", () => toggleSidebar("open"));
closeBtn.addEventListener("click", () => toggleSidebar("close"));
document.addEventListener("click", (event) => {
  if (
    !sidebar.contains(event.target) &&
    !openBtn.contains(event.target) &&
    sidebar.classList.contains("open")
  ) {
    toggleSidebar("close");
  }
});
toggleItemsBtns.forEach((btn, index) => {
  btn.addEventListener("click", () => toggleVisibility(itemLists[index]));
});
toggleDetalhamentoBtn.addEventListener("click", () => {
  detalhamentoContainer.style.display =
    detalhamentoContainer.style.display === "none" ? "block" : "none";
});
ofensoresBtn.addEventListener("click", () => redirectToPage("OFENSORES.html"));
rotasBtn.addEventListener("click", () =>
  redirectToPage("ROTAS POR SETOR.html")
);

// Função para carregar JSON sem cache
const carregarJsonComCache = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Erro ao carregar o JSON");
    }
    const jsonData = await response.json();
    return jsonData;
  } catch (error) {
    console.error("Erro ao carregar o JSON:", error);
  }
};

// Função para carregar dados do dia baseado na data selecionada no calendário
// Agora, converte a data (YYYY-MM-DD) para o formato "Nat_DD_MM_YYYY.json"
const carregarDadosDoDia = (dataStr) => {
  const [day, month, year] = dataStr.split("-");
  const novoArquivo = `Nat_${day}_${month}_${year}.json`;
  caminhoArquivo = `Jsons/${novoArquivo}`;

  // Atualiza gráficos e tabelas com o novo arquivo unificado
  atualizarStatus();
  atualizarGrafico_1("NAT");
  carregarTabela("NAT");
  carregarDadosMaiores();
  atualizarRosquinhas(selectedTime);
  fetchNATSetor();
};

// FUNÇÕES RELACIONADAS AO GRÁFICO DE LINHAS (Radar NAT)
// Cria ou atualiza o gráfico de linhas
const atualizarGrafico = (labels, valores, nivelMeta, tipo, dadosVazios = false) => {
  const ctx = document.getElementById("graficoLinha").getContext("2d");
  const nome = `${tipo} %`;
  const gradient = criarDegradeRadar(ctx, alturaGrafico);

  if (grafico) {
    grafico.destroy(); // destrói o gráfico anterior antes de recriar
  }

  grafico = new Chart(
    ctx,
    criarGraficoConfig(labels, valores, gradient, nome, nivelMeta, dadosVazios)
  );

  if (!dadosVazios) {
    animarRadar(ctx, grafico.data.datasets[0], alturaGrafico);
  }
};

const atualizarGraficoExistente = (
  grafico,
  labels,
  valores,
  gradient,
  nome,
  nivelMeta
) => {
  grafico.data.labels = labels;
  grafico.data.datasets[0].data = valores;
  grafico.data.datasets[0].backgroundColor = gradient;
  grafico.data.datasets[0].label = nome;
  const metaLine = grafico.options.plugins.annotation.annotations.linhaMeta;
  metaLine.yMin = nivelMeta;
  metaLine.yMax = nivelMeta;
  metaLine.label.content = `${nivelMeta}`;
  grafico.update();
};

const criarDegradeRadar = (ctx, largura) => {
  const gradient = ctx.createLinearGradient(0, 0, largura, 0);
  for (let i = 0; i < largura; i++) {
    const alpha = intensidade[i] || 0;
    gradient.addColorStop(i / largura, `rgba(0, 255, 255, ${alpha})`);
  }
  return gradient;
};

const animarRadar = (ctx, dataset, largura) => {
  const frame = () => {
    for (let i = 0; i < largura; i++) {
      intensidade[i] *= 0.95;
    }
    intensidade[offset] = 1;
    if (offset + 1 < largura) intensidade[offset + 1] = 1.01;
    if (offset + 2 < largura) intensidade[offset + 2] = 1;

    offset += 3;
    if (offset >= largura) {
      offset = 0;

    }
    dataset.backgroundColor = criarDegradeRadar(ctx, largura);
    if (grafico) grafico.update();
    animacaoRadar = requestAnimationFrame(frame);
  };
  cancelAnimationFrame(animacaoRadar);
  animacaoRadar = requestAnimationFrame(frame);
};

const criarGraficoConfig = (labels, valores, gradient, nome, nivelMeta, dadosVazios = false) => {
  return {
    type: "line",
    data: {
      labels: dadosVazios ? [] : labels,
      datasets: dadosVazios ? [] : [
        {
          label: nome,
          data: valores,
          borderColor: "rgb(0, 255, 255)",
          backgroundColor: gradient,
          fill: true,
          tension: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        tooltip: { enabled: !dadosVazios, position: "nearest" },
        annotation: dadosVazios
          ? {}
          : {
              annotations: {
                linhaMeta: {
                  type: "line",
                  yMin: nivelMeta,
                  yMax: nivelMeta,
                  borderColor: "rgb(214, 110, 15)",
                  borderWidth: 2,
                  label: {
                    content: `${nivelMeta}`,
                    enabled: true,
                    position: "start",
                    backgroundColor: "black",
                    color: "white",
                    font: { weight: "bold" },
                  },
                },
              },
            },
      },
      scales: {
        x: {
          title: { display: true, text: "Hora" },
          ticks: { autoSkip: true, maxRotation: 45, minRotation: 0 },
          display: !dadosVazios,
        },
        y: {
          title: { display: true, text: "Valor" },
          min: 0,
          ticks: { stepSize: 1 },
          display: !dadosVazios,
        },
      },
    },
    plugins: [
      {
        id: "mensagemSemDados",
        beforeDraw: (chart) => {
          if (dadosVazios) {
            const { width, height } = chart;
            const ctx = chart.ctx;
            ctx.save();
            ctx.clearRect(0, 0, width, height);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#ffffff";
            ctx.font = "18px Arial";
            ctx.fillText("Sem dados disponíveis, volte mais tarde...", width / 2, height / 2);
            ctx.restore();
          }
        },
      },
    ],
  };
};

// Atualiza o gráfico principal usando os dados da seção GRAFICO dentro do arquivo unificado
let selectedTime = "07:30";
const atualizarGrafico_1 = async (categoria) => {
  let labels = [], valores = [], nivelMeta = 6, dadosVazios = true;

  try {
    const data = await carregarJsonComCache(caminhoArquivo);
    if (!data || !data.GRAFICO) {
      // JSON não existe ou não tem dados da seção GRAFICO
      atualizarGrafico(labels, valores, nivelMeta, categoria, dadosVazios);
      return;
    }

    categoria = categoria === "DROPS" ? "DROP'S" : categoria;

    const config = data.GRAFICO[categoria];
    if (!config || Object.keys(config).length === 0) {
      // Categoria não encontrada ou vazia
      atualizarGrafico(labels, valores, nivelMeta, categoria, dadosVazios);
      return;
    }

    labels = Object.keys(config);
    valores = Object.values(config);
    dadosVazios = valores.length === 0 || valores.every(v => v === 0 || v == null);
    nivelMeta = data.GRAFICO.META?.[categoria] ?? 6;

    atualizarGrafico(labels, valores, nivelMeta, categoria, dadosVazios);
    carregarTabela(categoria);
    atualizarRosquinhas(selectedTime);
    valor_atual = categoria;

  } catch (error) {
    console.error("Erro ao carregar JSON:", error);
    // Mesmo em caso de erro (ex: arquivo não existe), exibe o gráfico com mensagem
    atualizarGrafico([], [], 6, categoria, true);
  }
};


// Atualiza as informações de cada setor ao clicar nos botões respectivos
function atualizarTudo(categoria) {
  atualizarGrafico_1(categoria);
  carregarTabela(categoria);
  atual = categoria;
}

const carregarTabela = async (categoria) => {
  try {
    const jsonData = await carregarJsonComCache(caminhoArquivo);
    if (!jsonData) return;

    categoria = categoria === "DROPS" ? "DROP'S" : categoria;
    // Os dados da tabela estão na seção TOP3
    const catData = jsonData.TOP3[categoria];
    console.log("Dados da tabela carregados:", catData);
    if (!catData || !Array.isArray(catData.SKU)) {
      console.error(
        `Estrutura de dados inválida para a categoria "${categoria}".`
      );
      return;
    }
    const container = document.getElementById("top1");
    container.innerHTML = "";
    for (let i = 0; i < catData.SKU.length; i++) {
      container.appendChild(
        criarLinhaTabela(
          catData.SKU[i],
          catData.DESCRIÇÃO[i],
          catData.SUGESTÃO[i],
          catData.FATURADO[i],
          catData.NAT[i]
        )
      );
    }
  } catch (error) {
    console.error("Erro ao carregar a tabela:", error);
  }
};

const criarLinhaTabela = (sku, descricao, sugestao, faturada, nat) => {
  const linha = document.createElement("div");
  linha.style.cssText = "display: flex; flex-direction: row; gap: 20px;";
  linha.appendChild(criarItem(sku));
  linha.appendChild(criarItem(descricao));
  linha.appendChild(criarItemComTitulo("Sugestão", sugestao));
  linha.appendChild(criarItemComTitulo("Faturada", faturada));
  linha.appendChild(criarItemComTitulo("NAT", nat));
  return linha;
};

const criarItem = (value) => {
  const item = document.createElement("div");
  item.textContent = value;
  return item;
};

const criarItemComTitulo = (label, value) => {
  const item = document.createElement("div");
  item.textContent = `${label.toUpperCase()}: ${value}`;
  return item;
};

// Carrega o status do CD
async function atualizarStatus() {
  // Carrega o JSON usando o caminhoArquivo já atualizado pela data selecionada
  const dadosJson = await carregarJsonComCache(caminhoArquivo);
  if (dadosJson) {
    const sugestao = Number(dadosJson["SUGESTÃO"]).toLocaleString("pt-BR");
    const escaneado = Number(dadosJson["ESCANEADO"]).toLocaleString("pt-BR");
    const nat = Number(dadosJson["NAT_GERAL"]).toLocaleString("pt-BR");

    document.getElementById("sugestao").innerText = `SUGESTÃO: ${sugestao}`;
    document.getElementById("escaneado").innerText = `ESCANEADO: ${escaneado}`;
    document.getElementById("nat").innerText = `NÃO ATENDIDO: ${nat}`;
  } else {
    console.error(
      "Não foi possível carregar os dados para atualizar os extras."
    );
  }
}

// Atualiza os "dados maiores" (OFENSORES) a cada segundo
const carregarDadosMaiores = async () => {
  try {
    const jsonData = await carregarJsonComCache(caminhoArquivo);
    const dadosOfensores = jsonData.OFENSORES;
    if (dadosOfensores) {
      document.getElementById("previsao").textContent =
        dadosOfensores["PREVISÃO"];
      document.getElementById("1").textContent = dadosOfensores["1"];
      document.getElementById("2").textContent = dadosOfensores["2"];
      document.getElementById("3").textContent = dadosOfensores["3"];
    }
  } catch (error) {
    console.error("Erro ao carregar os dados maiores:", error);
  }
};



// Função para buscar os dados do NAT_POR_SETOR e atualizar o slider dinamicamente
const fetchNATSetor = async () => {
  try {
    const jsonData = await carregarJsonComCache(caminhoArquivo);
    dados_finais = jsonData.NAT_POR_SETOR;
    if (dados_finais) {
      const chaves = Object.keys(dados_finais).sort();
      horarios = chaves;
      const sliderWrapper = document.getElementById("sliderWrapper");
      if (sliderWrapper) {
        criarSlider(horarios);
      } else if (timeSlider) {
        timeSlider.min = 0;
        timeSlider.max = chaves.length - 1;
        timeSlider.value = 0;
      }
      if (timeLabel) {
        timeLabel.textContent = chaves[0];
      }
      selectedTime = chaves[0];
    }
  } catch (error) {
    console.error("Erro ao carregar NAT_POR_SETOR:", error);
  }
};

function criarSlider(horarios) {
  const sliderWrapper = document.getElementById("sliderWrapper");
  if (!sliderWrapper) return;
  sliderWrapper.innerHTML = "";
  if (horarios.length === 0) return;

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = (horarios.length - 1).toString();
  slider.value = "0";
  slider.step = "1";
  slider.id = "timeSlider";
  slider.addEventListener("input", function () {
    if (timeLabel) {
      timeLabel.innerText = horarios[slider.value];
    }
    selectedTime = horarios[slider.value];
    console.time("Atualização dos gráficos");
    criarGraficoRosquinha(dados_finais, "MAQUINA", "grafico1", selectedTime);
    criarGraficoRosquinha(dados_finais, "MEZANINO", "grafico2", selectedTime);
    criarGraficoRosquinha(dados_finais, "EXTERNO", "grafico3", selectedTime);
    console.timeEnd("Atualização dos gráficos");
  });
  sliderWrapper.appendChild(slider);
}

// Funções para exibir/ocultar o loading
const showLoading = () => {
  const loading = document.getElementById("loading");
  if (loading) loading.style.display = "block";
};

const hideLoading = () => {
  const loading = document.getElementById("loading");
  if (loading) loading.style.display = "none";
};

// Atualiza os gráficos de rosca (pie charts) utilizando os dados de NAT_POR_SETOR
const atualizarRosquinhas = async (cat = "07:30") => {
  showLoading();
  try {
    const jsonData = await carregarJsonComCache(caminhoArquivo);
    dados_finais = jsonData.NAT_POR_SETOR;
    criarGraficoRosquinha(dados_finais, "MAQUINA", "grafico1", cat);
    criarGraficoRosquinha(dados_finais, "MEZANINO", "grafico2", cat);
    criarGraficoRosquinha(dados_finais, "EXTERNO", "grafico3", cat);
  } catch (error) {
    console.error("Erro ao carregar os dados dos gráficos de rosca:", error);
  } finally {
    hideLoading();
  }
};

const criarGraficoRosquinha = (data, tipo, containerId, horario) => {
  if (!data) return;
  const safeToFixed = (value) =>
    typeof value === "number" && !isNaN(value) ? value.toFixed(2) : 0;
  let valores = [];
  let labels = [];

  if (tipo === "MAQUINA") {
    valores = [
      safeToFixed(data[horario]["M"]),
      safeToFixed(data[horario]["Y"]),
      safeToFixed(data[horario]["V"]),
      safeToFixed(data[horario]["H"]),
    ];
    labels = ["M", "Y", "V", "H"];
  } else if (tipo === "MEZANINO") {
    valores = [
      safeToFixed(data[horario]["A"]),
      safeToFixed(data[horario]["X"]),
      safeToFixed(data[horario]["N"]),
      safeToFixed(data[horario]["J"]),
      safeToFixed(data[horario]["W"]),
    ];
    labels = ["A", "X", "N", "J", "W"];
  } else if (tipo === "EXTERNO") {
    valores = [
      safeToFixed(data[horario]["D"]),
      safeToFixed(data[horario]["K"]),
      safeToFixed(data[horario]["Z"]),
    ];
    labels = ["D", "K", "Z"];
  }

  const chartData = valores.map((valor, index) => ({
    x: labels[index],
    value: valor,
  }));
  const containerElem = document.getElementById(containerId);
  if (pieCharts[containerId]) {
    const chart = pieCharts[containerId];
    chart.data(chartData);
    chart.draw();
  } else {
    const chart = anychart.pie(chartData);
    chart.animation(false);
    chart.interactivity().hoverMode("none");
    chart.innerRadius("30%");
    chart.legend().enabled(false);
    chart.title({
      text: tipo,
      fontSize: 20,
      fontColor: "white",
      fontWeight: "bold",
      alignment: "center",
      padding: [0, 0, 10, 0],
    });
    chart
      .labels()
      .position("outside")
      .format("{%x}: \n {%value}%")
      .fontSize(15)
      .fontColor("white");
    chart.connectorStroke({ color: "white", thickness: 2, dash: "2 2" });
    chart.background().fill("rgb(20, 20, 20)");
    chart.container(containerId);
    chart.draw();
    pieCharts[containerId] = chart;
  }
};

// Listener para o slider (caso exista um input fixo)
if (timeSlider) {
  timeSlider.addEventListener("change", () => {
    selectedTime = horarios[timeSlider.value];
    if (timeLabel) timeLabel.textContent = selectedTime;
    console.time("Atualização dos gráficos");
    criarGraficoRosquinha(dados_finais, "MAQUINA", "grafico1", selectedTime);
    criarGraficoRosquinha(dados_finais, "MEZANINO", "grafico2", selectedTime);
    criarGraficoRosquinha(dados_finais, "EXTERNO", "grafico3", selectedTime);
    console.timeEnd("Atualização dos gráficos");
  });
}

const destruirGraficoRosquinhas = () => {
  for (const containerId in pieCharts) {
    if (pieCharts.hasOwnProperty(containerId)) {
      pieCharts[containerId].dispose();
      delete pieCharts[containerId];
    }
  }
};

function carregarDados() {
  return fetch('config.json')
    .then(resposta => resposta.json())
    .then(data => {
      localStorage.setItem('DIAS', data);
    });
}


async function initCalendar() {
  try {
      const response = await fetch('Jsons/config.json'); // arquivo JSON local
      const data = await response.json();
      const availableDates = data.DIAS;

      console.log(availableDates);

      flatpickr("#calendar", {
          altInput: true,           // Cria um input 'bonito' 
          altFormat: "d-m-Y",        // Formato que o usuário vê
          dateFormat: "Y-m-d",       // Formato interno para o flatpickr trabalhar
          enable: availableDates,   // Datas habilitadas
          locale: 'pt',
          allowInput: true,
          defaultDate: localStorage.getItem('data') || availableDates[0], // Pega data salva ou primeira disponível
          onChange: function(selectedDates, dateStr, instance) {

              let [Ano, Mes, Dia] = dateStr.split('-');
              let nova_data = `${Dia}-${Mes}-${Ano}`;
              localStorage.setItem('data', nova_data);
              console.log('Data que adjklsjdkad: ', nova_data);

              carregarDadosDoDia(nova_data);
              destruirGraficoRosquinhas();
              
          },
      });

  } catch (error) {
      console.error("Erro ao carregar datas:", error);
  }
}


let dataSelecionadaGlobal = localStorage.getItem('data'); // 2025-04-20
let df = dataSelecionadaGlobal.split('-');
df = `${df[2]}_${df[1]}_${df[0]}`; // 20_04_2025


document.addEventListener("DOMContentLoaded", () => {
  

  carregarDados();
  if (!meusDias){
    carregarDados();
  }
  initCalendar();


  // Define o valor inicial como a data atual (se for permitida)
  const hoje = new Date() ;
  const ano = hoje.getFullYear();
  const mes = (hoje.getMonth() + 1).toString().padStart(2, "0");
  const dia = hoje.getDate().toString().padStart(2, "0");
  dataFormatada = `${dia}-${mes}-${ano}`;
  

  atualizarGrafico_1("NAT");
  carregarTabela("NAT");
  atualizarRosquinhas(selectedTime);

  calendar.value = dataFormatada;


  calendar.addEventListener("change", () => {
    const dataSelecionada = calendar.value;
    localStorage.setItem('data', dataSelecionada);
    console.log("Data selecionada:", dataSelecionada);
    
   
  });
});

// Função para buscar os dias permitidos do servidor


// Função para bloquear dias não permitidos

atualizarGrafico_1("NAT");


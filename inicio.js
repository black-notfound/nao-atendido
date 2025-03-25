// Variáveis e constantes globais
let grafico = null;
let animacaoRadar = null;
let offset = 0;
const intensidade = Array(1000).fill(0);
let valor_atual = null;
let dados_finais = null;
let caminhoArquivo = null;
const alturaGrafico = 1000;
const larguraGrafico = 600;
let horarios = []; // Array global para armazenar os horários lidos do JSON

// Objeto para armazenar as instâncias dos gráficos de rosca
const pieCharts = {};

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
    // Faz a requisição e aguarda a resposta
    const response = await fetch(url);
    
    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
      throw new Error("Erro ao carregar o JSON");
    }
    
    // Converte a resposta para JSON
    const jsonData = await response.json();
    
    // Retorna os dados em formato JSON
    return jsonData;
  } catch (error) {
    // Captura e exibe qualquer erro
    console.error("Erro ao carregar o JSON:", error);
  }
};

// Função para carregar dados do dia baseado na data selecionada no calendário
const carregarDadosDoDia = (dataStr) => {
  // Monta o caminho do arquivo JSON para o dia selecionado
  caminhoArquivo = `Jsons/${dataStr}`;

  atualizarGrafico_1("NAT");
  carregarTabela();
  carregarDadosMaiores();
  atualizarRosquinhas(selectedTime);
  // Atualiza os horários (e o slider) com base no novo arquivo
  fetchNATSetor();
};

// Funções relacionadas ao gráfico de linhas (Radar NAT)
const atualizarGrafico = (labels, valores, nivelMeta, tipo) => {
  const ctx = document.getElementById("graficoLinha").getContext("2d");
  const nome = `${tipo} %`;
  const gradient = criarDegradeRadar(ctx, alturaGrafico);

  if (grafico) {
    atualizarGraficoExistente(
      grafico,
      labels,
      valores,
      gradient,
      nome,
      nivelMeta
    );
  } else {
    grafico = new Chart(
      ctx,
      criarGraficoConfig(labels, valores, gradient, nome, nivelMeta)
    );
  }
  animarRadar(ctx, grafico.data.datasets[0], alturaGrafico);
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
    // Decai a intensidade de cada ponto
    for (let i = 0; i < largura; i++) {
      intensidade[i] *= 0.95;
    }
    // Atualiza intensidade em posições específicas
    intensidade[offset] = 1;
    if (offset + 1 < largura) intensidade[offset + 1] = 1.01;
    if (offset + 2 < largura) intensidade[offset + 2] = 1;

    offset += 3;
    if (offset >= largura) {
      offset = 0;
      atualizarGrafico_1(valor_atual);
      // Opcional: atualizar também os dados do NAT_setor periodicamente
      fetchNATSetor();
      atualizarRosquinhas("07:30");
    }
    dataset.backgroundColor = criarDegradeRadar(ctx, largura);
    if (grafico) grafico.update();
    animacaoRadar = requestAnimationFrame(frame);
  };
  cancelAnimationFrame(animacaoRadar);
  animacaoRadar = requestAnimationFrame(frame);
};

const criarGraficoConfig = (labels, valores, gradient, nome, nivelMeta) => ({
  type: "line",
  data: {
    labels,
    datasets: [
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
      tooltip: { enabled: true, position: "nearest" },
      annotation: {
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
      },
      y: {
        title: { display: true, text: "Valor" },
        min: 0,
        ticks: { stepSize: 1 },
      },
    },
  },
});

// Atualiza o gráfico com base na categoria
let selectedTime = "07:30";
const atualizarGrafico_1 = async (categoria) => {
  const data = await carregarJsonComCache(
    `${caminhoArquivo}/Configuracoes_grafico.json`
  );
  if (!data) return;
  categoria = categoria === "DROPS" ? "DROP'S" : categoria;
  const soma = data[categoria];
  const labels = Object.keys(soma);
  const valores = Object.values(soma);
  const nivelMeta = data.META[categoria] || 6;

  atualizarGrafico(labels, valores, nivelMeta, categoria);
  carregarTabela();
  atualizarRosquinhas(selectedTime);
  valor_atual = categoria;
};

// Funções de manipulação da tabela
const carregarTabela = async () => {
  const data = await carregarJsonComCache(`${caminhoArquivo}/3ofensores.json`);
  if (!data) return;

  document.getElementById(
    "sugestao"
  ).textContent = `Sugestão: ${data.SUGESTÃO.toLocaleString("pt-BR")}`;
  document.getElementById(
    "escaneado"
  ).textContent = `Escaneado: ${data.ESCANEADO.toLocaleString("pt-BR")}`;
  document.getElementById("nat").textContent = `NAT: ${data.Und_NAT.toLocaleString(
    "pt-BR"
  )}`;

  const container = document.getElementById("top1");
  container.innerHTML = "";
  data.SKU.forEach((SKU, index) => {
    container.appendChild(
      criarLinhaTabela(
        SKU,
        data.DESCRIÇÃO[index],
        data.SUGESTÃO[index],
        data.FATURADO[index],
        data.NAT[index]
      )
    );
  });
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

// Atualiza dados dos "maiores" a cada segundo
const carregarDadosMaiores = () => {
  fetch(`${caminhoArquivo}/maiores.json`)
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("previsao").textContent = data.previsao;
      document.getElementById("1").textContent = `${data["1"]}`;
      document.getElementById("2").textContent = `${data["2"]}`;
      document.getElementById("3").textContent = `${data["3"]}`;
      document.getElementById(
        "4"
      ).textContent = data["FATURADO"];
    })
    .catch((error) => console.error("Erro ao carregar o arquivo JSON:", error));
};
setInterval(carregarDadosMaiores, 1000);
window.onload = carregarDadosMaiores;

// Função para buscar os dados do NAT_setor e atualizar o slider dinamicamente
const fetchNATSetor = async () => {
  try {
    const dados = await carregarJsonComCache(
      `${caminhoArquivo}/NAT_setor.json`
    );
    dados_finais = dados;
    if (dados) {
      // Extrai as chaves (horários) do JSON e ordena-as
      const chaves = Object.keys(dados).sort();
      horarios = chaves;

      // Se o container do slider existe, cria o slider dinamicamente
      const sliderWrapper = document.getElementById("sliderWrapper");
      if (sliderWrapper) {
        criarSlider(horarios);
      } else if (timeSlider) {
        // Se o input fixo existir, atualiza seus atributos
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
    console.error("Erro ao carregar NAT_setor.json:", error);
  }
};

function criarSlider(horarios) {
  const sliderWrapper = document.getElementById("sliderWrapper");
  if (!sliderWrapper) return;

  sliderWrapper.innerHTML = ""; // Remove sliders antigos

  if (horarios.length === 0) return;

  // Cria o input range dinamicamente
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = (horarios.length - 1).toString();
  slider.value = "0";
  slider.step = "1";
  slider.id = "timeSlider";

  // Atualiza o label conforme o slider se move
  slider.addEventListener("input", function () {
    if (timeLabel) {
      timeLabel.innerText = horarios[slider.value];
    }
    selectedTime = horarios[slider.value];
    // Atualize os gráficos conforme necessário aqui
    console.time("Atualização dos gráficos");
    criarGraficoRosquinha(dados_finais, "MAQUINA", "grafico1", selectedTime);
    criarGraficoRosquinha(dados_finais, "MEZANINO", "grafico2", selectedTime);
    criarGraficoRosquinha(dados_finais, "EXTERNO", "grafico3", selectedTime);
    console.timeEnd("Atualização dos gráficos");
  });

  sliderWrapper.appendChild(slider);
}

// Função para exibir o loading
const showLoading = () => {
  const loading = document.getElementById("loading");
  if (loading) loading.style.display = "block";
};

// Função para ocultar o loading
const hideLoading = () => {
  const loading = document.getElementById("loading");
  if (loading) loading.style.display = "none";
};

// Função para criar/atualizar os gráficos de rosca (pie charts)
// O loading é exibido enquanto os dados são carregados e ocultado assim que os gráficos são atualizados.
const atualizarRosquinhas = async (cat = "07:30") => {
  showLoading();
  try {
    // Busca os dados atualizados do NAT_setor
    dados_finais = await carregarJsonComCache(
      `${caminhoArquivo}/NAT_setor.json`
    );
    criarGraficoRosquinha(dados_finais, "MAQUINA", "grafico1", cat);
    criarGraficoRosquinha(dados_finais, "MEZANINO", "grafico2", cat);
    criarGraficoRosquinha(dados_finais, "EXTERNO", "grafico3", cat);
  } catch (error) {
    console.error("Erro ao carregar os dados dos gráficos:", error);
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

// Registra o listener do slider, usando o array global "horarios" atualizado pela função fetchNATSetor
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
      // Destrói o gráfico existente
      pieCharts[containerId].dispose();
      // Remove a referência ao gráfico
      delete pieCharts[containerId];
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  if (!calendar) {
    console.error("Elemento #calendar não encontrado!");
    return;
  }

  const diasPermitidos = fetchDiasPermitidos();
  console.log(diasPermitidos);
  inicializarCalendario(calendar, diasPermitidos);

  // Define o valor inicial como a data atual (se for permitida)
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = (hoje.getMonth() + 1).toString().padStart(2, "0");
  const dia = hoje.getDate().toString().padStart(2, "0");
  const dataFormatada = `${ano}-${mes}-${dia}`;
  carregarDadosDoDia(dataFormatada);

  atualizarGrafico_1("NAT");
  carregarTabela();
  // Chama fetchNATSetor() dentro de carregarDadosDoDia já atualiza o slider
  atualizarRosquinhas(selectedTime);

  calendar.value = dataFormatada;

  // Evento de mudança no calendário
  calendar.addEventListener("change", () => {
    const dataSelecionada = calendar.value;
    console.log("Data selecionada:", dataSelecionada);
    // Destrói os gráficos de rosca atuais
    destruirGraficoRosquinhas();
    // Carrega os dados da nova data e reconstrói os gráficos (e atualiza o slider)
    carregarDadosDoDia(dataSelecionada);
  });
});

// Função para buscar os dias permitidos do servidor
function fetchDiasPermitidos() {
  return fetch("vscode/settings.json") // Faz a requisição ao arquivo JSON
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erro ao carregar o JSON");
      }
      return response.json(); // Converte a resposta para JSON
    })
    .then((data) => {
      return data.DIAS; // Retorna a chave "DIAS" corretamente
    })
    .catch((error) => {
      console.error("Erro:", error);
      return null; // Retorna null em caso de erro
    });
}

// Função para bloquear dias não permitidos
function inicializarCalendario(calendar, diasPermitidos) {
  calendar.addEventListener("input", () => {
    const selecionado = calendar.value;
  });

  // Desativa os dias não permitidos visualmente (se suportado)
  if (calendar.type === "date") {
    calendar.setAttribute("min", diasPermitidos[0] || "");
    calendar.setAttribute(
      "max",
      diasPermitidos[diasPermitidos.length - 1] || ""
    );
  }
}

atualizarGrafico_1("NAT");

document.addEventListener("DOMContentLoaded", function () {
  // Pega o horário atual em minutos
  const getCurrentTimeInMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  const lista = document.getElementById('selecionar');
  lista.addEventListener('change', function(){
    loadAndUpdateTable(lista.value);
    localStorage.setItem("local_rota", lista.value);
  });
  
  // Referências ao modal e overlay
  const modal = document.getElementById("modal");
  const overlay = document.getElementById("modal-overlay");

  // Função para carregar JSONs e atualizar as tabelas
  function loadAndUpdateTable(local) {
    const currentTime = getCurrentTimeInMinutes();

    fetch("Jsons/configuracoes.json")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar configuracoes.json");
        return res.json();
      })
      .then((configuracoes) => {
        return fetch("Jsons/Acompamento_de_rotas.json")
          .then((res) => {
            if (!res.ok) throw new Error("Erro ao carregar Acompamento_de_rotas.json");
            return res.json();
          })
          .then((rotas) => {
            // Converte "HH:MM" → minutos
            function timeToMinutes(time) {
              const [h, m] = time.split(":").map(Number);
              return h * 60 + m;
            }
            // Calcula cor conforme status e prazo
            function calculateColor(diff, limit, status) {
              if (status.toLowerCase() === "rota 100% produzida") return "green";
              if (limit < currentTime) return "red";
              const ratio = Math.min(diff / 100, 1);
              const r = Math.floor(255 * (1 - ratio));
              const g = Math.floor(255 * ratio);
              return `rgb(${r},${g},0)`;
            }
            // Retorna lista [numero, qtd] de caixas pendentes dentro do intervalo
            function calculatePendingBoxes(rangeStr, sectorBoxes) {
              const m = rangeStr.match(/(\d+)\s*a\s*(\d+)/);
              if (!m) return [];
              const start = +m[1], end = +m[2], pend = [];
              for (let i = start; i <= end; i++) {
                const q = sectorBoxes[i] || 0;
                if (q > 0) pend.push([i.toString(), q]);
              }
              return pend;
            }

            // Aplica status, cor e caixas em cada setor
            function applyColors() {
              ["M", "Y", "V", "H"].forEach((sector) => {
                const cfg        = configuracoes[sector] || {};
                const statusData = rotas[sector]            || {};
                const boxesData  = (rotas.ROTAS[local] && rotas.ROTAS[local][sector]) || {};
                const rows       = document.querySelectorAll(`#tabela-${sector} tbody tr`);

                rows.forEach((row) => {
                  const rotaCell   = row.querySelector("td.rota");
                  const statusCell = row.querySelector("td.status");
                  const caixasCell = row.querySelector("td.caixas");
                  if (!rotaCell || !statusCell || !caixasCell) return;

                  const rota     = rotaCell.textContent.trim();
                  const horario  = (cfg[rota] && cfg[rota].horario) || "00:00";
                  const status   = statusData[rota] || "";
                  const limitMin = timeToMinutes(horario);
                  const diff     = Math.abs(limitMin - currentTime);
                  const color    = calculateColor(diff, limitMin, status);

                  // Preenche status
                  statusCell.style.backgroundColor = color;
                  if (limitMin < currentTime && status.toLowerCase() !== "rota 100% produzida") {
                    statusCell.textContent = "Atrasado";
                  } else {
                    statusCell.textContent = status || "Sem status";
                  }

                  // Calcula e preenche total de caixas pendentes
                  const pendList = calculatePendingBoxes(rota, boxesData);
                  const totalPend = pendList.reduce((sum, [,q]) => sum + q, 0);
                  caixasCell.textContent = totalPend;
                  caixasCell.style.cursor = totalPend > 0 ? "pointer" : "default";

                  // Abre o modal ao clicar, se houver pendência
                  caixasCell.onclick = () => {
                    if (totalPend === 0) return;
                    const lista = document.getElementById("caixas-list");
                    lista.innerHTML = pendList
                      .map(([num, q]) => `Caixa ${num}: ${q} pendente${q > 1 ? "s" : ""}`)
                      .join("<br>");
                    modal.classList.add("show");
                    overlay.classList.add("show");
                  };
                });
              });
            }

            applyColors();
          });
      })
      .catch((err) => console.error(err));
  }

  // Chamada inicial e intervalo de atualização
  loadAndUpdateTable('Pendentes');
  localStorage.setItem("local_rota", 'Pendentes');
  setInterval(loadAndUpdateTable(localStorage.getItem("local_rota"), 10000));

  // Fechar o modal usando apenas classes
  document.getElementById("close-modal").addEventListener("click", () => {
    modal.classList.remove("show");
    overlay.classList.remove("show");
  });
  overlay.addEventListener("click", () => {
    modal.classList.remove("show");
    overlay.classList.remove("show");
  });

  // --------- Seu código de sidebar (sem alterações) ---------
  const sidebar               = document.getElementById("sidebar");
  const openBtn               = document.getElementById("open-btn");
  const closeBtn              = document.getElementById("close-btn");
  const content               = document.querySelector(".content");
  const toggleItemsBtn        = document.getElementById("toggle-items");
  const toggleItemsBtn1       = document.getElementById("toggle-items1");
  const toggleItemsBtn2       = document.getElementById("toggle-items2");
  const itemList              = document.getElementById("itemlist");
  const itemList1             = document.getElementById("itemlist1");
  const itemList2             = document.getElementById("itemlist2");
  const toggleDetalhamentoBtn = document.getElementById("toggle-detalhamento");
  const detalhamentoContainer = document.getElementById("detalhamento-container");
  const ofensoresBtn          = document.getElementById("ofensores-btn");
  const rotasBtn              = document.getElementById("rotas-btn");

  openBtn.addEventListener("click", () => {
    sidebar.classList.add("open");
    content.classList.add("open");
  });
  closeBtn.addEventListener("click", () => {
    sidebar.classList.remove("open");
    content.classList.remove("open");
  });
  document.addEventListener("click", (evt) => {
    if (
      !sidebar.contains(evt.target) &&
      !openBtn.contains(evt.target) &&
      sidebar.classList.contains("open")
    ) {
      sidebar.classList.remove("open");
      content.classList.remove("open");
    }
  });
  toggleItemsBtn.addEventListener("click", () => itemList.classList.toggle("show"));
  toggleItemsBtn1.addEventListener("click", () => itemList1.classList.toggle("show"));
  toggleItemsBtn2.addEventListener("click", () => itemList2.classList.toggle("show"));
  toggleDetalhamentoBtn.addEventListener("click", () => {
    detalhamentoContainer.style.display =
      detalhamentoContainer.style.display === "none" ? "block" : "none";
  });
  ofensoresBtn.addEventListener("click", () => (window.location.href = "OFENSORES.html"));
  rotasBtn.addEventListener("click", () => (window.location.href = "ROTAS POR SETOR.html"));
});





// ===== CONFIG =====
const BARBERS = [
  { name: "Lucas", photo: "assets/lucas.jpg" },
  { name: "Noel",  photo: "assets/noel.jpg"  }
];

const TIMES = [
  "09:00","09:30","10:00","10:30","11:00","11:30","12:00",
  "14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00"
];

const LS_AUTH    = "nbs_admin_auth";
const LS_APPTS   = "nbs_agendamentos";
const LS_BLOCKS  = "nbs_bloqueios";
const LS_CLIENTS = "nbs_clientes";
const LS_SERV    = "nbs_servicos";
const LS_PAY     = "nbs_pagamentos";
const LS_BARBERS = "barbers";

// ===== ADMIN LOGIN =====
const ADMIN_LOGIN = "eunoeu";
const ADMIN_PASS  = "123456";

// ===== HELPERS =====
const moneyBR = (v) => (Number(v || 0)).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });

function todayISO(){
  const t = new Date();
  const yyyy = t.getFullYear();
  const mm = String(t.getMonth()+1).padStart(2,"0");
  const dd = String(t.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}
function readLS(key, fallback){
  try {const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } 
  catch {
    return fallback;
  }
}
function writeLS(key, data){ localStorage.setItem(key, JSON.stringify(data)); }
function uid(){ return Math.random().toString(16).slice(2) + Date.now().toString(16); }

// ===== AUTH GUARD =====
(function guard(){
  const isLogin = location.pathname.endsWith("/login.html") || location.pathname.endsWith("login.html");
  const isAdmin = location.pathname.endsWith("/admin.html") || location.pathname.endsWith("admin.html");

  if (isLogin){
    setupLogin();
    return;
  }
  if (isAdmin){
    const ok = readLS(LS_AUTH, { ok:false }).ok === true;
    if (!ok){
      location.href = "login.html";
      return;
    }
    setupAdmin();
  }
})();

function setupLogin(){
  const form = document.getElementById("loginForm");
  const msg  = document.getElementById("loginMsg");
  const forgot = document.getElementById("forgotBtn");

  if (forgot){
    forgot.addEventListener("click", () => {
      msg.textContent = "Fale com o administrador para redefinir sua senha.";
    });
  }

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.textContent = "";

    const u = (document.getElementById("loginUser")?.value || "").trim();
    const p = (document.getElementById("loginPass")?.value || "").trim();

    if (u === ADMIN_LOGIN && p === ADMIN_PASS){
      writeLS(LS_AUTH, { ok:true, at: Date.now() });
      location.href = "admin.html";
      return;
    }
    msg.textContent = "Usuário ou senha inválidos.";
  });
}

function setupAdmin(){
  // Defaults
  seedDefaults();

  // Elements
  const filterDate   = document.getElementById("filter-date");
  const filterBarber = document.getElementById("filter-barber");
  const agendaGrid   = document.getElementById("agenda-grid");

  // ===== MODAL AGENDAMENTO (ELEMENTS) =====
const apptDate   = document.getElementById("apptDate");
const apptTime   = document.getElementById("apptTime");
const apptBarber = document.getElementById("apptBarber");
const apptClient = document.getElementById("apptClient");
const apptService= document.getElementById("apptService");
const apptPay    = document.getElementById("apptPayment");
const apptStatus = document.getElementById("apptStatus");

// Popula select de barbeiros (uma vez)
apptBarber.innerHTML = '<option value="">Selecione</option>';
BARBERS.forEach(b => {
  const opt = document.createElement("option");
  opt.value = b.name;        
  opt.textContent = b.name; 
  apptBarber.appendChild(opt);
});

  if (agendaGrid){
  agendaGrid.addEventListener("click", (e) => {
    const cell = e.target.closest(".slot-cell");
    if (!cell) return;

    const date = getSelectedDate();
    const time = cell.dataset.time;
    const barber = cell.dataset.barber;

   const norm = (v) => String(v ?? "").trim().toLowerCase();

const appt = readLS(LS_APPTS, []).find(a =>
  norm(a.date) === norm(date) &&
  norm(a.time) === norm(time) &&
  norm(a.barber) === norm(barber)
);

    if (appt){
      openApptDetails(appt);
      return;
    }

    const block = readLS(LS_BLOCKS, []).find(b =>
      b.date === date && b.time === time && b.barber === barber
    );
    if (block){
      openBlockDetails(block);
      return;
    }
    return;
  });
}

  const btnBlock   = document.getElementById("btnBlock");
  const btnNewAppt = document.getElementById("btnNewAppt");
console.log("btnNewAppt:", btnNewAppt);

if (btnNewAppt){
  btnNewAppt.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("✅ clique no Novo Agendamento");

    hydrateApptForm();        // 🔥 preenche clientes, barbeiros e horários
    openApptModalManual();    // 🔥 abre o modal
  };
}
  const logoutBtn  = document.getElementById("logoutBtn");
  const pageTitle = document.getElementById("pageTitle");
  const agendaActions = document.getElementById("agendaActions");

  const navItems = Array.from(document.querySelectorAll(".nav-item[data-view]"));
  const views = {
    agenda: document.getElementById("view-agenda"),
    historico: document.getElementById("view-historico"),
    caixa: document.getElementById("view-caixa"),
    clientes: document.getElementById("view-clientes"),
    servicos: document.getElementById("view-servicos"),
    pagamentos: document.getElementById("view-pagamentos"),
    config: document.getElementById("view-config"),
  };
  if (filterDate){
    filterDate.value = todayISO();
    filterDate.addEventListener("change", () => refreshAll());
  }
  if (filterBarber){
    filterBarber.addEventListener("change", () => refreshAgenda());
  }

  navItems.forEach(btn => {
    btn.addEventListener("click", () => {
      navItems.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const v = btn.dataset.view;
      Object.values(views).forEach(sec => sec?.classList.remove("active"));
      views[v]?.classList.add("active");

      pageTitle.textContent = titleOf(v);

      if (agendaActions){
        agendaActions.style.display = (v === "agenda") ? "flex" : "none";
      }

      refreshAll();
    });
  });

  if (logoutBtn){
    logoutBtn.addEventListener("click", () => {
      writeLS(LS_AUTH, { ok:false, at: Date.now() });
      location.href = "login.html";
    });
  }

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-close]");
    if (el) hideModal(el.getAttribute("data-close"));
  });

  if (btnBlock) btnBlock.addEventListener("click", () => openBlockModal());

  const btnNewClient = document.getElementById("btnNewClient");
  const btnAddService = document.getElementById("btnAddService");
  const btnAddPay = document.getElementById("btnAddPay");
  const btnResetAll = document.getElementById("btnResetAll");

  if (btnNewClient) btnNewClient.addEventListener("click", () => openClientModal());
  if (btnAddService) btnAddService.addEventListener("click", () => openServiceModal());
  if (btnAddPay) btnAddPay.addEventListener("click", () => openPayModal());

  if (btnResetAll){
    btnResetAll.addEventListener("click", () => {
      if (!confirm("Tem certeza que deseja apagar todos os dados salvos?")) return;
      localStorage.removeItem(LS_APPTS);
      localStorage.removeItem(LS_BLOCKS);
      localStorage.removeItem(LS_CLIENTS);
      localStorage.removeItem(LS_SERV);
      localStorage.removeItem(LS_PAY);
      seedDefaults();
      refreshAll();
    });
  }
  wireModalActions();
  refreshAll();

  function titleOf(v){
    const map = {
      agenda: "Agenda",
      historico: "Histórico",
      caixa: "Caixa",
      clientes: "Clientes",
      servicos: "Serviços",
      pagamentos: "Forma de pagamento",
      config: "Configurações",
    };
    return map[v] || "Painel";
  }

  function getSelectedDate(){
    return filterDate?.value || todayISO();
  }

  function refreshAll(){
    refreshAgenda();
    renderHistory();
    renderCash();
    renderClients();
    renderServices();
    renderPayments();
  }
  function refreshAgenda(){
    const date = getSelectedDate();
    buildAgendaGrid(date);
    renderAppointmentsInGrid(date);
    renderBlocksInGrid(date);
  }

  function cellId(date, time, barber){
    return `cell-${date}-${time.replace(":","")}-${barber}`;
  }

  function buildAgendaGrid(date){
    agendaGrid.innerHTML = "";

    const f = filterBarber?.value || "Todos";
    const activeBarbers = BARBERS.filter(b => f === "Todos" || b.name === f);

    // Ajusta o layout do grid para o número de colunas visíveis (Hora + Barbeiros ativos)
    agendaGrid.style.gridTemplateColumns = `70px repeat(${activeBarbers.length}, 1fr)`;

    // Ajusta o cabeçalho (fotos) para ficar lado a lado e alinhado com a grade
    const headerCols = document.querySelector(".barber-cols");
    if (headerCols) {
      headerCols.style.display = "grid";
      headerCols.style.marginLeft = "70px"; // Pula o espaço da coluna de horas
      headerCols.style.width = "calc(100% - 70px)";
      headerCols.style.gridTemplateColumns = `repeat(${activeBarbers.length}, 1fr)`;
    }

    // Atualiza visibilidade dos cabeçalhos (fotos dos barbeiros)
    document.querySelectorAll(".barber-col").forEach(col => {
      const name = col.querySelector(".barber-name")?.textContent?.trim();
      if (f === "Todos" || name === f) col.style.display = "block";
      else col.style.display = "none";
    });

    TIMES.forEach(time => {
      const timeCell = document.createElement("div");   
      timeCell.className = "time-cell";
      timeCell.textContent = time;
      agendaGrid.appendChild(timeCell);

      activeBarbers.forEach(b => {
        const cell = document.createElement("div");
        cell.className = "slot-cell";
        cell.id = cellId(date, time, b.name);
        cell.dataset.time = time;
        cell.dataset.barber = b.name;
        agendaGrid.appendChild(cell);
      });
    });
  }

  function apptsByDate(date){
    return readLS(LS_APPTS, []).filter(a => a.date === date);
  }
  function blocksByDate(date){
    return readLS(LS_BLOCKS, []).filter(b => b.date === date);
  }
  function isOccupied(date,time,barber){
    return readLS(LS_APPTS, []).some(a => a.date===date && a.time===time && a.barber===barber);
  }
  function isBlocked(date,time,barber){
    return readLS(LS_BLOCKS, []).some(b => b.date===date && b.time===time && b.barber===barber);
  }

  function renderAppointmentsInGrid(date){
    BARBERS.forEach(b => TIMES.forEach(t => {
      const c = document.getElementById(cellId(date,t,b.name));
      if (c){ c.innerHTML=""; c.classList.remove("occupied"); }
    }));

    apptsByDate(date).forEach(appt => {
      const cell = document.getElementById(cellId(date, appt.time, appt.barber));
      if (!cell) return;

      const card = document.createElement("div");
      card.className = "appt-card";
      card.innerHTML = `
        <div class="appt-name">${escapeHtml(appt.clientName)}</div>
        <div class="appt-sub">${escapeHtml(appt.serviceName)}</div>
        <div class="appt-mini">${escapeHtml(appt.payment)} • ${moneyBR(appt.price)} • ${escapeHtml(appt.status)}</div>
      `;
      cell.appendChild(card);
      cell.classList.add("occupied");
    });
  }

  function renderBlocksInGrid(date){
    blocksByDate(date).forEach(bl => {
      const cell = document.getElementById(cellId(date, bl.time, bl.barber));
      if (!cell) return;
      cell.classList.add("blocked");
      cell.innerHTML = `
        <div class="appt-card" style="border-color:rgba(213,75,75,.35)">
          <div class="appt-name">Bloqueado</div>
          <div class="appt-sub">${escapeHtml(bl.desc || "")}</div>
        </div>
      `;
    });
  }

  function wireModalActions(){
    const btnSaveAppt = document.getElementById("btnSaveAppt");
    const btnSaveBlock = document.getElementById("btnSaveBlock");
    const btnSaveClient = document.getElementById("btnSaveClient");
    const btnSaveService = document.getElementById("btnSaveService");
    const btnSavePay = document.getElementById("btnSavePay");

    const btnOpenNewClient = document.getElementById("btnOpenNewClient");
    if (btnOpenNewClient){
      btnOpenNewClient.addEventListener("click", () => {
        hideModal("modalAppt");
        openClientModal(true); 
      });
    }

    if (btnSaveAppt){
      btnSaveAppt.addEventListener("click", () => {
        const msg = document.getElementById("apptMsg");
        msg.textContent = "";

        const date = document.getElementById("apptDate").value;
        const time = document.getElementById("apptTime").value;
        const barber = document.getElementById("apptBarber").value;

        const serviceId = document.getElementById("apptService").value;
        const payment = document.getElementById("apptPayment").value;
        const status = document.getElementById("apptStatus").value;

        const clientId = document.getElementById("apptClient").value;
        const clients = readLS(LS_CLIENTS, []);
        const client = clients.find(c => c.id === clientId);

        if (!client){
          msg.textContent = "Selecione um cliente cadastrado.";
          return;
        }

        if (isBlocked(date,time,barber)){
          msg.textContent = "Esse horário está bloqueado.";
          return;
        }
        if (isOccupied(date,time,barber)){
          msg.textContent = "Esse horário já está ocupado.";
          return;
        }

        const services = readLS(LS_SERV, []);
        const svc = services.find(s => s.id === serviceId);
        if (!svc){
          msg.textContent = "Selecione um serviço.";
          return;
        }

        const appts = readLS(LS_APPTS, []);
        appts.push({
          id: uid(),
          date, time, barber,
          clientId: client.id,
          clientName: client.name,
          serviceId: svc.id,
          serviceName: svc.name,
          price: svc.price,
          payment,
          status
        });
        writeLS(LS_APPTS, appts);

        console.log("APPTS SALVOS:", readLS(LS_APPTS, []));
        
        msg.style.color = "#28a745";
        msg.textContent = "Agendamento realizado com sucesso!";

        setTimeout(() => {
          hideModal("modalAppt");
          refreshAll();
          msg.textContent = "";
          msg.style.color = "";
        }, 1000);
      });
    }

    if (btnSaveBlock){
      btnSaveBlock.addEventListener("click", () => {
        const msg = document.getElementById("blockMsg");
        msg.textContent = "";

        const date = document.getElementById("blockDate").value;
        const barber = document.getElementById("blockBarber").value;
        const time = document.getElementById("blockTime").value;
        const desc = document.getElementById("blockDesc").value || "";

        if (!date || !barber || !time){
          msg.textContent = "Preencha data, barbeiro e horário.";
          return;
        }
        if (isOccupied(date,time,barber)){
          msg.textContent = "Não é possível bloquear: horário já está agendado.";
          return;
        }
        if (isBlocked(date,time,barber)){
          msg.textContent = "Esse horário já está bloqueado.";
          return;
        }

        const blocks = readLS(LS_BLOCKS, []);
        blocks.push({ id: uid(), date, barber, time, desc });
        writeLS(LS_BLOCKS, blocks);

        hideModal("modalBlock");
        refreshAll();
      });
    }

    if (btnSaveClient){
      btnSaveClient.addEventListener("click", () => {
        const msg = document.getElementById("clientMsg");
        msg.textContent = "";

        const name  = (document.getElementById("cName").value || "").trim();
        const phone = (document.getElementById("cPhone").value || "").trim();
        const email = (document.getElementById("cEmail").value || "").trim();
        const birth = (document.getElementById("cBirth").value || "").trim();

        if (!name || !phone){
          msg.textContent = "Nome e telefone são obrigatórios.";
          return;
        }

        const clients = readLS(LS_CLIENTS, []);
        const existsPhone = clients.some(c => (c.phone || "") === phone);
        if (existsPhone){
          msg.textContent = "Já existe um cliente com esse telefone.";
          return;
        }

        const newC = { id: uid(), name, phone, email, birth };
        clients.push(newC);
        writeLS(LS_CLIENTS, clients);

        msg.style.color = "#28a745"; // Verde para sucesso
        msg.textContent = "Cliente cadastrado com sucesso!";

        setTimeout(() => {
          hideModal("modalClient");
          refreshAll();
          msg.textContent = "";
          msg.style.color = "";

          const pending = window.__pendingAppt;
          if (pending){
            setTimeout(() => openApptModal(pending), 150);
            window.__pendingAppt = null;
          }
        }, 1000);
      });
    }

    if (btnSaveService){
      btnSaveService.addEventListener("click", () => {
        const msg = document.getElementById("serviceMsg");
        msg.textContent = "";

        const name = (document.getElementById("sName").value || "").trim();
        const price = Number(document.getElementById("sPrice").value || 0);
        const dur = Number(document.getElementById("sDur").value || 0);

        if (!name || price <= 0 || dur <= 0){
          msg.textContent = "Preencha nome, valor e duração.";
          return;
        }

        const list = readLS(LS_SERV, []);
        list.push({ id: uid(), name, price, dur });
        writeLS(LS_SERV, list);

        hideModal("modalService");
        refreshAll();
      });
    }

    if (btnSavePay){
      btnSavePay.addEventListener("click", () => {
        const msg = document.getElementById("payMsg");
        msg.textContent = "";

        const name = (document.getElementById("pName").value || "").trim();
        if (!name){
          msg.textContent = "Digite um nome.";
          return;
        }

        const list = readLS(LS_PAY, []);
        if (list.includes(name)){
          msg.textContent = "Essa forma de pagamento já existe.";
          return;
        }
        list.push(name);
        writeLS(LS_PAY, list);

        hideModal("modalPay");
        refreshAll();
      });
    }
  }

  function openApptModal({ date, time, barber }){
    const modal = document.getElementById("modalAppt");
    const msg = document.getElementById("apptMsg");
    msg.textContent = "";

    document.getElementById("apptDate").value = date;
    document.getElementById("apptTime").value = time;
    document.getElementById("apptBarber").value = barber;

    const serviceSel = document.getElementById("apptService");
    serviceSel.innerHTML = "";
    readLS(LS_SERV, []).forEach(s => {
      const o = document.createElement("option");
      o.value = s.id;
      o.textContent = `${s.name} • ${moneyBR(s.price)} • ${s.dur}min`;
      serviceSel.appendChild(o);
    });

    const paySel = document.getElementById("apptPayment");
    paySel.innerHTML = "";
    readLS(LS_PAY, []).forEach(p => {
      const o = document.createElement("option");
      o.value = p;
      o.textContent = p;
      paySel.appendChild(o);
    });

    const clientSel = document.getElementById("apptClientSelect");
    clientSel.innerHTML = "";
    const clients = readLS(LS_CLIENTS, []);
    clients.forEach(c => {
      const o = document.createElement("option");
      o.value = c.id;
      o.textContent = `${c.name} • ${c.phone}`;
      clientSel.appendChild(o);
    });

    showModal("modalAppt");
  }

function openApptModalManual(){
  showModal("modalAppt");
  hydrateApptFormOptions();
}

  function openBlockModal(){
    document.getElementById("blockDate").value = getSelectedDate();
    document.getElementById("blockDesc").value = "";
    const tsel = document.getElementById("blockTime");
    tsel.innerHTML = "";
    TIMES.forEach(t => {
      const o = document.createElement("option");
      o.value = t;
      o.textContent = t;
      tsel.appendChild(o);
    });
    document.getElementById("blockMsg").textContent = "";
    showModal("modalBlock");
  }

  function openClientModal(fromAppt=false){
    document.getElementById("cName").value="";
    document.getElementById("cPhone").value="";
    document.getElementById("cEmail").value="";
    document.getElementById("cBirth").value="";
    document.getElementById("clientMsg").textContent="";

    if (fromAppt){
      const pending = window.__pendingAppt || {};
      const date = document.getElementById("apptDate")?.value;
      const time = document.getElementById("apptTime")?.value;
      const barber = document.getElementById("apptBarber")?.value;
      if (date && time && barber){
        window.__pendingAppt = { date, time, barber };
      } else {
        window.__pendingAppt = pending;
      }
    }

    showModal("modalClient");
  }

  function renderClients(){
    const tbody = document.querySelector("#clientsTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    readLS(LS_CLIENTS, []).forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.phone || "")}</td>
        <td>${escapeHtml(c.email || "")}</td>
        <td>${escapeHtml(c.birth || "")}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function openServiceModal(){
    document.getElementById("sName").value="";
    document.getElementById("sPrice").value="";
    document.getElementById("sDur").value="";
    document.getElementById("serviceMsg").textContent="";
    showModal("modalService");
  }

  function renderServices(){
    const tbody = document.querySelector("#servicesTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const list = readLS(LS_SERV, []);
    list.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(s.name)}</td>
        <td>${moneyBR(s.price)}</td>
        <td>${escapeHtml(String(s.dur))} min</td>
        <td><button class="btn btn-dark" data-del-service="${s.id}">Remover</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-del-service]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del-service");
        if (!confirm("Remover esse serviço?")) return;
        const next = readLS(LS_SERV, []).filter(x => x.id !== id);
        writeLS(LS_SERV, next);
        refreshAll();
      });
    });
  }

  function openPayModal(){
    document.getElementById("pName").value="";
    document.getElementById("payMsg").textContent="";
    showModal("modalPay");
  }

  function renderPayments(){
    const wrap = document.getElementById("payChips");
    if (!wrap) return;
    wrap.innerHTML = "";

    const list = readLS(LS_PAY, []);
    list.forEach(p => {
      const div = document.createElement("div");
      div.className = "chip";
      div.innerHTML = `<span>${escapeHtml(p)}</span><button title="Remover">×</button>`;
      div.querySelector("button").addEventListener("click", () => {
        if (!confirm("Remover forma de pagamento?")) return;
        const next = readLS(LS_PAY, []).filter(x => x !== p);
        writeLS(LS_PAY, next);
        refreshAll();
      });
      wrap.appendChild(div);
    });
  }

  function renderHistory(){
    const tbody = document.querySelector("#historyTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const all = readLS(LS_APPTS, []).slice()
      .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));

    all.forEach(a => {
      const tr = document.createElement("tr");
      const badge = a.status === "Finalizado"
        ? `<span class="badge ok">Finalizado</span>`
        : `<span class="badge pend">Pendente</span>`;

      tr.innerHTML = `
        <td>${escapeHtml(a.date)}</td>
        <td>${escapeHtml(a.time)}</td>
        <td>${escapeHtml(a.clientName)}</td>
        <td>${escapeHtml(a.barber)}</td>
        <td>${escapeHtml(a.serviceName)}</td>
        <td>${escapeHtml(a.payment)}</td>
        <td>${moneyBR(a.price)}</td>
        <td>${badge}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderCash(){
    const date = getSelectedDate();
    const tbody = document.querySelector("#cashTable tbody");
    const kTotal = document.getElementById("kpiTotalDia");
    const kCortes = document.getElementById("kpiCortesDia");
    const kClientes = document.getElementById("kpiClientesDia");

    if (!tbody) return;
    tbody.innerHTML = "";

    const day = readLS(LS_APPTS, []).filter(a => a.date === date);

    let total = 0;
    const clientesSet = new Set();
    day.forEach(a => {
      total += Number(a.price || 0);
      clientesSet.add(a.clientId || a.clientName);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(a.time)}</td>
        <td>${escapeHtml(a.clientName)}</td>
        <td>${escapeHtml(a.barber)}</td>
        <td>${escapeHtml(a.serviceName)}</td>
        <td>${escapeHtml(a.payment)}</td>
        <td>${moneyBR(a.price)}</td>
      `;
      tbody.appendChild(tr);
    });

    if (kTotal) kTotal.textContent = moneyBR(total);
    if (kCortes) kCortes.textContent = String(day.length);
    if (kClientes) kClientes.textContent = String(clientesSet.size);
  }
  function seedDefaults(){

    if (!Array.isArray(readLS(LS_CLIENTS, null))){
      writeLS(LS_CLIENTS, []);
    }

    const services = readLS(LS_SERV, null);
    if (!Array.isArray(services) || services.length === 0){
      writeLS(LS_SERV, [
        { id: uid(), name:"Corte de Cabelo", price:35, dur:40 },
        { id: uid(), name:"Cabelo e Sobrancelha", price:50, dur:40 },
        { id: uid(), name:"Cabelo e Barba", price:65, dur:45 },
        { id: uid(), name:"Cabelo, Barba e Sobrancelha", price:75, dur:45 },
        { id: uid(), name:"Barba", price:30, dur:25 },
        { id: uid(), name:"Barboterapia", price:50, dur:45 }
      ]);
    }

    const pays = readLS(LS_PAY, null);
    if (!Array.isArray(pays) || pays.length === 0){
      writeLS(LS_PAY, ["Pix","Cartão","Dinheiro"]);
    }

    if (!Array.isArray(readLS(LS_APPTS, null)))  writeLS(LS_APPTS, []);
    if (!Array.isArray(readLS(LS_BLOCKS, null))) writeLS(LS_BLOCKS, []);

    if (!Array.isArray(readLS("barbers", null))) {
    writeLS("barbers", [
    { id: "lucas", name: "Lucas" },
    { id: "noel",  name: "Noel"  }
    ]);
    }

  }
}

  function showModal(id){
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add("show");
    m.setAttribute("aria-hidden","false");
  }
  
  function hideModal(id){
  const el = document.getElementById(id);

  if (el && el.contains(document.activeElement)) {
    document.activeElement.blur();
  }

  el.classList.remove("open"); // ou seu jeito de esconder
  el.classList.remove("show"); // ou seu jeito de esconder
  el.setAttribute("aria-hidden", "true");
}

  function hydrateApptForm() {
  // ⚠️ IDs (confira se são esses mesmos no seu HTML)
  const selClient = document.getElementById("apptClient");
  const selBarber = document.getElementById("apptBarber");
  const selTime   = document.getElementById("apptTime");

  // Se algum select não existir, não quebra o sistema
  // (mas não vai preencher também)
  // console.log({ selClient, selBarber, selTime });

  // =========================
  // CLIENTES
  // =========================
  if (selClient) {
    // tenta chaves mais comuns
    const clients =
      (typeof LS_CLIENTS !== "undefined" ? readLS(LS_CLIENTS, null) : null) ??
      readLS("clients", null) ??
      readLS("clientes", null) ??
      [];

    selClient.innerHTML = `<option value="">Sem cadastro</option>`;

    (Array.isArray(clients) ? clients : []).forEach((c, idx) => {
      const opt = document.createElement("option");
      const id = c.id ?? c.phone ?? c.telefone ?? c.email ?? c.nome ?? c.name ?? String(idx);
      const name = c.name ?? c.nome ?? "Cliente";
      const phone = c.phone ?? c.telefone ?? "";
      opt.value = id;
      opt.textContent = phone ? `${name} • ${phone}` : name;
      selClient.appendChild(opt);
    });
  }

  // =========================
  // BARBEIROS
  // =========================
  if (selBarber) {
    let barbers = [];

    // 1) tenta array global (muito comum quando a grade usa um const BARBERS)
    if (Array.isArray(window.BARBERS)) barbers = window.BARBERS;

    // 2) tenta chave LS_BARBERS se existir
    if (!barbers.length && typeof LS_BARBERS !== "undefined") {
      const b = readLS(LS_BARBERS, []);
      if (Array.isArray(b)) barbers = b;
    }

    // 3) fallback: localStorage "barbers"
    if (!barbers.length) {
      const b = readLS("barbers", []);
      if (Array.isArray(b)) barbers = b;
    }

    selBarber.innerHTML = `<option value="">Selecione</option>`;

    barbers.forEach((b, idx) => {
      const opt = document.createElement("option");
      const name = b.name ?? b.nome ?? b.title ?? b.label ?? `Barbeiro ${idx + 1}`;
      const id = b.id ?? name;
      opt.value = id;
      opt.textContent = name;
      selBarber.appendChild(opt);
    });
  }

  // =========================
  // HORÁRIOS
  // =========================
  if (selTime) {
    const times =
      (Array.isArray(window.TIMES) ? window.TIMES : null) ??
      (typeof generateTimes === "function" ? generateTimes() : null) ??
      ["09:00","10:00","11:00","12:00","14:00","15:00","16:00","17:00","18:00","19:00"];

    selTime.innerHTML = `<option value="">Selecione</option>`;

    (Array.isArray(times) ? times : []).forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      selTime.appendChild(opt);
    });
  }
}

  function hydrateApptFormOptions(){
  const selBarber  = document.getElementById("apptBarber");
  const selTime    = document.getElementById("apptTime");
  const selService = document.getElementById("apptService");
  const selPay     = document.getElementById("apptPayment");
  const selClient  = document.getElementById("apptClient");

  const barbers  = readLS(LS_BARBERS, []) || [];
  const services = readLS(LS_SERV, []) || [];
  const clients  = readLS(LS_CLIENTS, []) || [];

  const times = [
    "09:00","09:30","10:00","10:30","11:00","11:30",
    "14:00","14:30","15:00","15:30","16:00","16:30",
    "17:00","17:30","18:00","18:30","19:00"
  ];

  function fillSelect(selectEl, items, placeholder="Selecione...", useName=false){
    if (!selectEl) return;
    selectEl.innerHTML = "";

    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = placeholder;
    selectEl.appendChild(opt0);

    items.forEach(it => {
      const opt = document.createElement("option");
      opt.value = useName ? (it.name || it) : (it.id || it.name || it);
      opt.textContent = it.name || it;
      selectEl.appendChild(opt);
    });
  }

  fillSelect(selBarber, barbers, "Selecione o barbeiro", true);
  fillSelect(selService, services, "Selecione o serviço");
  fillSelect(selClient, clients, "Selecione o cliente");
  fillSelect(selTime, times, "Selecione o horário");

  fillSelect(selPay, ["Pix","Cartão","Dinheiro"], "Selecione o pagamento");
}


function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

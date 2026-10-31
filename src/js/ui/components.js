/* ===== COMPONENTES DE UI ===== */

import { $, $$, esc, toast, ask, DN, DNL, TN, TI, TK, PAL, thT, intT, Pn, IV, ppd, isEJA, isFund, normDate, cstyle, tx, gaps, gd } from "../utils/helpers.js";

let S = null;
let draft = null;
let view = { m: "t", k: "", dy: "a" };

export function setState(state) { S = state; }
export function getState() { return S; }
export function setDraft(d) { draft = d; }
export function getDraft() { return draft; }
export function setView(v) { view = v; }
export function getView() { return view; }

/* ===== RENDER PRINCIPAL ===== */
export function render() {
  const m = $("#m");
  if (!m) return;
  const active = document.querySelector(".tabs button.on")?.dataset.tab || "ano";
  m.innerHTML = TABS[active]();
  renderTabs(active);
  scrollTo(0, 0);
}

const TABS = {
  ano: vAno,
  disc: vDisc,
  cfg: vCfg,
  prof: vProf,
  gen: vGen,
  bak: vBak
};

function renderTabs(active) {
  const tb = $("#tb");
  if (!tb) return;
  const tabsHtml = Object.entries(TABS).map(([k, v]) => {
    const meta = TAB_META[k];
    return `<button role="tab" aria-selected="${k === active}" data-tab="${k}" onclick="go('${k}')"><span>${meta.icon}</span>${meta.label}</button>`;
  }).join("");
  tb.innerHTML = tabsHtml;
}

const TAB_META = {
  ano: { icon: "🗓️", label: "Ano Letivo" },
  disc: { icon: "🍎", label: "Disciplinas" },
  cfg: { icon: "🏫", label: "Turmas" },
  prof: { icon: "📝", label: "Professores" },
  gen: { icon: "✨", label: "Horário" },
  bak: { icon: "💾", label: "Backup" }
};

window.go = (tab) => {
  const btns = $$(".tabs button");
  btns.forEach(b => { b.classList.toggle("on", b.dataset.tab === tab); b.setAttribute("aria-selected", b.dataset.tab === tab); });
  render();
};

/* ===== ABA ANO LETIVO ===== */
function vAno() {
  const e = S.es?.find(x => x.id === S.cur) || S.es?.[0];
  return `
    <div class="card"><h2>🗓️ Ano Letivo / Calendário</h2>
    <div class="row"><div><label>Nome da escola</label><input value="${esc(e?.nome)}" oninput="updateSchoolName(this.value)"></div></div>
    <div class="row"><div><label>Ano</label><input type="number" value="${e?.ano || new Date().getFullYear()}" oninput="updateSchoolYear(+this.value)"></div></div>
    <p class="hint">O calendário define feriados, recessos e dias letivos. Importa via Excel ou Google Planilhas.</p></div>
    ${vAnoCal()}
    ${S.cal ? `<div class="card"><h2>Calendário vinculado</h2><p class="hint">${esc(S.cal.nome)} · ${esc(S.cal.escola)}</p><button class="btn d" onclick="anoDel()">Remover calendário</button></div>` : ""}
  `;
}

window.updateSchoolName = (v) => { const e = S.es.find(x => x.id === S.cur); if (e) { e.nome = v; save(); } };
window.updateSchoolYear = (v) => { const e = S.es.find(x => x.id === S.cur); if (e) { e.ano = v; save(); } };

/* ===== ABA TURMAS ===== */
function vCfg() {
  if (!S.turmas.length) return `<div class="card"><h2>🏫 Turmas</h2><p class="hint">Cadastre as turmas da escola.</p></div>`;
  let h = `<div class="card"><h2>🏫 Turmas cadastradas</h2>`;
  h += `<div class="chips">${S.turmas.map((t, i) => `<span class="chip tg on">${esc(t)} ${TI[S.tur[t]]}<i onclick="delTurma(${i})"></i></span>`).join("")}</div>`;
  h += `<button class="btn g" onclick="addTurma()">+ Nova turma</button></div>`;
  return h;
}

window.addTurma = () => { const nome = prompt("Nome da turma (ex.: 1º A)"); if (!nome) return; const turno = prompt("Turno (M/T/N)") || "M"; S.turmas.push(nome); S.tur[nome] = turno; save(); render(); };
window.delTurma = (i) => { const t = S.turmas[i]; S.turmas.splice(i, 1); delete S.tur[t]; save(); render(); };

/* ===== ABA DISCIPLINAS ===== */
async function vDisc() {
  const { loadDisciplinasPadrao } = await import("../utils/helpers.js");
  await loadDisciplinasPadrao();

  let h = `<div class="card"><h2>🍎 Disciplinas da escola</h2>
    <p class="hint">Disciplinas cadastradas: ${S.discs.length}</p>
    <div class="chips">${S.discs.map((d, i) => `<span class="chip tg ${d.turmas.length ? "on" : ""}">${esc(d.nome)}<i onclick="delDisc(${i})"></i></span>`).join("")}</div>
    <button class="btn g" onclick="addCustomDisc()">+ Nova disciplina</button></div>`;

  h += `<div class="card"><h2>📥 Importar do Google Planilhas (padrão)</h2>
    <p class="hint">Modalidades pré-definidas com carga horária por ano/série.</p>`;

  const mods = [
    { key: "fundamental_manha_tarde", label: "Fundamental Manhã/Tarde", icon: "☀️" },
    { key: "medio_manha_tarde", label: "Médio Manhã/Tarde", icon: "🌤️" },
    { key: "medio_noite", label: "Médio Noite", icon: "🌙" },
    { key: "eja_noite", label: "EJA Noite", icon: "🌙" }
  ];

  const padrao = window.DISCIPLINAS_PADRAO || {};
  mods.forEach(m => {
    const discMap = padrao[m.key] || {};
    const count = Object.keys(discMap).length;
    h += `<div class="dm"><div class="row"><div style="flex:1"><b>${m.icon} ${m.label}</b> <small>(${count} disciplinas)</small></div>
      <button class="btn g" style="width:auto" onclick="addAllFromModality('${m.key}')">USAR TUDO</button></div>
      <div class="chips" style="margin-top:8px">${Object.entries(discMap).map(([nome, anos]) => `<span class="chip">${esc(nome)} <small>${Object.entries(anos).map(([a,q])=>a+"º:"+q).join(", ")}</small></span>`).join("")}</div></div>`;
  });
  h += `</div>`;

  // Importar Excel
  h += `<div class="card"><h2>📊 Importar Excel/CSV</h2>
    <input type="file" id="excelfile" accept=".xlsx,.xls,.csv" onchange="importExcel(this.files[0])" style="margin-bottom:8px">
    <button class="btn g" onclick="clearExcel()">Limpar importação</button></div>`;

  return h;
}

window.addCustomDisc = () => { S.discs.push({ nome: "Nova disciplina", cor: PAL[S.discs.length % PAL.length], turmas: [], fromExcel: false, asData: {} }); save(); render(); };
window.delDisc = (i) => { S.discs.splice(i, 1); save(); render(); };
window.addDiscFromPadrao = (nome, mod) => { const map = window.DISCIPLINAS_PADRAO?.[mod] || {}; const anos = map[nome]; if (!anos) return; const ex = S.discs.findIndex(d => d.nome.toLowerCase() === nome.toLowerCase()); if (ex >= 0) { S.discs[ex].asData = S.discs[ex].asData || {}; S.discs[ex].asData[mod] = anos; } else { S.discs.push({ nome, cor: PAL[S.discs.length % PAL.length], turmas: [], fromExcel: true, asData: { [mod]: anos } }); } save(); render(); };
window.addAllFromModality = (mod) => { const map = window.DISCIPLINAS_PADRAO?.[mod] || {}; let c = 0; Object.entries(map).forEach(([nome, anos]) => { const ex = S.discs.findIndex(d => d.nome.toLowerCase() === nome.toLowerCase()); if (ex >= 0) { S.discs[ex].asData = S.discs[ex].asData || {}; if (!S.discs[ex].asData[mod]) { S.discs[ex].asData[mod] = anos; c++; } } else { S.discs.push({ nome, cor: PAL[S.discs.length % PAL.length], turmas: [], fromExcel: true, asData: { [mod]: anos } }); c++; } }); save(); render(); toast(c + " disciplinas adicionadas de " + mod.replace(/_/g, " ")); };

let excelData = null;
window.importExcel = async (file) => {
  if (!file) return;
  try {
    const { XLSX } = await import("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    excelData = XLSX.utils.sheet_to_json(ws, { defval: "" });
    toast("Arquivo lido: " + excelData.length + " linhas. Use 'USAR TUDO' abaixo.");
    render();
  } catch (e) { toast("Erro lendo Excel: " + e.message); }
};
window.clearExcel = () => { excelData = null; render(); };

/* ===== ABA BACKUP ===== */
function vBak() {
  return `
    <div class="card"><h2>💾 Backup / Sincronismo</h2>
    <p class="hint">Dados salvos automaticamente no Firebase e no navegador.</p>
    <div class="row"><div><button class="btn g" onclick="exportJSON()">Baixar JSON</button></div><div><input type="file" id="imp" accept=".json" onchange="importJSON(this.files[0])" style="display:none"><button class="btn g" onclick="$('imp').click()">Importar JSON</button></div></div>
    <div class="row" style="margin-top:8px"><div><button class="btn" onclick="forceSync()">Sincronizar agora</button></div></div>
    <details style="margin-top:12px"><summary>Debug storage</summary><pre id="dbg" style="font-size:.7rem;background:var(--bg);padding:8px;border-radius:8px;overflow:auto"></pre></details>
  `;
}

window.exportJSON = () => {
  const data = JSON.stringify({ cur: S.cur, es: S.es }, null, 2);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
  a.download = `eva-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
};

window.importJSON = (file) => {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.es) { S.es = data.es; S.cur = data.cur || S.cur; S = S.es.find(e => e.id === S.cur)?.d || S; normSchool(S); save(); render(); toast("Importado com sucesso"); }
      else toast("Formato inválido");
    } catch (e) { toast("Erro: " + e.message); }
  };
  reader.readAsText(file);
};

window.forceSync = async () => {
  const { FB } = await import("../firebase/auth.js");
  if (FB) { await save(); toast("Sincronizado"); }
};

/* ===== TOGGLE TEMA ===== */
export function initThemeToggle() {
  const btn = document.createElement("button");
  btn.className = "theme-toggle";
  btn.setAttribute("aria-label", "Alternar tema");
  btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
  btn.onclick = () => { document.documentElement.dataset.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; localStorage.setItem("theme", document.documentElement.dataset.theme); };
  document.body.appendChild(btn);
  const saved = localStorage.getItem("theme");
  if (saved) document.documentElement.dataset.theme = saved;
}

/* ===== EXPORTS GLOBAIS PARA ONCLICK ===== */
window.toast = toast;
window.ask = ask;
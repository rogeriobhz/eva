/* ===== CALENDÁRIO / ANO LETIVO ===== */

import { $, $$, esc, toast, ask, DN, DNL, normDate } from "../utils/helpers.js";
import { setState, getState, setDraft, getDraft, setView, getView } from "./components.js";

let S = null;

export function vAnoCal() {
  S = getState();
  if (!S) return "";

  const e = S.es?.find(x => x.id === S.cur) || S.es?.[0];
  if (!e) return "";

  if (!e.cal) e.cal = { nome: e.nome + " " + e.ano, escola: e.nome, dias: [], feriados: [], recessos: [] };

  const cal = e.cal;
  const ano = e.ano || new Date().getFullYear();
  const hoje = new Date().toISOString().split("T")[0];

  let h = `<div class="card"><h2>📅 Calendário ${esc(e.ano)}</h2>`;

  // Resumo
  const letivos = cal.dias?.filter(d => !d.f && !d.r).length || 0;
  const feriados = cal.feriados?.length || 0;
  const recessos = cal.recessos?.length || 0;
  h += `<div class="row" style="margin-bottom:12px">
    <div class="chip" style="background:#e8f5e9"><b>${letivos}</b> dias letivos</div>
    <div class="chip" style="background:#ffebee"><b>${feriados}</b> feriados</div>
    <div class="chip" style="background:#fff3e0"><b>${recessos}</b> recessos</div>
  </div>`;

  // Importar Excel
  h += `<div style="margin-bottom:12px">
    <label>Importar Excel/CSV do calendário</label>
    <input type="file" id="calfile" accept=".xlsx,.xls,.csv" onchange="importCal(this.files[0])" style="margin:8px 0">
    <button class="btn g" onclick="clearCal()">Limpar importação</button>
  </div>`;

  // Lista de dias
  if (cal.dias?.length) {
    h += `<h3>Dias do ano letivo</h3>
      <div style="max-height:400px;overflow:auto;border:1px solid var(--ln);border-radius:8px">`;

    cal.dias.forEach((d, i) => {
      const badge = d.f ? '<span class="chip" style="background:#ffebee;color:#c62828">Feriado</span>' :
                   d.r ? '<span class="chip" style="background:#fff3e0;color:#ef6c00">Recesso</span>' :
                   '<span class="chip" style="background:#e8f5e9;color:#2e7d32">Letivo</span>';
      h += `<div style="display:flex;align-items:center;padding:8px 12px;border-bottom:1px solid var(--ln);gap:12px">
        <span style="min-width:100px;font-weight:600">${esc(DNL[new Date(d.data).getDay()])}</span>
        <span style="min-width:100px">${normDate(d.data)}</span>
        <span style="flex:1">${esc(d.desc || "")}</span>
        ${badge}
        <button class="btn d s" onclick="delCalDia(${i})" title="Remover">×</button>
      </div>`;
    });
    h += `</div>`;
  } else {
    h += `<p class="hint">Nenhum dia cadastrado. Importe via Excel ou adicione manualmente.</p>`;
  }

  // Formulário adicionar dia
  h += `<div style="margin-top:16px;padding:16px;background:var(--sf);border-radius:12px;border:1px solid var(--ln)">
    <h4>Adicionar dia</h4>
    <div class="row"><div><label>Data</label><input type="date" id="cal-data" value="${hoje}"></div>
    <div><label>Descrição</label><input id="cal-desc" placeholder="Ex.: Feriado de Tiradentes"></div></div>
    <div class="row"><div><label class="ck"><input type="checkbox" id="cal-feriado"> Feriado</label></div>
    <div><label class="ck"><input type="checkbox" id="cal-recesso"> Recesso</label></div></div>
    <button class="btn g" onclick="addCalDia()">Adicionar ao calendário</button>
  </div></div>`;

  return h;
}

window.importCal = async (file) => {
  if (!file) return;
  try {
    const { XLSX } = await import("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

    const S = getState();
    const e = S.es?.find(x => x.id === S.cur) || S.es?.[0];
    if (!e) return toast("Selecione uma escola primeiro");
    if (!e.cal) e.cal = { nome: e.nome, escola: e.nome, dias: [], feriados: [], recessos: [] };

    let count = 0;
    data.forEach(row => {
      const dataStr = normDate(row.Data || row.data || row.DATA);
      const desc = String(row.Descrição || row.descricao || row.Descricao || row.DESC || "");
      const feriado = /sim|true|1|x|f|feriado/i.test(String(row.Feriado || row.feriado || ""));
      const recesso = /sim|true|1|x|r|recesso/i.test(String(row.Recesso || row.recesso || ""));

      if (dataStr) {
        const exists = e.cal.dias.findIndex(d => d.data === dataStr);
        if (exists >= 0) {
          e.cal.dias[exists] = { data: dataStr, desc, f: feriado, r: recesso };
        } else {
          e.cal.dias.push({ data: dataStr, desc, f: feriado, r: recesso });
        }
        count++;
      }
    });

    e.cal.dias.sort((a, b) => a.data.localeCompare(b.data));
    await save();
    render();
    toast(`${count} dias importados do calendário`);
  } catch (e) {
    toast("Erro ao importar calendário: " + e.message);
  }
};

window.clearCal = () => {
  const S = getState();
  const e = S.es?.find(x => x.id === S.cur) || S.es?.[0];
  if (e && e.cal) { e.cal.dias = []; e.cal.feriados = []; e.cal.recessos = []; }
  render();
};

window.addCalDia = async () => {
  const data = document.getElementById("cal-data").value;
  const desc = document.getElementById("cal-desc").value;
  const feriado = document.getElementById("cal-feriado").checked;
  const recesso = document.getElementById("cal-recesso").checked;

  if (!data) return toast("Informe a data");

  const S = getState();
  const e = S.es?.find(x => x.id === S.cur) || S.es?.[0];
  if (!e) return;
  if (!e.cal) e.cal = { nome: e.nome, escola: e.nome, dias: [], feriados: [], recessos: [] };

  const exists = e.cal.dias.findIndex(d => d.data === data);
  if (exists >= 0) {
    e.cal.dias[exists] = { data, desc, f: feriado, r: recesso };
  } else {
    e.cal.dias.push({ data, desc, f: feriado, r: recesso });
  }
  e.cal.dias.sort((a, b) => a.data.localeCompare(b.data));
  document.getElementById("cal-desc").value = "";
  document.getElementById("cal-feriado").checked = false;
  document.getElementById("cal-recesso").checked = false;
  await save();
  render();
};

window.delCalDia = async (i) => {
  const S = getState();
  const e = S.es?.find(x => x.id === S.cur) || S.es?.[0];
  if (e && e.cal && e.cal.dias) {
    e.cal.dias.splice(i, 1);
    await save();
    render();
  }
};

window.save = async () => {
  const { save: saveApp } = await import("/src/js/app.js");
  await saveApp();
};
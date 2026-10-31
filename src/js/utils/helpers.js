/* ===== UTILITÁRIOS ===== */

export const $ = (id) => document.getElementById(id);
export const $$ = (sel, root = document) => root.querySelectorAll(sel);
export const $1 = (sel, root = document) => root.querySelector(sel);

export const esc = (s) => String(s || "").replace(/[&<>"']/g, c => ({
  "&": "&",
  "<": "<",
  ">": ">",
  '"': "\"",
  "'": "'"
})[c]);

export function toast(text, duration = 3000) {
  const tpl = document.getElementById("toast-template");
  const toast = tpl.content.querySelector(".toast").cloneNode(true);
  toast.textContent = text;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 300); }, duration);
}

export function ask(question, onYes, labelYes = "Confirmar", labelNo = "Cancelar") {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:1000";
    overlay.innerHTML = `
      <div class="card" style="max-width:320px;padding:24px;text-align:center">
        <p style="margin:0 0 16px;font-weight:600">${esc(question)}</p>
        <div style="display:flex;gap:8px;justify-content:center">
          <button class="btn d" id="btn-no">${esc(labelNo)}</button>
          <button class="btn" id="btn-yes">${esc(labelYes)}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector("#btn-yes").onclick = () => { overlay.remove(); resolve(onYes()); };
    overlay.querySelector("#btn-no").onclick = () => { overlay.remove(); resolve(false); };
    overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
  });
}

export const DN = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const DNL = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const TN = { M: "Manhã", T: "Tarde", N: "Noite" };
export const TI = { M: "☀️", T: "ἲ4️", N: "ἱ9️" };
export const TK = ["M", "T", "N"];

export const PAL = [
  "#f4a6a6", "#f7c873", "#a8d98a", "#7fd1c4",
  "#8fb8f5", "#c3a6f2", "#f5a6d4", "#d9c27a",
  "#9ad0e8", "#e8a07a", "#b5d98a", "#c9b3a0"
];

export function tx(c) { const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16); return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? "#10201a" : "#fff"; }

export function normDate(v) {
  if (v instanceof Date && !isNaN(v)) return v.toISOString().split("T")[0];
  v = String(v || "").trim();
  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[0];
  m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0") : "";
}

export function gaps(arr) { return arr.length ? Math.max(...arr) - Math.min(...arr) + 1 - arr.length : 0; }
export function gd(a, s) { return gaps(a.concat(s)) - gaps(a); }

export function thT(tn, p) {
  const ini = { M: "07:00", T: "13:00", N: "18:50" }[tn] || "07:00";
  const du = 50;
  const h = parseInt(ini.split(":")[0]), m = parseInt(ini.split(":")[1]);
  const start = h * 60 + m + p * du;
  const end = start + du;
  const fmt = (x) => String(Math.floor(x / 60)).padStart(2, "0") + ":" + String(x % 60).padStart(2, "0");
  return `<th>${fmt(start)}<br><small>${fmt(end)}</small></th>`;
}

export function intT(tn, cols) {
  return `<tr><td class="int" colspan="${cols}">Intervalo</td></tr>`;
}

export function Pn(tn) { return (tn === "N" ? 4 : 5); }
export function IV(tn) { return (tn === "N" ? 2 : 3); }
export function ppd(t) { return IV(t); }

export function isFund(n) { return /^\s*[6-9](\d{2}(?!\d)|(?!\d))/.test(n); }
export function isEJA(n) { return /(^|[^a-zà-ú])eja([^a-zà-ú]|$)/i.test(String(n)); }

export function nivel(t) { return (window.S?.niv?.[t]) || (isEJA(t) ? "O" : isFund(t) ? "F" : "O"); }

export function dcol(nome) { if (!window.S?.dcor[nome]) window.S.dcor[nome] = PAL[Object.keys(window.S.dcor).length % PAL.length]; }

export function cstyle(c) {
  const bg = c.pn ? (window.S?.dcor?.[c.pn] || "#eee") : (window.S?.dcor?.[c.disc] || "#eee");
  const color = tx(bg);
  return `background:${bg};color:${color}`;
}

export function pcol(nome) { const p = window.S?.profs?.find(x => x.nome === nome); return p?.cor || "#888"; }

/* ===== STORAGE (IndexedDB via idb) ===== */
let idbPromise = null;
export async function getIDB() {
  if (idbPromise) return idbPromise;
  const { openDB } = await import("https://cdn.jsdelivr.net/npm/idb@8.0.0/build/index.js");
  idbPromise = openDB("eva-store", 1, {
    upgrade(db) { db.createObjectStore("data"); }
  });
  return idbPromise;
}

export async function storageGet(key) {
  const db = await getIDB();
  return db.get("data", key);
}

export async function storageSet(key, value) {
  const db = await getIDB();
  return db.put("data", value, key);
}

export async function storageDel(key) {
  const db = await getIDB();
  return db.delete("data", key);
}

/* ===== SERIALIZAÇÃO ESCOLA ===== */
export function blankSchool() {
  const d = { cfg: { d: 5, p: 5, i: 2 }, turmas: [], tur: {}, profs: [], hor: null, fail: 0, discs: [] };
  return d;
}

export function ordP(o) {
  if (!o.profs) return;
  const k = p => [p.ef ? 0 : 1, p.dv || "9999-99-99"];
  o.profs = o.profs.map((p, i) => [p, i])
    .sort((a, b) => {
      const x = k(a[0]), y = k(b[0]);
      return x[0] - y[0] || (x[1] < y[1] ? -1 : x[1] > y[1] ? 1 : 0) || a[1] - b[1];
    })
    .map(a => a[0]);
}

export function normSchool(o) {
  ordP(o);
  o.cfg = o.cfg || {};
  o.cfg.pf = o.cfg.pf || 5;
  o.cfg.pn = o.cfg.pn || 4;
  if (!o.cfg.i2) { o.cfg.i2 = 1; o.cfg.i = 2; }
  if (!o.cfg.iv3) {
    o.cfg.iv3 = 1;
    o.cfg.iv = { M: 3, T: 3, N: 2 };
    o.cfg.ini = { M: "07:00", T: "13:00", N: "18:50" };
    o.cfg.du = 50; o.cfg.ivd = 20;
  }
  o.cfg.iv = o.cfg.iv || { M: 3, T: 3, N: 2 };
  o.cfg.ini = Object.assign({ M: "07:00", T: "13:00", N: "18:50" }, o.cfg.ini || {});
  o.cfg.du = o.cfg.du || 50;
  o.cfg.ivd = o.cfg.ivd || 20;
  o.niv = o.niv || {};
  o.dcor = o.dcor || {};
  o.cm = o.cm || "p";
  o.tur = o.tur || {};
  o.turmas.forEach(t => { if (!o.tur[t]) o.tur[t] = "M"; if (isEJA(t)) o.tur[t] = "N"; });
  o.profs.forEach((p, i) => {
    if (!p.cor) p.cor = PAL[i % PAL.length];
    p.agr = !!p.agr; p.ef = !!p.ef; p.dv = p.dv || ""; p.dias = p.dias || [];
    for (const k of Object.keys(p.off || {})) if (/^\d/.test(k)) { TK.forEach(t => p.off[t + k] = p.off[k]); delete p.off[k]; }
    p.dem.forEach(x => { if (!x.turmas) x.turmas = x.turma ? [x.turma] : []; delete x.turma; });
  });
  window.S = o;
}

/* ===== CARREGAR DISCIPLINAS PADRÃO ===== */
export let DISCIPLINAS_PADRAO_CACHE = null;
export async function loadDisciplinasPadrao() {
  if (DISCIPLINAS_PADRAO_CACHE) return DISCIPLINAS_PADRAO_CACHE;
  try {
    const res = await fetch("/disciplinas-padrao.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    DISCIPLINAS_PADRAO_CACHE = await res.json();
  } catch (e) {
    console.warn("Falha ao carregar disciplinas-padrao.json, usando fallback", e);
    DISCIPLINAS_PADRAO_CACHE = { fundamental_manha_tarde: {}, medio_manha_tarde: {}, medio_noite: {}, eja_noite: {} };
  }
  return DISCIPLINAS_PADRAO_CACHE;
}

// Export for backward compatibility
export const DISCIPLINAS_PADRAO = DISCIPLINAS_PADRAO_CACHE;

export function applyDisciplinasPadrao(school) {
  const map = DISCIPLINAS_PADRAO_CACHE;
  if (!map) return;
  Object.entries(map).forEach(([mod, discMap]) => {
    Object.entries(discMap).forEach(([nome, anos]) => {
      const exists = school.discs.findIndex(d => d.nome.toLowerCase() === nome.toLowerCase());
      if (exists >= 0) {
        school.discs[exists].asData = school.discs[exists].asData || {};
        if (!school.discs[exists].asData[mod]) school.discs[exists].asData[mod] = anos;
      } else {
        school.discs.push({ nome, cor: PAL[school.discs.length % PAL.length], turmas: [], fromExcel: true, asData: { [mod]: anos } });
      }
    });
  });
}
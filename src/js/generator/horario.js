/* ===== GERADOR DE HORÁRIOS ===== */

import { $, $$, esc, toast, DN, DNL, TN, TI, TK, PAL, thT, intT, Pn, IV, ppd, isEJA, isFund, normDate, cstyle, tx, gaps, gd, loadDisciplinasPadrao, applyDisciplinasPadrao, blankSchool, normSchool, ordP } from "../utils/helpers.js";
import { setState, getState, setView, getView } from "../ui/components.js";

let S = null;
let view = { m: "t", k: "", dy: "a" };

export async function vGen() {
  S = getState();
  if (!S) return "";
  return vGen0() + calGen();
}

function vGen0() {
  if (VIEW_MODE && !S.hor) return `<div class="card"><h2>Horário ainda não publicado</h2><p class="hint">Assim que a escola publicar o horário finalizado, ele aparece aqui automaticamente.</p></div>`;
  if (!VIEW_MODE && (!S.turmas.length || !S.profs.length)) return `<div class="card"><h2>Faltam dados</h2><p class="hint">Cadastre turmas e ao menos um professor para gerar o horário.</p></div>`;

  let h = VIEW_MODE ? vInfo() : `<div class="card"><h2>Gerar horários</h2><p class="hint">Monta manhã, tarde e noite de uma vez. Professores mais antigos escolhem primeiro. Ninguém fica em duas turmas no mesmo horário. Quem pediu concentração de dias tem os turnos encaixados nos mesmos dias.</p><div style="margin-top:12px"><button class="btn" onclick="generate()">${S.hor ? "Gerar novamente" : "✨ Gerar horários"}</button></div>${pubUI()}`;

  if (S.hor && !VIEW_MODE) {
    h += S.fail ? `<div class="warn"><b>${S.fail} aula(s) sem lugar.</b> Libere horários ou reduza a carga:<br>${(S.list || []).map(esc).join("<br>")}</div>` : `<div class="ok">Horários completos, sem choques.</div>`;
    h += `<div class="ok">Janelas entre aulas dos professores: <b>${S.jan || 0}</b></div>`;
    if ((S.notes || []).length) h += `<div class="ok"><b>Dias concentrados</b><br>${S.notes.map(esc).join("<br>")}</div>`;
  }

  h += `</div>`;
  if (!S.hor) return h;

  const opts = view.m == "t" ? S.turmas : view.m == "n" ? TK.filter(k => S.turmas.some(t => S.tur[t] == k)) : S.profs.map(p => p.nome);
  if (!opts.includes(view.k)) view.k = opts[0];

  h += `<div class="card"><div class="row np"><div><label>Ver por</label><select onchange="view.m=this.value;view.k='';render()"><option value="t" ${view.m == "t" ? "selected" : ""}>Turma</option><option value="p" ${view.m == "p" ? "selected" : ""}>Professor (todos os turnos)</option><option value="n" ${view.m == "n" ? "selected" : ""}>Turno (visão geral)</option></select></div><div><label>${view.m == "t" ? "Turma" : view.m == "n" ? "Turno" : "Professor"}</label><select onchange="view.k=this.value;render()">${opts.map(o => `<option value="${esc(o)}" ${o == view.k ? "selected" : ""}>${view.m == "n" ? TI[o] + " " + TN[o] : esc(o)}${view.m == "t" ? " · " + TN[S.tur[o]] : ""}</option>`).join("")}</select></div></div><div class="row np" style="margin-top:8px"><div><label>Cores</label><select onchange="S.cm=this.value;save();render()"><option value="p" ${(S.cm || "p") == "p" ? "selected" : ""}>Colorido por professor</option><option value="d" ${S.cm == "d" ? "selected" : ""}>Colorido por disciplina</option><option value="b" ${S.cm == "b" ? "selected" : ""}>Preto e branco</option></select></div>${view.m == "n" ? `<div><label>Dia</label><select onchange="view.dy=this.value;render()"><option value="a" ${(view.dy || "a") == "a" ? "selected" : ""}>Todos os dias</option>${DNL.slice(0, S.cfg.d).map((n, i) => `<option value="${i}" ${view.dy == String(i) ? "selected" : ""}>${n}</option>`).join("")}</select></div>` : ""}</div><div class="hint" style="margin-top:12px">${esc(S.es?.find(e => e.id === S.cur)?.nome || "")} · ${S.es?.find(e => e.id === S.cur)?.ano || ""}</div><h2 style="margin:4px 0 0">${view.m == "n" ? TI[view.k] + " " + TN[view.k] : esc(view.k)}</h2>`;

  if (view.m == "n") h += tbn(view.k, view.dy || "a") + resumoN(view.k);
  else if (view.m == "t") h += `<div class="tn">${TI[S.tur[view.k]]} ${TN[S.tur[view.k]]}</div>` + tbl(k => S.hor[view.k]?.[k], ppd(view.k), S.tur[view.k]);
  else {
    const p = S.profs.find(p => p.nome == view.k);
    for (const tn of tns(p)) h += `<div class="tn">${TI[tn]} ${TN[tn]}</div>` + tbl(k => { for (const t of S.turmas) { const x = S.hor[t]?.[k]; if (S.tur[t] == tn && x && x.prof == view.k) return { disc: x.disc, prof: t, pn: x.prof } } }, Pn(tn), tn);
  }
  return h + legend() + `<div style="margin-top:14px" class="np"><p class="hint">Para salvar em PDF, toque em Imprimir e escolha Salvar como PDF. As cores saem na impressão.</p><button class="btn g" onclick="prn()">Imprimir / salvar PDF</button></div></div>`;
}

function tns(p) { return TK.filter(k => p.dem.some(x => x.turmas.some(t => S.tur[t] == k))); }

function legend() {
  const itens = [];
  if (S.cm === "p") S.profs.forEach(p => itens.push(`<span style="display:inline-flex;align-items:center;gap:6px;margin:4px 12px 4px 0"><span style="width:14px;height:14px;border-radius:3px;background:${p.cor}"></span>${esc(p.nome)}</span>`));
  else if (S.cm === "d") { const ds = {}; S.profs.forEach(p => p.dem.forEach(x => ds[x.disc] = 1)); Object.keys(ds).forEach(d => { const c = S.dcor[d] || "#888"; itens.push(`<span style="display:inline-flex;align-items:center;gap:6px;margin:4px 12px 4px 0"><span style="width:14px;height:14px;border-radius:3px;background:${c}"></span>${esc(d)}</span>`); }); }
  return `<div style="margin-top:8px;flex-wrap:wrap">${itens.join("")}</div>`;
}

function vInfo() {
  return `<div class="card"><h2>${esc(S.es?.find(e => e.id === S.cur)?.nome || "")}</h2><p class="hint">${esc(S.es?.find(e => e.id === S.cur)?.ano || "")} · ${S.turmas.length} turmas · ${S.profs.length} professores</p></div>`;
}

function tbl(f, P0, tn) {
  const D = S.cfg.d, P = P0 || S.cfg.p, I = IV(tn);
  let h = `<div class="sc"><table class="tbd"><tr><th></th>${DN.slice(0, D).map(x => `<th>${x}</th>`).join("")}</tr>`;
  for (let s = 0; s < P; s++) {
    h += `<tr>${thT(tn, s)}`;
    for (let d = 0; d < D; d++) {
      const c = f(d + "-" + s);
      h += `<td>${c ? `<div class="cell" style="${cstyle(c)}"><b>${esc(c.disc)}</b><br>${esc(c.prof)}</div>` : ""}</td>`;
    }
    h += `</tr>`;
    if (I == s + 1 && s < P - 1) h += intT(tn, D + 1);
  }
  return h + `</table></div>`;
}

function tbn(tn, dsel) {
  const D = S.cfg.d, I = IV(tn), P = Pn(tn), ts = S.turmas.filter(t => S.tur[t] == tn);
  let h = "";
  for (let d = 0; d < D; d++) {
    if (dsel != "a" && +dsel != d) continue;
    h += `<div class="tn">${DNL[d]}</div><div class="sc"><table><tr><th></th>${ts.map(t => `<th>${esc(t)}</th>`).join("")}</tr>`;
    for (let s = 0; s < P; s++) {
      h += `<tr>${thT(tn, s)}`;
      for (const t of ts) {
        const off = s >= ppd(t), c = off ? null : S.hor[t]?.[d + "-" + s];
        h += `<td>${off ? `<div class="cell" style="background:var(--ln);color:var(--mt);opacity:.5;display:grid;place-items:center">—</div>` : c ? `<div class="cell" style="${cstyle(c)}"><b>${esc(c.disc)}</b><br>${esc(c.prof)}</div>` : ""}</td>`;
      }
      h += `</tr>`;
      if (I == s + 1 && s < P - 1) h += intT(tn, ts.length + 1);
    }
    h += `</table></div>`;
  }
  return h;
}

function resumoN(tn) {
  const m = {};
  S.turmas.filter(t => S.tur[t] == tn).forEach(t => Object.values(S.hor[t] || {}).forEach(c => { const o = m[c.prof] || (m[c.prof] = { d: {}, n: 0 }); o.d[c.disc] = (o.d[c.disc] || 0) + 1; o.n++; }));
  const nm = S.profs.map(p => p.nome).filter(n => m[n]);
  return `<h2 style="margin-top:18px">Professores e disciplinas</h2>` + (nm.map(n => `<div class="pr"><div class="av2" style="background:${pcol(n)};color:${tx(pcol(n))}">${esc(n[0] || "?")}</div><div class="i"><b>${esc(n)}</b><small>${Object.entries(m[n].d).map(([k, v]) => esc(k) + " (" + v + ")").join(", ")} · ${m[n].n} aulas</small></div></div>`).join("") || '<div class="empty">Sem aulas neste turno.</div>');
}

function pcol(nome) { const p = S.profs.find(p => p.nome === nome); return p?.cor || "#888"; }

function pubUI() {
  if (VIEW_MODE) return "";
  return `<div style="margin-top:12px"><label class="ck"><input type="checkbox" ${S.pub ? "checked" : ""} onchange="togglePub(this.checked)">Publicar horário (link público)</label></div>`;
}

window.togglePub = async (v) => { S.pub = v; await save(); render(); };

async function generate() {
  if (!S.turmas.length || !S.profs.length) return toast("Cadastre turmas e professores primeiro");

  const btn = $("m").querySelector("button[onclick='generate()']");
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Gerando...`; }

  const D = S.cfg.d, P = S.cfg.p, I = S.cfg.i, dems = [];
  S.profs.forEach((p, r) => { const q = Object.assign({}, p, { id: p.nome.trim().toLowerCase() }); p.dem.forEach(x => x.turmas.forEach(t => { if (S.turmas.includes(t)) { const n = (typeof x.aulas === "object" && x.aulas !== null) ? (x.aulas[t] ? +x.aulas[t] : 2) : (+x.aulas || 2); dems.push({ p: q, r, t, tn: S.tur[t], disc: x.disc.trim(), n, dup: x.dup }); } })); });

  const ptn = {}; dems.forEach(x => (ptn[x.p.id] = ptn[x.p.id] || new Set()).add(x.tn)); dems.forEach(x => dcol(x.disc));
  const av = (p, tn) => { let c = 0; for (let d = 0; d < D; d++) for (let s = 0; s < P; s++) if (!p.off[tn + d + "-" + s]) c++; return c; };

  let best = null;
  for (let it = 0; it < 400 && (!best || best.fail > 0 || it < 150); it++) {
    const res = {}, busy = {}, load = {}, use = {}, pos = {}, tpos = {}, dt = {}, fail = [];
    S.turmas.forEach(t => res[t] = {});
    const ord = dems.map(x => ({ x, k: x.r * 1000 + av(x.p, x.tn) / x.n - (x.dup ? 2 : 0) + Math.random() * 5 })).sort((a, b) => a.k - b.k).map(o => o.x);

    for (const x of ord) {
      const pid = x.p.id, tn = x.tn, Pt = ppd(x.t), cnt = {}, ok = (d, s) => { const k = d + "-" + s; return s < Pt && !x.p.off[tn + k] && !res[x.t][k] && !busy[pid + tn + k]; };
      const put = (d, s) => { const k = d + "-" + s; res[x.t][k] = { disc: x.disc, prof: x.p.nome }; busy[pid + tn + k] = 1; load[pid + tn + d] = (load[pid + tn + d] || 0) + 1; cnt[d] = (cnt[d] || 0) + 1; (use[pid] = use[pid] || {})[d] = 1; (pos[pid + tn + d] = pos[pid + tn + d] || []).push(s); (tpos[x.t + d] = tpos[x.t + d] || []).push(s); (dt[pid + d] = dt[pid + d] || {})[tn] = 1; };
      const bias = d => { if (!x.p.agr) return 0; const u = use[pid] || {}, pf = x.p.dias || []; let b = 0; if (pf.length && !pf.includes(d)) b += 500; if (Object.keys(u).length) b += u[d] ? -30 : 40; return b; };
      const mx = x.p.max || P, ld = d => load[pid + tn + d] || 0; let rem = x.n;
      const mt = ptn[pid], ei = TK.indexOf(tn), hasL = TK.slice(ei + 1).some(k => mt.has(k)), hasE = TK.slice(0, ei).some(k => mt.has(k));
      const pen = (d, sl) => { const a = pos[pid + tn + d] || [], o = dt[pid + d] || {}, near = (hasL && TK.slice(ei + 1).some(k => o[k])) || (hasE && TK.slice(0, ei).some(k => o[k])), w = near ? 10 : 4, e = sl[0], f = sl[sl.length - 1]; let v = a.length ? gd(a, sl) * 25 : 0; v += hasL && !hasE ? (Pt - 1 - f) * w : hasE && !hasL ? e * w : Math.min(e, Pt - 1 - f) * 5; const b = tpos[x.t + d] || []; return v + (b.length ? gd(b, sl) * 12 : e * 2); };

      while (rem > 0) {
        let pick = null, bs = 1e9;
        if (x.dup && rem >= 2) {
          for (let d = 0; d < D; d++) for (let s = 0; s < Pt - 1; s++) {
            if (s + 1 == IV(tn) || !ok(d, s) || !ok(d, s + 1) || ld(d) + 2 > mx || (cnt[d] || 0) > 0) continue;
            const sc = Math.random() * 6 + ld(d) * 1.5 + bias(d) + pen(d, [s, s + 1]); if (sc < bs) { bs = sc; pick = { d, s, two: 1 }; }
          }
        }
        if (!pick) for (let d = 0; d < D; d++) for (let s = 0; s < Pt; s++) {
          if (!ok(d, s) || ld(d) >= mx) continue;
          const c = cnt[d] || 0, sc = c * (c >= 2 ? 100 : 10) + ld(d) * 1.5 + Math.random() * 6 + bias(d) + pen(d, [s]);
          if (sc < bs) { bs = sc; pick = { d, s }; }
        }
        if (!pick) { fail.push(x); rem--; continue; }
        put(pick.d, pick.s); if (pick.two) { put(pick.d, pick.s + 1); rem -= 2 } else rem--;
      }
    }

    let cost = fail.reduce((a, x) => a + 1000 + (S.profs.length - x.r), 0);
    for (const k in pos) cost += gaps(pos[k]) * 10; for (const k in tpos) cost += gaps(tpos[k]) * 4;
    for (const q in ptn) for (let d = 0; d < D; d++) for (let e = 0; e < 2; e++) { const a = pos[q + TK[e] + d], b = pos[q + TK[e + 1] + d]; if (a && b) cost += (P - 1 - Math.max(...a) + Math.min(...b)) * 6; }
    S.profs.forEach(p => { if (p.agr) { const u = Object.keys(use[p.nome.trim().toLowerCase()] || {}).map(Number), pf = p.dias || []; cost += u.length * 8 + u.filter(d => pf.length && !pf.includes(d)).length * 60; } });
    if (!best || cost < best.cost) best = { res, cost, use, jan: Object.values(pos).reduce((a, v) => a + gaps(v), 0), fail: fail.length, list: fail.map(x => x.p.nome + ": " + x.disc + " (" + x.t + ")") };
  }

  S.notes = S.profs.filter(p => p.agr).map(p => { const u = Object.keys(best.use[p.nome.trim().toLowerCase()] || {}).map(Number).sort(), pf = p.dias || [], out = pf.length && u.some(d => !pf.includes(d)); return p.nome + ": " + (u.map(d => DN[d]).join(", ") || "sem aulas") + (out ? " (parte fora dos dias preferidos)" : ""); });
  S.jan = best.jan; S.hor = best.res; S.fail = best.fail; S.list = best.list; await save(); render();

  if (btn) { btn.disabled = false; btn.innerHTML = S.hor ? "Gerar novamente" : "✨ Gerar horários"; }
  toast(S.fail ? `${S.fail} aulas sem encaixe` : "Horário gerado com sucesso!");
}

function prn() {
  try {
    if (!S.hor) { toast("Gere o horário antes de imprimir."); return; }
    const pv = document.getElementById("pv"); pv.innerHTML = pvBuild(); pvFit();
    const im = pv.querySelector("img.pvl"), go = () => { try { window.print(); } catch (e) { toast("Não foi possível abrir a impressão aqui. Abra o EVA no navegador do aparelho e tente de novo."); } };
    if (im && !im.complete) setTimeout(go, 350); else go();
  } catch (e) { toast("Não foi possível preparar a impressão."); }
}

function pvBuild() { /* build print view - simplified */ return "<div>Print view</div>"; }
function pvFit() { /* fit to page */ }

window.generate = generate;
window.prn = prn;
window.togglePub = togglePub;
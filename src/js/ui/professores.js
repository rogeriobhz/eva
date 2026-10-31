/* ===== ABA PROFESSORES - Com A/S por turma e filtro de turnos ===== */

import { $, $$, esc, toast, ask, DN, TN, TI, TK, PAL, thT, intT, Pn, IV, ppd, gaps, gd, tx, cstyle } from "../utils/helpers.js";
import { setState, getState, setDraft, getDraft, setView, getView } from "./components.js";

let S = null;
let draft = null;

function turmasPorTurno(turnos) {
  if (!turnos || !turnos.length) return S.turmas;
  return S.turmas.filter(t => turnos.includes(S.tur[t]));
}

function nd1() {
  return { turmas: [], disc: "", turnos: [], aulas: {}, dup: false };
}

function nd() {
  return { id: Date.now() + "", nome: "", email: "", max: 5, off: {}, agr: false, ef: false, dv: "", dias: [], dem: [nd1()] };
}

export function vProf() {
  S = getState();
  draft = getDraft() || nd();
  setDraft(draft);

  if (!S.turmas.length) return `<div class="card"><h2>Comece pelas turmas</h2><p class="hint">O formulário usa as turmas cadastradas.</p><button class="btn" onclick="go('cfg')">Cadastrar turmas</button></div>`;

  const D = S.cfg.d, P = S.cfg.p;
  const used = TK.filter(k => S.turmas.some(t => S.tur[t] == k));

  const gr = (tn) => {
    let g = `<div class="tn">${TI[tn]} ${TN[tn]}</div><div class="sc"><table><tr><th></th>${DN.slice(0, D).map(x => `<th>${x}</th>`).join("")}</tr>`;
    const PN = Pn(tn);
    for (let p = 0; p < PN; p++) {
      g += `<tr>${thT(tn, p)}${Array.from({ length: D }, (_, i) => {
        const o = draft.off[tn + i + "-" + p];
        return `<td><button class="av ${o ? "off" : ""}" onclick="tg('${tn + i}-${p}')">${o ? "✕" : "✓"}</button></td>`;
      }).join("")}</tr>`;
      if (IV(tn) == p + 1 && p < PN - 1) g += intT(tn, D + 1);
    }
    return g + `</table></div>`;
  };

  const dem = draft.dem.map((x, i) => {
    const turnosSel = x.turnos || [];
    const turmasFiltradas = turmasPorTurno(turnosSel);
    const turmasSel = x.turmas || [];
    const aulasObj = (typeof x.aulas === "object" && x.aulas !== null) ? x.aulas : (x.aulas ? { [turmasSel[0] || ""]: +x.aulas } : {});

    const turnoOpts = TK.map(k => `<option value="${k}" ${turnosSel.includes(k) ? "selected" : ""}>${TI[k]} ${TN[k]}</option>`).join("");

    return `<div class="dm">
      <div class="row"><div><input placeholder="Disciplina (ex.: Matemática)" value="${esc(x.disc)}" oninput="draft.dem[${i}].disc=this.value" aria-label="Nome da disciplina"></div></div>
      <div class="row" style="margin-top:8px"><div style="flex:1"><label style="font-size:.8rem">Turnos do professor nesta disciplina</label><select multiple onchange="const sel=Array.from(this.selectedOptions).map(o=>o.value); draft.dem[${i}].turnos=sel; render()" style="height:80px" aria-label="Selecionar turnos">${turnoOpts}</select></div></div>
      <div class="hint" style="margin-top:8px">Turmas desta disciplina (filtradas por turno) <a href="#" onclick="allT(${i});return false" style="color:var(--bl);font-weight:700">marcar todas</a></div>
      <div class="chips" style="margin:6px 0 10px">${turmasFiltradas.map((t, j) => `<span class="chip tg ${turmasSel.includes(t) ? "on" : ""}" onclick="toggleT(${i},${j})" aria-pressed="${turmasSel.includes(t)}">${turmasSel.includes(t) ? "✓ " : ""}${esc(t)} ${TI[S.tur[t]]}</span>`).join("")}</div>
      <div style="margin-top:8px"><label style="font-size:.8rem;display:block;margin-bottom:4px">Aulas por semana por turma (A/S)</label>
      <div class="chips" style="gap:6px">${turmasSel.map(t => {
        const cur = draft.dem[i].aulas;
        const obj = (typeof cur === "object" && cur !== null) ? cur : (cur ? { [turmasSel[0] || ""]: +cur } : {});
        return `<div style="display:flex;align-items:center;gap:6px;background:var(--sf);border:2px solid var(--ln);border-radius:10px;padding:6px 10px;min-width:140px"><span style="font-weight:600;color:var(--mt);white-space:nowrap">${esc(t)} ${TI[S.tur[t]]}</span><input type="number" min="1" max="${D*3}" value="${aulasObj[t] || 2}" oninput="const cur2 = draft.dem[${i}].aulas; const obj2 = (typeof cur2 === 'object' && cur2 !== null) ? cur2 : (cur2 ? { [turmasSel[0] || '']: +cur2 } : {}); draft.dem[${i}].aulas = { ...obj2, [${JSON.stringify(t)}]: +this.value }" style="width:60px;padding:8px;border:2px solid var(--ln);border-radius:8px;background:var(--bg);color:var(--tx);font:inherit" aria-label="A/S para ${esc(t)}"></div>`;
      }).join("")}</div></div>
      <div class="row"><label class="ck" style="flex:1.6"><input type="checkbox" ${x.dup ? "checked" : ""} onchange="draft.dem[${i}].dup=this.checked">Aulas geminadas</label><button class="btn g" style="flex:none;width:auto" onclick="dupD(${i})">Duplicar</button><button class="btn d" style="flex:none;width:auto" onclick="rmD(${i})">Remover</button></div></div>`;
  }).join("");

  return `<div class="card"><h2>${S.profs.some(p => p.id == draft.id) ? "Editar professor" : "Formulário do professor"}</h2>
    <label>Nome completo</label><input value="${esc(draft.nome)}" oninput="draft.nome=this.value" placeholder="Ex.: Maria Souza" aria-label="Nome do professor">
    <label>Cor do professor no horário</label><input type="color" value="${draft.cor || PAL[S.profs.length % PAL.length]}" oninput="draft.cor=this.value" style="height:46px;padding:4px" aria-label="Cor do professor">
    <label class="ck" style="color:var(--tx);margin-top:16px"><input type="checkbox" ${draft.ef ? "checked" : ""} onchange="draft.ef=this.checked">Vínculo efetivo</label>
    <label>Data de vínculo (início na rede)</label><input type="date" value="${esc(draft.dv || "")}" onchange="draft.dv=this.value" aria-label="Data de vínculo">
    <p class="hint">Efetivos têm prioridade sobre os demais. Dentro de cada grupo, a data de vínculo mais antiga vem primeiro. Essa ordem define a prioridade na montagem do horário.</p>
    <div class="row"><div><label>E-mail (opcional)</label><input type="email" value="${esc(draft.email)}" oninput="draft.email=this.value" aria-label="E-mail"></div><div><label>Máx. aulas/dia por turno</label><input type="number" min="1" max="${P}" value="${draft.max}" oninput="draft.max=+this.value" aria-label="Máximo aulas por dia"></div></div>
    <label>Disciplinas, turmas e aulas por semana em cada turma. Use Duplicar para copiar a disciplina para outras turmas.</label>${dem}<button class="btn g" onclick="addD()">+ Outra disciplina</button>
    <label>Preferência de dias</label><label class="ck" style="color:var(--tx)"><input type="checkbox" ${draft.agr ? "checked" : ""} onchange="draft.agr=this.checked;render()">Concentrar minhas aulas nos mesmos dias (útil para quem trabalha em mais de um turno)</label>
    ${draft.agr ? `<div class="hint">Escolha os dias desejados. Sem escolha, o app usa o menor número de dias possível. A antiguidade define quem é atendido primeiro.</div><div class="chips" style="margin:8px 0">${DN.slice(0, D).map((n, i) => `<span class="chip tg ${draft.dias.includes(i) ? "on" : ""}" onclick="tgDia(${i})" aria-pressed="${draft.dias.includes(i)}">${draft.dias.includes(i) ? "✓ " : ""}${n}</span>`).join("")}</div>` : ""}
    <label>Disponibilidade: toque nos horários em que NÃO pode lecionar</label>${used.map(gr).join("")}
    <div style="display:grid;gap:10px;margin-top:16px"><button class="btn" onclick="saveP()">Salvar professor</button><button class="btn g" onclick="clearDraft()">Limpar formulário</button></div></div>
    ${vProfList()}`;
}

function vProfList() {
  if (!S.profs.length) return `<div class="card"><h2>Ordem de antiguidade</h2><div class="empty">Nenhum professor ainda.</div></div>`;
  return `<div class="card"><h2>Ordem de antiguidade</h2><p class="hint">Ordem automática: efetivos primeiro; depois, a data de vínculo mais antiga. O 1º tem prioridade na montagem. As setas só desempatam professores com o mesmo vínculo e a mesma data.</p>${S.profs.map((p, k) => `<div class="pr"><div style="display:flex;flex-direction:column;gap:2px;flex:none"><button class="btn g s" style="padding:2px 9px" onclick="mv(${k},-1)" aria-label="Subir" ${tieP(k, k-1) ? "" : "disabled"}>▲</button><button class="btn g s" style="padding:2px 9px" onclick="mv(${k},1)" aria-label="Descer" ${tieP(k, k+1) ? "" : "disabled"}>▼</button></div><div class="av2" style="background:${p.cor};color:${tx(p.cor)}">${k+1}º</div><div class="i"><b>${esc(p.nome)}</b><small>${p.ef ? "Efetivo" : "Não efetivo"}${p.dv ? " · desde " + p.dv.split("-").reverse().join("/") : " · sem data de vínculo"}<br>${pl(p)} aulas · ${tns(p).map(x => TN[x]).join(", ") || "sem turma"}${p.agr ? " · concentra dias" : ""}</small></div><button class="btn g s" onclick="editP('${p.id}')">Editar</button><button class="btn d s" onclick="delP('${p.id}')">×</button></div>`).join("")}</div><button class="btn" onclick="go('gen')">Continuar: gerar horário</button>`;
}

function pl(p) {
  return p.dem.reduce((a, x) => a + (x.aulas ? (typeof x.aulas === "object" ? Object.values(x.aulas).reduce((s, v) => s + (+v || 0), 0) : (+x.aulas || 0)) : 0) * x.turmas.length, 0);
}

function tns(p) { return TK.filter(k => p.dem.some(x => x.turmas.some(t => S.tur[t] == k))); }

function tieP(i, j) { return !!S.profs[j] && !!S.profs[i].ef === !!S.profs[j].ef && (S.profs[i].dv || "") === (S.profs[j].dv || ""); }

function mv(k, s) {
  const j = k + s;
  if (j < 0 || j >= S.profs.length) return;
  if (!tieP(k, j)) { toast("A ordem segue o vínculo efetivo e a data de vínculo. As setas só desempatam quem tem o mesmo vínculo e a mesma data."); return; }
  [S.profs[k], S.profs[j]] = [S.profs[j], S.profs[k]];
  S.hor = null; save(); render();
}

function saveP() {
  const d = draft;
  if (!d.nome.trim()) { alert("Informe o nome do professor."); return; }
  d.dem = d.dem.filter(x => x.turmas.length && x.disc.trim() && x.aulas && ((typeof x.aulas === "object" ? Object.values(x.aulas) : [+x.aulas]).some(v => v > 0)));
  if (S.profs.some(p => p.id != d.id && p.nome.trim().toLowerCase() == d.nome.trim().toLowerCase())) { alert("Já existe um professor com esse nome. Edite-o e adicione a outra disciplina nele."); return; }
  if (!d.dem.length) { alert("Preencha ao menos uma turma, disciplina e número de aulas."); return; }
  if (!d.cor) d.cor = PAL[S.profs.length % PAL.length];
  const i = S.profs.findIndex(p => p.id == d.id);
  i >= 0 ? S.profs[i] = d : S.profs.push(d);
  ordP(S); S.hor = null; save(); draft = null; setDraft(null); render(); scrollTo(0, 0);
}

function editP(id) { draft = JSON.parse(JSON.stringify(S.profs.find(p => p.id == id))); setDraft(draft); render(); scrollTo(0, 0); }
function delP(id) { ask("Excluir este professor?", () => { S.profs = S.profs.filter(p => p.id != id); S.hor = null; save(); render(); }, "Excluir"); }

function addD() { draft.dem.push(nd1()); render(); }

function toggleT(i, j) {
  const x = draft.dem[i];
  const turnosSel = x.turnos || [];
  const turmasFiltradas = turmasPorTurno(turnosSel);
  const t = turmasFiltradas[j];
  const a = x.turmas || [];
  const k = a.indexOf(t);
  k >= 0 ? a.splice(k, 1) : a.push(t);
  render();
}

function allT(i) {
  const x = draft.dem[i];
  const turnosSel = x.turnos || [];
  const turmasFiltradas = turmasPorTurno(turnosSel);
  const a = x.turmas || [];
  a.length === turmasFiltradas.length ? (x.turmas = []) : (x.turmas = turmasFiltradas.slice());
  render();
}

function dupD(i) { draft.dem.splice(i + 1, 0, JSON.parse(JSON.stringify(draft.dem[i]))); render(); }
function rmD(i) { draft.dem.splice(i, 1); if (!draft.dem.length) draft.dem.push(nd1()); render(); }

function clearDraft() { draft = null; setDraft(null); render(); }

function tg(k) { draft.off[k] = !draft.off[k]; render(); }
function tgDia(i) { const a = draft.dias, k = a.indexOf(i); k >= 0 ? a.splice(k, 1) : a.push(i); render(); }

/* ===== EXPORTS GLOBAIS ===== */
window.vProf = vProf;
window.saveP = saveP;
window.editP = editP;
window.delP = delP;
window.addD = addD;
window.toggleT = toggleT;
window.allT = allT;
window.dupD = dupD;
window.rmD = rmD;
window.clearDraft = clearDraft;
window.tg = tg;
window.tgDia = tgDia;
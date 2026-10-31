/* ===== BOOTSTRAP PRINCIPAL ===== */

import { render, initThemeToggle, setState, getState, setView, getView } from "./ui/components.js";
import { loadDisciplinasPadrao, blankSchool, normSchool, storageGet, storageSet } from "./utils/helpers.js";
import { auth, db, FB, US, DL, initAuth } from "./firebase/auth.js";

let currentUser = null;
let STORAGE_KEY = null;
let USER_MODE = false;
let VIEW_MODE = false;
let SLUG = null;

export async function bootstrap(opts) {
  VIEW_MODE = !!opts.VIEW_MODE;
  SLUG = opts.SLUG || null;
  USER_MODE = !!opts.USER_MODE;
  currentUser = opts.currentUser || null;
  STORAGE_KEY = opts.STORAGE_KEY;

  console.log("[EVA] Bootstrap:", { VIEW_MODE, SLUG, USER_MODE, STORAGE_KEY });

  await loadDisciplinasPadrao();
  await initApp();

  initThemeToggle();
  render();
}

async function initApp() {
  if (VIEW_MODE) {
    await loadPublicView();
  } else if (USER_MODE) {
    await loadUserData();
  } else {
    await loadAdminData();
  }
}

async function loadPublicView() {
  if (!SLUG) return;

  try {
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const ref = doc(db, "escolas", SLUG);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data.pub && data.d) {
        const school = data.d;
        normSchool(school);
        setState(school);
      }
    }
  } catch (e) {
    console.error("[EVA] Erro ao carregar visualização pública:", e);
  }
}

async function loadUserData() {
  if (!currentUser) return;

  try {
    // Tentar IndexedDB primeiro
    const local = await storageGet(STORAGE_KEY);
    if (local) {
      normSchool(local);
      setState(local);
      console.log("[EVA] Carregado do IndexedDB");
      return;
    }

    // Tentar Firestore
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const ref = doc(db, "escolas", currentUser.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      normSchool(data);
      setState(data);
      await storageSet(STORAGE_KEY, data);
      console.log("[EVA] Carregado do Firestore");
      return;
    }

    // Nova escola
    const newSchool = blankSchool();
    newSchool.es = [{ id: currentUser.uid, nome: currentUser.displayName || "Minha Escola", ano: new Date().getFullYear() }];
    newSchool.cur = currentUser.uid;
    normSchool(newSchool);
    setState(newSchool);
    await save();
    console.log("[EVA] Nova escola criada");
  } catch (e) {
    console.error("[EVA] Erro ao carregar dados do usuário:", e);
  }
}

async function loadAdminData() {
  if (!currentUser) return;

  try {
    // Admin vê todas as escolas
    const { collection, getDocs, query, orderBy } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const snap = await getDocs(query(collection(db, "escolas"), orderBy("nome")));
    const escolas = [];
    snap.docs.forEach(d => escolas.push({ id: d.id, ...d.data() }));

    if (escolas.length) {
      const first = escolas[0];
      const school = first.d || blankSchool();
      school.es = escolas;
      school.cur = first.id;
      normSchool(school);
      setState(school);
      await storageSet(STORAGE_KEY, school);
    } else {
      const newSchool = blankSchool();
      newSchool.es = [{ id: currentUser.uid, nome: "Minha Escola", ano: new Date().getFullYear() }];
      newSchool.cur = currentUser.uid;
      normSchool(newSchool);
      setState(newSchool);
      await save();
    }
  } catch (e) {
    console.error("[EVA] Erro ao carregar dados admin:", e);
  }
}

export async function save() {
  const S = getState();
  if (!S) return;

  try {
    await storageSet(STORAGE_KEY, S);

    if (!USER_MODE && currentUser) {
      const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      const ref = doc(db, "escolas", USER_MODE ? currentUser.uid : S.cur);
      await setDoc(ref, { ...S, pub: S.pub || false, updatedAt: Date.now() }, { merge: true });
    }
  } catch (e) {
    console.error("[EVA] Erro ao salvar:", e);
  }
}

window.save = save;
window.FB = FB;
window.US = US;
window.DL = DL;

// Initialize auth (sets up listener, calls bootstrap when ready)
initAuth(async (user) => {
  if (!user) return;

  const email = (user.email || "").toLowerCase();
  const isAdmin = !SLUG && window.ADMIN_EMAILS?.includes(email);
  const storageKey = "eva-" + (SLUG ? "v-" + SLUG + "-" : "") + user.uid;

  await bootstrap({
    VIEW_MODE: window.VIEW_MODE,
    SLUG: window.SLUG,
    USER_MODE: !isAdmin,
    STORAGE_KEY: storageKey,
    currentUser: user
  });
});
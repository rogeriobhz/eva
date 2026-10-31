import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, setDoc, updateDoc, deleteDoc, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { FIREBASE_CFG, ADMIN_EMAILS, SLUG, VIEW_MODE } from "./config.js";

const app = initializeApp(FIREBASE_CFG);
export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

function msg(t) { const el = document.getElementById("lm"); if (el) el.textContent = t; }

export const FB = {
  out: () => signOut(auth).then(() => location.reload()),
  login: async () => {
    msg("");
    try { await signInWithPopup(auth, provider); }
    catch (e) {
      if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") {
        signInWithRedirect(auth, provider);
      } else if (e.code !== "auth/popup-closed-by-user") {
        msg("Não foi possível entrar (" + (e.code || e.message) + "). " +
          (e.code === "auth/unauthorized-domain" ? "Adicione este site em Authentication > Configurações > Domínios autorizados no Firebase." :
           e.code === "auth/operation-not-allowed" ? "Ative o login Google em Authentication > Método de login no Firebase." :
           "Verifique a configuração e tente de novo."));
      }
    }
  }
};

export const DB = {
  collection: (path) => ({
    doc: (id) => {
      const ref = doc(db, path, id);
      return {
        set: (data) => setDoc(ref, data),
        update: (data) => updateDoc(ref, data),
        delete: () => deleteDoc(ref),
        get: async () => { const snap = await getDoc(ref); return { exists: snap.exists(), data: () => snap.data() }; },
        onSnapshot: (cb, errCb) => onSnapshot(ref, s => cb({ exists: s.exists(), data: () => s.data() }), errCb)
      };
    },
    where: (field, op, value) => ({
      onSnapshot: (cb, errCb) => onSnapshot(query(collection(db, path), where(field, op, value)), s => cb({ docs: s.docs.map(d => ({ id: d.id, data: () => d.data() })) }), errCb)
    }),
    get: async () => { const snap = await getDocs(collection(db, path)); return { docs: snap.docs.map(d => ({ id: d.id, data: () => d.data() })) }; },
    onSnapshot: (cb, errCb) => onSnapshot(collection(db, path), s => cb({ docs: s.docs.map(d => ({ id: d.id, data: () => d.data() })) }), errCb)
  })
};

export const US = {
  id: async () => (await auth.currentUser)?.uid,
  email: async () => (await auth.currentUser)?.email,
  search: async (q = "") => {
    q = q.toLowerCase();
    const snap = await getDocs(collection(db, "usuarios"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(u => !q || (u.nome || "").toLowerCase().includes(q) || (u.email || "").includes(q))
      .slice(0, 15)
      .map(u => ({ id: u.id, name: (u.nome || "") + " · " + u.email, guest: false }));
  }
};

export const DL = {
  save: async ({ filename, data }) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
};

let started = false;
let currentUser = null;
let bootstrapFn = null;

export function setBootstrap(fn) { bootstrapFn = fn; }

export async function initAuth() {
  onAuthStateChanged(auth, async (user) => {
    const lg = document.getElementById("lg");
    const appEl = document.querySelector(".app");
    const tabsEl = document.querySelector(".tabs");
    const lt = document.getElementById("lt");

    if (!user) {
      if (lg) lg.style.display = "";
      if (appEl) appEl.style.display = "none";
      if (tabsEl) tabsEl.style.display = "none";
      if (lt && SLUG) lt.textContent = "Visualização do horário publicado · /" + SLUG;
      return;
    }

    const email = (user.email || "").toLowerCase();
    if (!email.endsWith("@gmail.com")) {
      await signOut(auth);
      msg("Use uma conta @gmail.com.");
      return;
    }

    currentUser = user;

    try {
      await setDoc(doc(db, "usuarios", user.uid), {
        nome: user.displayName || "",
        email,
        visto: Date.now()
      });
    } catch (e) { console.warn("Erro salvando usuário:", e); }

    if (started) return;
    started = true;

    if (lg) lg.style.display = "none";
    if (appEl) appEl.style.display = "";
    if (tabsEl) tabsEl.style.display = "";

    const who = document.getElementById("who");
    if (who) who.textContent = email;

    const isAdmin = !SLUG && ADMIN_EMAILS.includes(email);
    const storageKey = "eva-" + (SLUG ? "v-" + SLUG + "-" : "") + user.uid;

    if (bootstrapFn) {
      bootstrapFn({ VIEW_MODE, SLUG, USER_MODE: !isAdmin, STORAGE_KEY: storageKey, currentUser });
    } else {
      console.error("[EVA] Bootstrap function not registered");
    }
  });
}

export { SLUG, VIEW_MODE, currentUser };
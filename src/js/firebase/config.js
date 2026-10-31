/* ===== FIREBASE CONFIG ===== */

// Firebase configuration - valores reais do Firebase Console
export const FIREBASE_CFG = {
  apiKey: "AIzaSyCGD2Yrenv84jlQ_J-MX31X9J__cTGXm3I",
  authDomain: "eva-horarios.firebaseapp.com",
  projectId: "eva-horarios",
  storageBucket: "eva-horarios.firebasestorage.app",
  messagingSenderId: "250967529540",
  appId: "1:250967529540:web:31b0e27a1f40219853c411"
};

// Emails de administradores (podem ver todas as escolas)
export const ADMIN_EMAILS = [
  "rogeriodireito@gmail.com"
  // Adicione outros emails de admin aqui
];

// Slug da visualização pública (extraído da URL ?v=slug)
export const SLUG = new URLSearchParams(location.search).get("v") || null;

// Modo visualização pública (somente leitura)
export const VIEW_MODE = !!SLUG;
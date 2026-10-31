/* ===== FIREBASE CONFIG ===== */

// Firebase configuration - substitua pelos seus valores reais do Firebase Console
export const FIREBASE_CFG = {
  apiKey: "AIzaSy...",           // ← COLOQUE SUA API KEY AQUI
  authDomain: "seu-projeto.firebaseapp.com",  // ← SEU AUTH DOMAIN
  projectId: "seu-projeto",      // ← SEU PROJECT ID
  storageBucket: "seu-projeto.appspot.com",   // ← SEU STORAGE BUCKET
  messagingSenderId: "123456789", // ← SEU SENDER ID
  appId: "1:123456789:web:abcdef" // ← SEU APP ID
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
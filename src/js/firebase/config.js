/* ===== FIREBASE CONFIG ===== */

// Firebase configuration - substitua pelos seus valores reais
export const FIREBASE_CFG = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Emails de administradores (podem ver todas as escolas)
export const ADMIN_EMAILS = [
  "rogeriobhz@gmail.com"
  // Adicione outros emails de admin aqui
];

// Slug da visualização pública (extraído da URL ?v=slug)
export const SLUG = new URLSearchParams(location.search).get("v") || null;

// Modo visualização pública (somente leitura)
export const VIEW_MODE = !!SLUG;
// Firebase initialization via CDN (modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const config = window.firebaseConfig;
if (!config || !config.projectId) {
  console.warn("Firebase config belum diisi. Perbarui js/firebase-config.js");
}

export const app = initializeApp(config || {});
export const db = getFirestore(app);
export const auth = getAuth(app);
export { serverTimestamp, GoogleAuthProvider };
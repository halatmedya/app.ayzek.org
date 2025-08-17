import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA4ai2q8x5AWyVheUggo9HyHR16p6COLuE",
  authDomain: "ayzekappweb.firebaseapp.com",
  projectId: "ayzekappweb",
  storageBucket: "ayzekappweb.firebasestorage.app",
  messagingSenderId: "126146515591",
  appId: "1:126146515591:web:9d434d9311d85b48885e22",
  measurementId: "G-4X8E5NVTSV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// Auth persistence ayarla - kullanıcı oturumunu tarayıcıda saklasın
// Hızlı başlatma için önce kurulum
auth.authStateReady().then(() => {
  console.log('🚀 Firebase Auth hazır - instant açılış');
});

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Auth persistence ayarlanırken hata:', error);
});

export default app;
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB7FaFLlvhuu2v2RVPnNiBQ0fKBDS1YbXs",
  authDomain: "akilli-beslenme-asistani.firebaseapp.com",
  projectId: "akilli-beslenme-asistani",
  storageBucket: "akilli-beslenme-asistani.firebasestorage.app",
  messagingSenderId: "317134399775",
  appId: "1:317134399775:web:a762248d20663eaccd282a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;

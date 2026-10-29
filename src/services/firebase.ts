import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Import config - in real app would load dynamically, but here we read the file
// IMPORTANT: In a production build, these should be handled securely
const firebaseConfig = {
  apiKey: "AIzaSyD4ZZg1bSYszJLgpqDf5x4LkWYqiVsHtng",
  authDomain: "the-involution-f5v9p.firebaseapp.com",
  projectId: "the-involution-f5v9p",
  storageBucket: "the-involution-f5v9p.firebasestorage.app",
  messagingSenderId: "55322439373",
  appId: "1:55322439373:web:79c6837894f051af65c384"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

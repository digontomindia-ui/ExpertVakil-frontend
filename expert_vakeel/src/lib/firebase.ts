// Firebase Client Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAg67RQ681G4UQDr7Geo6bq3aV0U9puUxs",
  authDomain: "legal-network-ad078.firebaseapp.com",
  projectId: "legal-network-ad078",
  storageBucket:"legal-network-ad078.firebasestorage.app",
  messagingSenderId: "10659567570",
  appId:  "1:10659567570:web:7ec27c8862f9474e5bda0b",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
const auth1 = getAuth();
onAuthStateChanged(auth1, (user) => {
  console.log("Firebase auth state:", user ? user.uid : "NO USER");
});
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;


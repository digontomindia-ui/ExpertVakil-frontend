import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7vJZ6N6x8Jv4J4vJcK9vJcK9vJcK9vJc", // This will be replaced with actual API key
  authDomain: "legal-network-ad078.firebaseapp.com",
  projectId: "legal-network-ad078",
  storageBucket: "legal-network-ad078.appspot.com",
  messagingSenderId: "110523303900733319679",
  appId: "1:110523303900733319679:web:1234567890abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
export const storage = getStorage(app);

export default app;

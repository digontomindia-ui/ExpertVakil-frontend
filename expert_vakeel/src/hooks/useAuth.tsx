import { useState, useEffect } from "react";
import api from "../services/api";
import { signInWithCustomToken, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { chatService } from "../services/chatService";

export default function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await api.get("/api/clients/me");
      const userData = res.data.data || res.data;
      setUser(userData);

      // Set user ID in chat service and ensure Firebase auth
      if (userData) {
        const userId = userData.id || userData._id;
        chatService.setCurrentUserId(userId);
        try {
          // Check if already signed in to Firebase (session should persist from login)
          if (!auth.currentUser) {
            console.log('Firebase user not authenticated - user needs to login again');
          } else {
            console.log('Firebase authentication active');
          }
        } catch (firebaseErr) {
          console.error("Firebase auth check failed:", firebaseErr);
        }
      } else {
        chatService.setCurrentUserId(null);
      }
    } catch (err) {
      setUser(null);
      chatService.setCurrentUserId(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post("/api/clients/login", { email, password });
      const userData = res.data.data || res.data;
      const firebaseToken = res.data.firebaseToken;

      setUser(userData);

      // Set user ID in chat service and sign into Firebase with custom token
      chatService.setCurrentUserId(userData.id || userData._id);
      try {
        if (firebaseToken) {
          await signInWithCustomToken(auth, firebaseToken);
          console.log('Firebase authentication successful');
        } else {
          console.error('No Firebase token received from backend');
        }
      } catch (firebaseErr) {
        console.error("Firebase custom token sign-in failed:", firebaseErr);
        // Don't fail the login if Firebase auth fails
      }

      return res.data;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => { fetchUser(); }, []);

  const logout = async () => {
    try {
      await api.post("/api/clients/logout");

      // Clear user ID from chat service and sign out from Firebase
      chatService.setCurrentUserId(null);
      try {
        await firebaseSignOut(auth);
      } catch (firebaseErr) {
        console.error("Firebase sign-out failed:", firebaseErr);
      }

      setUser(null);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return { user, loading, fetchUser, login, logout };
}




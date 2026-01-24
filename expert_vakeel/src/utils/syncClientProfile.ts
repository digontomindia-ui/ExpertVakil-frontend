// Utility to manually sync client profiles to Firebase
// This is a temporary utility to fix existing clients that weren't synced

import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ClientData {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  profilePic?: string;
}

/**
 * Manually sync current client profile to Firebase
 * Call this from browser console: window.syncCurrentClient()
 */
export const syncCurrentClientProfile = async (): Promise<void> => {
  try {
    console.log('🔄 Starting manual client profile sync...');

    // Get client data from localStorage
    const clientDataStr = localStorage.getItem("client");
    if (!clientDataStr || clientDataStr === "undefined") {
      console.error('❌ No client data found in localStorage');
      return;
    }

    const clientData: ClientData = JSON.parse(clientDataStr);
    const clientId = clientData.id || clientData._id;

    if (!clientId) {
      console.error('❌ No client ID found in client data');
      return;
    }

    console.log('📋 Client data found:', {
      clientId,
      name: clientData.name,
      email: clientData.email,
    });

    // Check if client already exists in Firebase
    const clientRef = doc(db, 'clients', clientId);
    const existingDoc = await getDoc(clientRef);

    if (existingDoc.exists()) {
      console.log('ℹ️ Client already exists in Firebase:', existingDoc.data());
    }

    // Sync/update client profile
    const clientProfile = {
      id: clientId,
      name: clientData.name ||  'Client',
      email: clientData.email || '',
      phone: clientData.phone || '',
      profilePic: clientData.profilePic ||  '',
      isActive: true,
      isOnline: true,
      lastSeen: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(clientRef, clientProfile, { merge: true });

    console.log('✅ Client profile synced successfully!');
    console.log('📄 Synced profile:', clientProfile);

    // Verify the sync worked
    const verifyDoc = await getDoc(clientRef);
    if (verifyDoc.exists()) {
      console.log('✅ Verification successful - client exists in Firebase');
      console.log('📋 Firebase document:', verifyDoc.data());
    } else {
      console.error('❌ Verification failed - client not found after sync');
    }

  } catch (error: any) {
    console.error('❌ Failed to sync client profile:', {
      error: error.message,
      code: error.code,
    });

    if (error.code === 'permission-denied') {
      console.error('🔒 Permission denied - Firebase security rules may need updating');
      console.log(`
🔧 Add this to your Firebase security rules:

match /clients/{clientId} {
  allow read: if true;
  allow write: if request.auth != null;
  allow create: if request.auth != null;
}
      `);
    }
  }
};

/**
 * Check if current client exists in Firebase
 */
export const checkClientInFirebase = async (): Promise<void> => {
  try {
    const clientDataStr = localStorage.getItem("client");
    if (!clientDataStr) {
      console.log('❌ No client data in localStorage');
      return;
    }

    const clientData: ClientData = JSON.parse(clientDataStr);
    const clientId = clientData.id || clientData._id;

    if (!clientId) {
      console.log('❌ No client ID found');
      return;
    }

    console.log('🔍 Checking Firebase for client:', clientId);

    const clientRef = doc(db, 'clients', clientId);
    const docSnap = await getDoc(clientRef);

    if (docSnap.exists()) {
      console.log('✅ Client found in Firebase:', docSnap.data());
    } else {
      console.log('❌ Client NOT found in Firebase');
      console.log('💡 Run syncCurrentClient() to fix this');
    }

  } catch (error: any) {
    console.error('❌ Error checking client:', error.message);
  }
};

// Make functions available globally for browser console
declare global {
  interface Window {
    syncCurrentClient: () => Promise<void>;
    checkClientInFirebase: () => Promise<void>;
  }
}

// Auto-expose to window in development
if (typeof window !== 'undefined') {
  window.syncCurrentClient = syncCurrentClientProfile;
  window.checkClientInFirebase = checkClientInFirebase;
}

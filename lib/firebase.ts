
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCaTCtZu8i-edyo2y6O0T92B3jRCEGUDrM",
  authDomain: "clubrecruitmentmanagement.firebaseapp.com",
  projectId: "clubrecruitmentmanagement",
  storageBucket: "clubrecruitmentmanagement.firebasestorage.app",
  messagingSenderId: "582750387246",
  appId: "1:582750387246:web:6ede84d8fd4f720ceeb3bf",
  measurementId: "G-0887NMLXDB"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let analytics;

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics, auth, db, storage, firebaseConfig };

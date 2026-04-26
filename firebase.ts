// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCu_5QtvbrNHQ3iIbu-3LWJIIeYQ4-3bPA",
  authDomain: "pantrypal-5014c.firebaseapp.com",
  projectId: "pantrypal-5014c",
  storageBucket: "pantrypal-5014c.firebasestorage.app",
  messagingSenderId: "728119730349",
  appId: "1:728119730349:web:e33b506d8c2d9efd756624",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

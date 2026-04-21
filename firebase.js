
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
/*
const firebaseConfig = {
  apiKey: "AIzaSyBauK0XpYVnanRN7o2q9q34Zf1SqXXANyI",
  authDomain: "temporaryppdb-7e0c7.firebaseapp.com",
  projectId: "temporaryppdb-7e0c7",
  storageBucket: "temporaryppdb-7e0c7.firebasestorage.app",
  messagingSenderId: "556616560382",
  appId: "1:556616560382:web:389292d96ac306c6bf7faf"
};
*/
const firebaseConfig = {
  apiKey: "AIzaSyBauK0XpYVnanRN7o2q9q34Zf1SqXXANyI",
  authDomain: "temporaryppdb-7e0c7.firebaseapp.com",
  projectId: "temporaryppdb-7e0c7",
  storageBucket: "temporaryppdb-7e0c7.firebasestorage.app",
  messagingSenderId: "556616560382",
  appId: "1:556616560382:web:389292d96ac306c6bf7faf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);




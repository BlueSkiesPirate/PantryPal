// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmgvZrxXfQPejX824KDLK1taw4F0o-cAA",
  authDomain: "pantrypal-ca8f4.firebaseapp.com",
  projectId: "pantrypal-ca8f4",
  storageBucket: "pantrypal-ca8f4.firebasestorage.app",
  messagingSenderId: "528140997903",
  appId: "1:528140997903:web:b0669d8748bfeb7ffe5a7a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "typewise-i8sfs",
  appId: "1:282420473189:web:b9f1d37ca5d2617d3dc58c",
  storageBucket: "typewise-i8sfs.firebasestorage.app",
  apiKey: "AIzaSyDuHC6A9HQkzw5AjStRxRwBvVQe5C2TZZw",
  authDomain: "typewise-i8sfs.firebaseapp.com",
  messagingSenderId: "282420473189",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };

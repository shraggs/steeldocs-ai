// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// ✅ Replace this with your own Firebase config from your project settings
const firebaseConfig = {
  apiKey: "AIzaSyBYgygIbYmdcLkxsbAMlO5p-9EBXMulh-c",
  authDomain: "steeldocs-ai.firebaseapp.com",
  projectId: "steeldocs-ai",
  storageBucket: "steeldocs-ai.firebasestorage.app",
  messagingSenderId: "768097635314",
  appId: "1:768097635314:web:6d3d5d9a5357366fb0b96b",
  measurementId: "G-BCSKBVFR8H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize individual services
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

export { auth, storage, db };
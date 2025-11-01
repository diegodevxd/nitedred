// Firebase Configuration and Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, push, set, onValue, query, orderByChild, get, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBne6Zpr5qKLnNJr6SUEh4PGpdnGqyWPwo",
  authDomain: "nitedcrypto-da32a.firebaseapp.com",
  databaseURL: "https://nitedcrypto-da32a-default-rtdb.firebaseio.com",
  projectId: "nitedcrypto-da32a",
  storageBucket: "nitedcrypto-da32a.firebasestorage.app",
  messagingSenderId: "85577171483",
  appId: "1:85577171483:web:805aaa524d4727c4bb2ebe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

// Create firebaseDB object with all database functions
const firebaseDB = {
  database,
  ref,
  push,
  set,
  onValue,
  query,
  orderByChild,
  get,
  update,
  remove
};

// Initialize Firebase Cloud Messaging for background notifications
let messaging = null;
try {
  messaging = getMessaging(app);
  console.log('✅ Firebase Messaging inicializado');
} catch (error) {
  console.log('⚠️ Firebase Messaging no disponible:', error.message);
}

// Export auth and database functions
export { 
  auth, 
  database,
  firebaseDB,
  messaging,
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  getToken,
  onMessage,
  ref,
  push,
  set,
  onValue,
  query,
  orderByChild,
  get,
  update,
  remove
};

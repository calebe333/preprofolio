import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAKE-fU2KRs9flQEbBZdL4PZqKZT-irrKU",
  authDomain: "preprofolio.firebaseapp.com",
  projectId: "preprofolio",
  storageBucket: "preprofolio.appspot.com",
  messagingSenderId: "692987377324",
  appId: "1:692987377324:web:5b2c3b5e7ce7ed5e4f5109",
  measurementId: "G-EE6Z37FY80"
};

// --- Initialize Firebase ---
let app, auth, db, provider;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    provider = new GoogleAuthProvider();
    console.log("Firebase Initialized Successfully.");
} catch (error) {
    console.error("Firebase Initialization Error:", error);
}

export { auth, db, provider };

// Re-exporting firebase functions allows you to import everything from './firebase'
// which is a clean pattern.
export { 
    signInWithPopup, 
    onAuthStateChanged, 
    signOut 
} from 'firebase/auth';

export { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    doc, 
    updateDoc, 
    deleteDoc, 
    serverTimestamp, 
    setDoc, 
    getDoc, 
    onSnapshot, 
    orderBy, 
    writeBatch, 
    limit 
} from 'firebase/firestore';

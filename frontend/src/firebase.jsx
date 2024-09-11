
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth"
import {getStorage} from "firebase/storage"
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyAnTjiybLwKi9cVQ_fK5zcJ967pBI9IpBY",
  authDomain: "invoice-app-f35d4.firebaseapp.com",
  projectId: "invoice-app-f35d4",
  storageBucket: "invoice-app-f35d4.appspot.com",
  messagingSenderId: "106616904466",
  appId: "1:106616904466:web:8d1517b6db324fb4cf31cb",
  measurementId: "G-Q4YDCN0958"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const  auth = getAuth()
export const storage = getStorage()
export const db = getFirestore(app)
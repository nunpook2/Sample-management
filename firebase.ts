
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBOdN0fT8OH5NJESGXWoKQElL6YNUTfjJk",
  authDomain: "quotation-df3df.firebaseapp.com",
  projectId: "quotation-df3df",
  storageBucket: "quotation-df3df.firebasestorage.app",
  messagingSenderId: "1035723450982",
  appId: "1:1035723450982:web:0823c83181a8595304dba7",
  measurementId: "G-VEWW3DJ6CL"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyClywxcc1eGf4SnFUucDCcg3STL8CdXN0k",
    authDomain: "arthorxmith.firebaseapp.com",
    projectId: "arthorxmith",
    storageBucket: "arthorxmith.firebasestorage.app",
    messagingSenderId: "72714216236",
    appId: "1:72714216236:web:b0b7690c40bffbdc7b0289",
    measurementId: "G-VF91TFT8QV"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
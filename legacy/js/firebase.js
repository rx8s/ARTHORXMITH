import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import { getAuth }
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import { getDatabase }
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const firebaseConfig = {

  apiKey: "AIzaSyClywxcc1eGf4SnFUucDCcg3STL8CdXN0k",

  authDomain: "arthorxmith.firebaseapp.com",

  databaseURL:
    "https://arthorxmith-default-rtdb.asia-southeast1.firebasedatabase.app",

  projectId: "arthorxmith",

  storageBucket: "arthorxmith.firebasestorage.app",

  messagingSenderId: "72714216236",

  appId: "1:72714216236:web:b0b7690c40bffbdc7b0289"
};

const app =
    initializeApp(firebaseConfig);

export const auth =
    getAuth(app);

export const db =
    getDatabase(app);
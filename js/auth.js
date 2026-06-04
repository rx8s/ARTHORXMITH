import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    ref,
    onValue
}
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

onAuthStateChanged(
    auth,
    (user)=>
    {
        if(!user)
        {
            return;
        }

        // แสดงชื่อ
        document.getElementById(
            "playerName"
        ).innerText =
            user.displayName;

        // Realtime User Data
        const userRef =
            ref(
                db,
                "users/" + user.uid
            );

        onValue(
            userRef,
            (snapshot)=>
            {
                const player =
                    snapshot.val();

                if(!player)
                {
                    return;
                }

                document.getElementById(
                    "gold"
                ).innerText =
                    player.gold;

                document.getElementById(
                    "level"
                ).innerText =
                    player.level;
            }
        );
    }
);
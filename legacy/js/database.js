import { db }
from "./firebase.js";

import {

    ref,
    get,
    set

}
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

export async function createUser(user)
{
    const userRef =
        ref(
            db,
            "users/" + user.uid
        );

    const snapshot =
        await get(userRef);

    if(!snapshot.exists())
    {
        await set(
            userRef,
            {
                uid:user.uid,

                displayName:
                    user.displayName,

                email:
                    user.email,

                photoURL:
                    user.photoURL,

                level:1,

                exp:0,

                gold:1000,

                collection:{
                    cat001:true,
                    wolf001:true,
                    slime001:true
                },

                deck:{
                    slot1:"cat001",
                    slot2:"wolf001",
                    slot3:"slime001"
                }
            }
        );
    }
}

export async function getUser(uid)
{
    const snapshot =
        await get(
            ref(
                db,
                "users/" + uid
            )
        );

    if(snapshot.exists())
    {
        return snapshot.val();
    }

    return null;
}
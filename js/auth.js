import {
    auth,
    db
}
from "./firebase.js";

import {

    GoogleAuthProvider,

    signInWithPopup,

    signOut,

    onAuthStateChanged

}
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {

    ref,

    get,

    set

}
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const loginBtn =
    document.getElementById(
        "loginBtn"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

loginBtn.addEventListener(
    "click",
    login
);

logoutBtn.addEventListener(
    "click",
    logout
);

async function login()
{
    try
    {
        const provider =
            new GoogleAuthProvider();

        const result =
            await signInWithPopup(
                auth,
                provider
            );

        const user =
            result.user;

        await createUser(
            user
        );

        console.log(
            "LOGIN SUCCESS"
        );
    }
    catch(error)
    {
        console.error(error);

        alert(
            error.message
        );
    }
}

async function logout()
{
    await signOut(auth);
}

async function createUser(user)
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
                uid:
                    user.uid,

                displayName:
                    user.displayName,

                email:
                    user.email,

                photoURL:
                    user.photoURL,

                createdAt:
                    Date.now()
            }
        );

        console.log(
            "CREATE USER SUCCESS"
        );
    }
}

onAuthStateChanged(
    auth,
    (user)=>
    {
        if(user)
        {
            document
                .getElementById(
                    "guest"
                )
                .style.display =
                "none";

            document
                .getElementById(
                    "member"
                )
                .style.display =
                "block";

            document
                .getElementById(
                    "avatar"
                )
                .src =
                user.photoURL;

            document
                .getElementById(
                    "displayName"
                )
                .innerText =
                user.displayName;

            document
                .getElementById(
                    "email"
                )
                .innerText =
                user.email;
        }
        else
        {
            document
                .getElementById(
                    "guest"
                )
                .style.display =
                "block";

            document
                .getElementById(
                    "member"
                )
                .style.display =
                "none";
        }
    }
);
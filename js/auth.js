import {
    auth,
    db
}
from "./firebase.js";

import {

    GoogleAuthProvider,

    signInWithPopup,

    signOut,

    onAuthStateChanged,

    browserLocalPersistence,

    setPersistence

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

if(loginBtn)
{
    loginBtn.addEventListener(
        "click",
        login
    );
}

if(logoutBtn)
{
    logoutBtn.addEventListener(
        "click",
        logout
    );
}

async function login()
{
    try
    {
        await setPersistence(
            auth,
            browserLocalPersistence
        );

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

        location.href =
            "dashboard.html";
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
    try
    {
        await signOut(auth);

        location.href =
            "index.html";
    }
    catch(error)
    {
        console.error(error);
    }
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

    if(snapshot.exists())
    {
        return;
    }

    let role = "user";

    if(
        user.email ===
        "rtiix8@gmail.com"
    )
    {
        role = "admin";
    }

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

            role:
                role,

            gold:
                1000,

            createdAt:
                Date.now()
        }
    );

    console.log(
        "CREATE USER SUCCESS"
    );
}

onAuthStateChanged(
    auth,
    async(user)=>
    {
        if(user)
        {
            const snapshot =
                await get(
                    ref(
                        db,
                        "users/" +
                        user.uid
                    )
                );

            const profile =
                snapshot.val();

            const guest =
                document.getElementById(
                    "guest"
                );

            const member =
                document.getElementById(
                    "member"
                );

            if(guest)
            {
                guest.style.display =
                    "none";
            }

            if(member)
            {
                member.style.display =
                    "block";
            }

            const avatar =
                document.getElementById(
                    "avatar"
                );

            const displayName =
                document.getElementById(
                    "displayName"
                );

            const email =
                document.getElementById(
                    "email"
                );

            const role =
                document.getElementById(
                    "role"
                );

            if(avatar)
            {
                avatar.src =
                    user.photoURL;
            }

            if(displayName)
            {
                displayName.innerText =
                    user.displayName;
            }

            if(email)
            {
                email.innerText =
                    user.email;
            }

            if(role)
            {
                role.innerText =
                    profile.role;
            }
        }
        else
        {
            const guest =
                document.getElementById(
                    "guest"
                );

            const member =
                document.getElementById(
                    "member"
                );

            if(guest)
            {
                guest.style.display =
                    "block";
            }

            if(member)
            {
                member.style.display =
                    "none";
            }
        }
    }
);

window.logout =
    logout;
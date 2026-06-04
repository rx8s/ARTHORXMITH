import { auth } from "./firebase.js";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { createUser } from "./firestore.js";

const provider = new GoogleAuthProvider();

window.login = async () =>
{
    try
    {
        const result =
            await signInWithPopup(
                auth,
                provider
            );

        await createUser(
            result.user
        );
    }
    catch(error)
    {
        console.error(error);
    }
};

window.logout = async () =>
{
    await signOut(auth);
};

onAuthStateChanged(
    auth,
    (user)=>
    {
        if(user)
        {
            document
            .getElementById(
                "playerName"
            )
            .innerText =
                user.displayName;
        }
    }
);
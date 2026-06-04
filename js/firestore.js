import { db } from "./firebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

export async function createUser(user)
{
    const ref =
        doc(
            db,
            "users",
            user.uid
        );

    const snapshot =
        await getDoc(ref);

    if(!snapshot.exists())
    {
        await setDoc(
            ref,
            {
                uid:
                    user.uid,

                displayName:
                    user.displayName,

                email:
                    user.email,

                photoURL:
                    user.photoURL,

                level:1,

                exp:0,

                gold:1000,

                collection:[
                    "cat001",
                    "wolf001",
                    "slime001"
                ],

                deck:[
                    "cat001",
                    "wolf001",
                    "slime001"
                ]
            }
        );
    }
}